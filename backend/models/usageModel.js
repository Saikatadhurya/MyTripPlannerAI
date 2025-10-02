const { pool } = require('../config/db');

// Feature keys
const FEATURE_KEYS = {
  UNIFIED_PLANNER: 'unified_planner',
  FOOD_FINDER: 'food_finder',
  MUSIC_FINDER: 'music_finder',
  PACKING_ASSISTANT: 'packing_assistant',
  LINGO_FINDER: 'lingo_finder',
  APP_FINDER: 'app_finder',
};

// Default weekly limits
const DEFAULT_LIMITS = {
  [FEATURE_KEYS.UNIFIED_PLANNER]: { display_name: 'Unified Planner', weekly_limit: 5 },
  [FEATURE_KEYS.FOOD_FINDER]: { display_name: 'Food Finder', weekly_limit: 2 },
  [FEATURE_KEYS.MUSIC_FINDER]: { display_name: 'Music Finder', weekly_limit: 2 },
  [FEATURE_KEYS.PACKING_ASSISTANT]: { display_name: 'Packing Assistant', weekly_limit: 2 },
  [FEATURE_KEYS.LINGO_FINDER]: { display_name: 'Lingo Finder', weekly_limit: 2 },
  [FEATURE_KEYS.APP_FINDER]: { display_name: 'App Finder', weekly_limit: 2 },
};

function getCurrentWeekStartDateSql() {
  // Postgres expression for week start (UTC)
  return `date_trunc('week', timezone('UTC', now()))::date`;
}

async function ensureFeaturesSeeded() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [key, { display_name, weekly_limit }] of Object.entries(DEFAULT_LIMITS)) {
      await client.query(
        `INSERT INTO planora.features (key, display_name, weekly_limit)
         VALUES ($1, $2, $3)
         ON CONFLICT (key) DO UPDATE SET display_name = EXCLUDED.display_name`,
        [key, display_name, weekly_limit]
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function initUserLimits(userId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Ensure features exist
    await ensureFeaturesSeeded();
    // Set per-feature user limits to current feature weekly_limit defaults
    for (const featureKey of Object.keys(DEFAULT_LIMITS)) {
      await client.query(
        `INSERT INTO planora.user_feature_limits (user_id, feature_key, weekly_limit)
         SELECT $1, f.key, f.weekly_limit
         FROM planora.features f
         WHERE f.key = $2
         ON CONFLICT (user_id, feature_key) DO NOTHING`,
        [userId, featureKey]
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getRemainingQuota(userId, featureKey) {
  const client = await pool.connect();
  try {
    const weekStartSql = getCurrentWeekStartDateSql();
    const query = `
      WITH limits AS (
        SELECT ufl.weekly_limit
        FROM planora.user_feature_limits ufl
        WHERE ufl.user_id = $1 AND ufl.feature_key = $2
      ), usage AS (
        SELECT used_count
        FROM planora.user_weekly_usage u
        WHERE u.user_id = $1 AND u.feature_key = $2 AND u.week_start = ${weekStartSql}
      )
      SELECT
        COALESCE((SELECT weekly_limit FROM limits), 0) AS weekly_limit,
        COALESCE((SELECT used_count FROM usage), 0) AS used_count`;

    const res = await client.query(query, [userId, featureKey]);
    if (res.rows.length === 0) {
      return { weekly_limit: 0, used_count: 0, remaining: 0 };
    }
    const { weekly_limit, used_count } = res.rows[0];
    const remaining = Math.max(weekly_limit - used_count, 0);
    return { weekly_limit, used_count, remaining };
  } finally {
    client.release();
  }
}

async function assertCanUseAndIncrement(userId, featureKey, incrementBy = 1) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the user's limit row
    const limitRes = await client.query(
      `SELECT weekly_limit FROM planora.user_feature_limits WHERE user_id = $1 AND feature_key = $2 FOR UPDATE`,
      [userId, featureKey]
    );
    if (limitRes.rows.length === 0) {
      // If not present, initialize from features
      await client.query(
        `INSERT INTO planora.user_feature_limits (user_id, feature_key, weekly_limit)
         SELECT $1, f.key, f.weekly_limit FROM planora.features f WHERE f.key = $2
         ON CONFLICT (user_id, feature_key) DO NOTHING`,
        [userId, featureKey]
      );
    }

    const limitRes2 = await client.query(
      `SELECT weekly_limit FROM planora.user_feature_limits WHERE user_id = $1 AND feature_key = $2 FOR UPDATE`,
      [userId, featureKey]
    );
    if (limitRes2.rows.length === 0) {
      throw new Error('Limit configuration not found for user and feature');
    }
    const weeklyLimit = limitRes2.rows[0].weekly_limit;

    // Upsert usage row for current week and lock it
    const weekStartSql = getCurrentWeekStartDateSql();
    await client.query(
      `INSERT INTO planora.user_weekly_usage (user_id, feature_key, week_start, used_count)
       VALUES ($1, $2, ${weekStartSql}, 0)
       ON CONFLICT (user_id, feature_key, week_start) DO NOTHING`,
      [userId, featureKey]
    );

    const usageRes = await client.query(
      `SELECT used_count FROM planora.user_weekly_usage
       WHERE user_id = $1 AND feature_key = $2 AND week_start = ${weekStartSql}
       FOR UPDATE`,
      [userId, featureKey]
    );

    const currentUsed = usageRes.rows.length > 0 ? usageRes.rows[0].used_count : 0;
    if (currentUsed + incrementBy > weeklyLimit) {
      await client.query('ROLLBACK');
      const remaining = Math.max(weeklyLimit - currentUsed, 0);
      const error = new Error('Weekly limit reached');
      error.code = 'LIMIT_REACHED';
      error.meta = { weekly_limit: weeklyLimit, used_count: currentUsed, remaining };
      throw error;
    }

    await client.query(
      `UPDATE planora.user_weekly_usage
       SET used_count = used_count + $3, updated_at = now()
       WHERE user_id = $1 AND feature_key = $2 AND week_start = ${weekStartSql}`,
      [userId, featureKey, incrementBy]
    );

    await client.query('COMMIT');
    return { weekly_limit: weeklyLimit, used_count: currentUsed + incrementBy, remaining: weeklyLimit - (currentUsed + incrementBy) };
  } catch (error) {
    // If we threw LIMIT_REACHED above, ensure transaction is not left open
    try { await pool.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    // If transaction was committed, release; if already rolled back, still release
    // eslint-disable-next-line no-unsafe-finally
    client.release();
  }
}

module.exports = {
  FEATURE_KEYS,
  DEFAULT_LIMITS,
  ensureFeaturesSeeded,
  initUserLimits,
  getRemainingQuota,
  assertCanUseAndIncrement,
};


