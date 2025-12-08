---
name: Trip Plan Generation Speed Optimization
overview: ""
todos: []
---

# Trip Plan Generation Speed Optimization

## Current Bottlenecks Identified

1. **Google Search Tool Enabled** - Adds 5-15 seconds per request
2. **Very Long Prompts** - Complex prompts take longer to process
3. **No Response Caching** - Same queries regenerate from scratch
4. **Sequential Processing** - Itinerary must finish before other steps
5. **Streaming Overhead** - May add processing time
6. **No Performance Config** - Missing timeout and optimization settings

## Optimization Strategies

### 1. Make Google Search Optional/Conditional

**Impact: High (30-40% faster)**

- Add config option to disable Google Search for faster responses
- Only enable for destinations requiring real-time data
- Use cached/synthetic data for common destinations

**Files to Modify:**

- `services/geminiService.ts` - Add `enableGoogleSearch` parameter
- Make it optional (default: false for speed)

### 2. Optimize Prompt Length

**Impact: Medium (15-20% faster)**

- Remove redundant instructions
- Consolidate validation rules
- Use shorter, more direct language
- Move some instructions to post-processing

**Files to Modify:**

- `services/geminiService.ts` - Compress `generateItinerary` prompt

### 3. Add Response Caching

**Impact: High (100% instant for cached queries)**

- Cache generated plans by query hash (destination + parameters)
- Store in localStorage/indexedDB with expiration
- Show cached results immediately while checking for updates

**Files to Create/Modify:**

- Create `services/planCache.ts` - Caching service
- Modify `services/geminiService.ts` - Check cache before API call

### 4. Add Performance Configuration

**Impact: Medium (10-15% faster)**

- Set `thinkingBudget: 0` (already done for suggestions)
- Add request timeout settings
- Configure temperature for faster responses
- Use `responseMimeType: "application/json"` for structured responses

**Files to Modify:**

- `services/geminiService.ts` - Add performance config to API calls

### 5. Parallel Processing Improvements

**Impact: Medium (20-30% faster for unified plans)**

- Already parallelizing packing/food/apps/music/lingo (good)
- Consider allowing itinerary to run in parallel with others for experienced users
- Add option to skip non-essential steps initially

**Files to Modify:**

- `App.tsx` - Optimize unified plan flow

### 6. Optimize Retry Logic

**Impact: Low (5-10% faster)**

- Reduce retry delay times
- Fail faster on certain errors
- Cache successful patterns

**Files to Modify:**

- `App.tsx` - Optimize retry delays

### 7. Add Progressive Loading

**Impact: High (Perceived speed)**

- Show partial results as they stream
- Allow user to interact with partial plan
- Continue generation in background

## Implementation Priority

**Phase 1 (Quick Wins - 40-50% improvement):**

1. Disable Google Search by default (or make conditional)
2. Add `thinkingBudget: 0` to itinerary generation
3. Add `responseMimeType: "application/json"` for structured output
4. Reduce prompt verbosity

**Phase 2 (Medium Term - 30-40% more improvement):**

1. Implement response caching
2. Optimize prompt length further
3. Add request timeout handling

**Phase 3 (Long Term - Additional 10-20%):**

1. Advanced parallel processing
2. Progressive loading improvements
3. Smart retry logic

## Expected Results

- **Before**: 30-60 seconds for full itinerary (with Google Search)
- **After Phase 1 (No Search)**: 10-20 seconds (67-83% faster)
- **After Phase 2**: 8-15 seconds (75-83% faster)
- **Cached Queries**: <1 second (instant)

## Data Quality Assurance (Without Google Search)

### How to Maintain Authenticity:

1. **Enhanced Prompt Instructions**:

- "Only recommend well-known, established attractions that appear in official tourism websites"
- "Provide specific names, not generic descriptions"
- "For restaurants: use only well-documented, popular establishments"
- "Avoid speculative or personal opinions - use factual, verifiable information"

2. **Gemini's Training Data Includes**:

- Wikipedia articles (billions of pages)
- Official tourism websites
- Travel guide content (Lonely Planet, Rough Guides, etc.)
- Restaurant review sites
- Historical and cultural databases

3. **Post-Processing Validation**:

- Check for specific names vs. vague descriptions
- Validate attraction names against common patterns
- Filter generic recommendations
- Require location details for all recommendations

## Testing Considerations

- Verify quality doesn't degrade with optimizations
- Monitor API costs (fewer calls = lower costs)
- Test edge cases with reduced prompts
- Validate cache invalidation logic