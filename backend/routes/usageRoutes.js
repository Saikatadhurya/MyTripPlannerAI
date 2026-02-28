const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { FEATURE_KEYS, getRemainingQuota, ensureFeaturesSeeded, initUserLimits } = require('../models/usageModel');

// Map feature ids to keys for frontend display
const FEATURE_MAP = [
  { id: 'unified', key: FEATURE_KEYS.UNIFIED_PLANNER },
  { id: 'itinerary', key: FEATURE_KEYS.ITINERARY_PLANNER },
  { id: 'itinerary_planner', key: FEATURE_KEYS.ITINERARY_PLANNER }, // LandingPage uses this ID
  { id: 'packing', key: FEATURE_KEYS.PACKING_ASSISTANT },
  { id: 'food', key: FEATURE_KEYS.FOOD_FINDER },
  { id: 'apps', key: FEATURE_KEYS.APP_FINDER },
  { id: 'music', key: FEATURE_KEYS.MUSIC_FINDER },
  { id: 'lingo', key: FEATURE_KEYS.LINGO_FINDER },
];

router.get('/quotas', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    await ensureFeaturesSeeded();
    await initUserLimits(userId);

    const results = {};
    for (const { id, key } of FEATURE_MAP) {
      const quota = await getRemainingQuota(userId, key);
      results[id] = quota; // { weekly_limit, used_count, remaining }
    }

    res.json({ success: true, quotas: results });
  } catch (error) {
    console.error('Error fetching quotas:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch quotas' });
  }
});

router.post('/increment', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { featureId } = req.body || {};
    if (!featureId) {
      return res.status(400).json({ success: false, message: 'featureId is required' });
    }

    const mapping = FEATURE_MAP.find(f => f.id === featureId);
    if (!mapping) {
      return res.status(400).json({ success: false, message: 'Invalid featureId' });
    }

    const { assertCanUseAndIncrement } = require('../models/usageModel');
    const result = await assertCanUseAndIncrement(userId, mapping.key, 1);
    res.json({ success: true, result });
  } catch (error) {
    if (error && error.code === 'LIMIT_REACHED') {
      return res.status(429).json({ success: false, message: 'Weekly limit reached', meta: error.meta });
    }
    console.error('Error incrementing usage:', error);
    res.status(500).json({ success: false, message: 'Failed to increment usage' });
  }
});

module.exports = router;


