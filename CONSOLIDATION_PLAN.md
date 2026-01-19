# API Consolidation Plan for 10 Weekly Sessions

## Current State (9 functions)

### Week 1 (Resolution Tracker) - 6 functions
1. `/api/chat.ts` - Main chat with Claude
2. `/api/chat/analytics/insights.ts` - Analytics and insights
3. `/api/chat/resolutions/list/all.ts` - List all resolutions
4. `/api/cron/nudge.ts` - Cron job for nudges (MUST stay at this path)
5. `/api/preferences.ts` - User preferences
6. `/api/sms.ts` - SMS handling

### Week 2 (Model Mapper) - 1 function
7. `w2-resolution/api/compare.ts` - Model comparison (needs to move to root)

### Week 3 (Deep Research) - 1 function
8. `/api/research.ts` - Research queries with Claude

### System - 1 function
9. `/api/health.ts` - Health check

**Problem**: Need to add w3 Redis backend (3 functions) = 12 total (at limit)
**Goal**: Consolidate to ~6 functions, leaving 6 slots for weeks 4-10

---

## Proposed Consolidation (6 functions + room for growth)

### 1. `/api/w1.ts` - Week 1 Unified Endpoint
**Consolidates**: chat.ts, preferences.ts, sms.ts, chat/resolutions/list/all.ts (4 functions → 1)

**Routes via query parameter `?action=`**:
- `POST ?action=chat` - Chat with Claude
- `GET ?action=resolutions` - List all resolutions
- `GET ?action=preferences` - Get preferences
- `PUT ?action=preferences` - Update preferences
- `POST ?action=sms` - Send SMS
- `POST ?action=sms-verify` - Verify SMS

**Why consolidated**: All related to core w1 functionality, low traffic on individual endpoints

---

### 2. `/api/w1-analytics.ts` - Week 1 Analytics (Separate)
**Keeps**: chat/analytics/insights.ts (1 function)

**Routes**:
- `GET ?resolutionId=xxx` - Get insights for resolution
- `GET` - Get all analytics

**Why separate**: Computationally intensive, different usage pattern from main chat

---

### 3. `/api/cron/nudge.ts` - Week 1 Cron (Must Stay)
**Keeps**: cron/nudge.ts (1 function)

**Why separate**: Vercel cron jobs require exact path match in vercel.json

---

### 4. `/api/w2.ts` - Week 2 Model Comparison
**Consolidates**: w2-resolution/api/compare.ts (move to root)

**Routes**:
- `POST ?action=compare` - Compare models
- Future w2 features can be added here

---

### 5. `/api/w3.ts` - Week 3 Deep Research Unified
**Consolidates**: research.ts + w3 Redis backend (4 functions → 1)

**Routes via query parameter `?action=`**:
- `POST ?action=research` - Research with Claude + auto-categorization
- `GET ?action=sessions` - List all sessions
- `GET ?action=session&sessionId=xxx` - Get specific session
- `POST ?action=session` - Create/update session
- `DELETE ?action=session&sessionId=xxx` - Delete session
- `POST ?action=query` - Add query to session
- `POST ?action=resource` - Add resource to session
- `PUT ?action=resource` - Update resource
- `DELETE ?action=resource` - Remove resource

**Why consolidated**: All related to w3 research functionality

---

### 6. `/api/health.ts` - System Health (Keep)
**Keeps**: health.ts (1 function)

**Why separate**: Simple, system-wide, no dependencies on weekly features

---

## Summary

| Current | Proposed | Savings |
|---------|----------|---------|
| 9 functions | 6 functions | **3 slots freed** |
| w1: 6 functions | w1: 3 functions | -3 |
| w2: 1 function | w2: 1 function | 0 |
| w3: 1 function | w3: 1 function (with Redis!) | +0 |
| system: 1 function | system: 1 function | 0 |

**Result**: 6 functions used, **6 slots available** for weeks 4-10

---

## Future Weeks Strategy (w4-w10)

Each future week can use **1 consolidated endpoint**:
- `/api/w4.ts` - Week 4 app (all routes)
- `/api/w5.ts` - Week 5 app (all routes)
- `/api/w6.ts` - Week 6 app (all routes)
- `/api/w7.ts` - Week 7 app (all routes)
- `/api/w8.ts` - Week 8 app (all routes)
- `/api/w9.ts` - Week 9 app (all routes)

**Final capacity**: 12 functions = w1 (3) + w2 (1) + w3 (1) + w4-w9 (6) + health (1)

If week 10 is needed:
- Option 1: Remove `/api/health.ts` (check health via w1 endpoint)
- Option 2: Consolidate w1-analytics into w1.ts
- Option 3: Consolidate w2 into a utility endpoint

---

## Implementation Order

1. ✅ Create consolidated `/api/w1.ts`
2. ✅ Create `/api/w1-analytics.ts` (rename from insights)
3. ✅ Move w2 compare to `/api/w2.ts`
4. ✅ Create consolidated `/api/w3.ts` with Redis
5. ✅ Update frontend apps to use new endpoints
6. ✅ Test all functionality
7. ✅ Delete old endpoint files
8. ✅ Deploy and verify

---

## Benefits

- ✅ **Under limit**: 6/12 functions (50% capacity)
- ✅ **Room for growth**: 6 slots for future weeks
- ✅ **w3 Redis enabled**: Persistent storage without hitting limits
- ✅ **Organized**: One endpoint per week
- ✅ **Maintainable**: Clear routing via query parameters
- ✅ **Future-proof**: Pattern established for weeks 4-10
