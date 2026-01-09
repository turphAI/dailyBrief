/**
 * Nudge Service
 * 
 * Handles decision logic for when to nudge the user about their resolutions,
 * and generates appropriate nudge context for Claude.
 */

import { v4 as uuidv4 } from 'uuid'
import type { 
  Resolution, 
  UserPreferences, 
  NudgeRecord 
} from '../lib/db.js'
import { 
  hasMetCadenceTarget, 
  calculateCadenceProgress,
  getCadenceProgressSummary 
} from '../lib/db.js'

// ============================================================================
// Types
// ============================================================================

export interface NudgeDecision {
  shouldNudge: boolean
  resolutionId?: string
  resolutionTitle?: string
  type?: NudgeRecord['type']
  reason?: string
  daysSinceLastNudge?: number
  cadenceProgress?: {
    completedCount: number
    targetCount: number
    remainingCount: number
    periodStart: string
    periodEnd: string
  }
}

export interface NudgeContext {
  hasNudge: boolean
  nudgeId?: string
  resolutionId?: string
  resolutionTitle?: string
  type?: NudgeRecord['type']
  prompt?: string
  reason?: string
}

// ============================================================================
// Frequency Thresholds (in milliseconds)
// ============================================================================

const FREQUENCY_THRESHOLDS = {
  gentle: 7 * 24 * 60 * 60 * 1000,      // 7 days
  moderate: 3 * 24 * 60 * 60 * 1000,    // 3 days
  persistent: 1 * 24 * 60 * 60 * 1000   // 1 day
}

// Maximum nudges per session to prevent annoyance
const MAX_NUDGES_PER_SESSION = 1

// ============================================================================
// Decision Logic
// ============================================================================

/**
 * Determine if we should nudge the user about a resolution.
 * 
 * Considers:
 * - Global and per-resolution update settings
 * - Time since last nudge
 * - Frequency preferences
 * - Number of active resolutions
 */
export function shouldNudge(
  preferences: UserPreferences,
  resolutions: Resolution[],
  sessionNudgeCount: number = 0
): NudgeDecision {
  // Check if updates are globally enabled
  if (!preferences.updatesEnabled) {
    return { shouldNudge: false, reason: 'Updates disabled globally' }
  }

  // Check if in-conversation nudges are enabled
  if (!preferences.inConversation.enabled) {
    return { shouldNudge: false, reason: 'In-conversation nudges disabled' }
  }

  // Check session limit
  if (sessionNudgeCount >= MAX_NUDGES_PER_SESSION) {
    return { shouldNudge: false, reason: 'Session nudge limit reached' }
  }

  // Get active resolutions with updates enabled
  const activeResolutions = resolutions.filter(r => 
    r.status === 'active' && 
    r.updateSettings?.enabled !== false // enabled by default
  )

  if (activeResolutions.length === 0) {
    return { shouldNudge: false, reason: 'No active resolutions with updates enabled' }
  }

  // Filter out resolutions that have already met their cadence target for this period
  const resolutionsNeedingAttention = activeResolutions.filter(r => {
    // If resolution has a cadence, check if target is met
    if (r.cadence) {
      const hasMet = hasMetCadenceTarget(r)
      if (hasMet) {
        console.log(`[Nudge] Skipping "${r.title}" - cadence target already met for this period`)
        return false
      }
    }
    return true
  })

  if (resolutionsNeedingAttention.length === 0) {
    return { shouldNudge: false, reason: 'All resolutions with cadence have met their targets' }
  }

  // Get frequency threshold
  const threshold = FREQUENCY_THRESHOLDS[preferences.inConversation.frequency]

  // Find resolution most in need of check-in
  // Sort by longest time since last nudge, prioritizing those with cadence not yet met
  const now = Date.now()
  const candidates = resolutionsNeedingAttention
    .map(r => {
      const lastNudge = r.updateSettings?.lastNudgeAt
      const timeSince = lastNudge 
        ? now - new Date(lastNudge).getTime()
        : Infinity
      
      // Get cadence progress for priority scoring
      const progress = calculateCadenceProgress(r)
      
      return { 
        resolution: r, 
        timeSince,
        cadenceProgress: progress
      }
    })
    .filter(c => c.timeSince >= threshold)
    .sort((a, b) => {
      // Prioritize resolutions behind on cadence
      if (a.cadenceProgress && b.cadenceProgress) {
        // Lower completion rate = higher priority
        const aUrgency = 1 - a.cadenceProgress.completionRate
        const bUrgency = 1 - b.cadenceProgress.completionRate
        if (aUrgency !== bUrgency) {
          return bUrgency - aUrgency
        }
      }
      // Fall back to time since last nudge
      return b.timeSince - a.timeSince
    })

  if (candidates.length === 0) {
    return { shouldNudge: false, reason: 'No resolutions due for nudge' }
  }

  const candidate = candidates[0]
  const daysSince = Math.floor(candidate.timeSince / (24 * 60 * 60 * 1000))

  // Determine nudge type based on context
  const type = determineNudgeType(candidate.resolution, daysSince)

  // Build cadence progress info if available
  const cadenceProgressInfo = candidate.cadenceProgress ? {
    completedCount: candidate.cadenceProgress.completedCount,
    targetCount: candidate.cadenceProgress.targetCount,
    remainingCount: candidate.cadenceProgress.remainingCount,
    periodStart: candidate.cadenceProgress.periodStart,
    periodEnd: candidate.cadenceProgress.periodEnd
  } : undefined

  return {
    shouldNudge: true,
    resolutionId: candidate.resolution.id,
    resolutionTitle: candidate.resolution.title,
    type,
    reason: daysSince === Infinity 
      ? 'Never checked in on this resolution'
      : `${daysSince} days since last check-in`,
    daysSinceLastNudge: daysSince === Infinity ? undefined : daysSince,
    cadenceProgress: cadenceProgressInfo
  }
}

/**
 * Determine the type of nudge based on resolution context
 */
function determineNudgeType(resolution: Resolution, daysSince: number): NudgeRecord['type'] {
  // Check for streaks (multiple recent updates)
  const recentUpdates = (resolution.updates || []).filter(u => {
    const updateTime = new Date(u.createdAt).getTime()
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
    return updateTime > sevenDaysAgo
  })

  if (recentUpdates.length >= 3) {
    return 'streak'
  }

  // Check for recent setbacks that need encouragement
  const lastUpdate = resolution.updates?.[resolution.updates.length - 1]
  if (lastUpdate?.type === 'setback' || lastUpdate?.sentiment === 'struggling') {
    return 'encouragement'
  }

  // Check for approaching milestones (based on update count)
  const progressUpdates = (resolution.updates || []).filter(u => 
    u.type === 'progress' || u.type === 'milestone'
  )
  if (progressUpdates.length > 0 && progressUpdates.length % 5 === 4) {
    return 'milestone' // About to hit a multiple of 5
  }

  // Default based on time
  if (daysSince > 7 || daysSince === Infinity) {
    return 'gentle_nudge'
  }

  return 'check_in'
}

// ============================================================================
// Context Generation
// ============================================================================

/**
 * Generate nudge context to inject into the conversation.
 * This context is prepended to the system prompt to guide Claude's response.
 */
export function generateNudgeContext(decision: NudgeDecision): NudgeContext {
  if (!decision.shouldNudge) {
    return { hasNudge: false }
  }

  const nudgeId = uuidv4()
  
  // Generate appropriate prompt based on nudge type
  const prompt = generateNudgePrompt(decision)

  return {
    hasNudge: true,
    nudgeId,
    resolutionId: decision.resolutionId,
    resolutionTitle: decision.resolutionTitle,
    type: decision.type,
    prompt,
    reason: decision.reason
  }
}

/**
 * Generate the nudge prompt based on type
 */
function generateNudgePrompt(decision: NudgeDecision): string {
  const title = decision.resolutionTitle || 'their resolution'
  
  // Get cadence context if available
  let cadenceContext = ''
  if (decision.cadenceProgress) {
    const { completedCount, targetCount, remainingCount } = decision.cadenceProgress
    const periodName = decision.cadenceProgress.periodEnd 
      ? getPeriodName(new Date(decision.cadenceProgress.periodStart), new Date(decision.cadenceProgress.periodEnd))
      : 'this period'
    
    if (completedCount === 0) {
      cadenceContext = ` They haven't logged any activities for ${periodName} yet (target: ${targetCount}).`
    } else if (remainingCount > 0) {
      cadenceContext = ` They've done ${completedCount}/${targetCount} ${periodName} (${remainingCount} to go).`
    }
  }
  
  switch (decision.type) {
    case 'check_in':
      return `[NUDGE CONTEXT] It's been a few days since Turph updated on "${title}".${cadenceContext} ` +
        `Naturally weave in a question about their progress. Keep it warm and casual, not pushy. ` +
        `If they mention completing an activity, use log_activity_completion to record it. ` +
        `Example: "By the way, how's ${title} going lately?"`

    case 'gentle_nudge':
      return `[NUDGE CONTEXT] It's been over a week since Turph checked in on "${title}".${cadenceContext} ` +
        `Gently ask about their progress without being intrusive. ` +
        `If they mention completing an activity, use log_activity_completion to record it. ` +
        `Example: "I noticed we haven't talked about ${title} in a while - how are things going with that?"`

    case 'encouragement':
      return `[NUDGE CONTEXT] Turph was struggling with "${title}" last time.${cadenceContext} ` +
        `Check in with empathy and support. Focus on what might be blocking them. ` +
        `Example: "I remember ${title} was tough last time - how are you feeling about it now?"`

    case 'streak':
      return `[NUDGE CONTEXT] Turph has been on a streak with "${title}"!${cadenceContext} ` +
        `Acknowledge their consistency and ask about their progress. ` +
        `Example: "You've been really consistent with ${title} lately - that's awesome! How's it feeling?"`

    case 'milestone':
      return `[NUDGE CONTEXT] Turph might be approaching a milestone with "${title}".${cadenceContext} ` +
        `Ask about their progress and be ready to celebrate if they've hit it. ` +
        `Example: "How's ${title} coming along? You've been making great progress!"`

    default:
      return `[NUDGE CONTEXT] Check in on "${title}" with Turph naturally.${cadenceContext}`
  }
}

/**
 * Get a human-readable period name
 */
function getPeriodName(start: Date, end: Date): string {
  const diffDays = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
  
  if (diffDays <= 1) return 'today'
  if (diffDays <= 7) return 'this week'
  return 'this month'
}

// ============================================================================
// Nudge Record Creation
// ============================================================================

/**
 * Create a nudge record for tracking
 */
export function createNudgeRecord(
  context: NudgeContext,
  channel: 'in_conversation' | 'sms' = 'in_conversation'
): NudgeRecord | null {
  if (!context.hasNudge || !context.nudgeId || !context.resolutionId) {
    return null
  }

  return {
    id: context.nudgeId,
    resolutionId: context.resolutionId,
    channel,
    scheduledAt: new Date().toISOString(),
    deliveredAt: new Date().toISOString(), // Delivered immediately for in-conversation
    status: 'delivered',
    type: context.type || 'check_in',
    message: context.prompt || '',
    responseAt: null,
    responseContent: null,
    responseSentiment: null,
    createdAt: new Date().toISOString()
  }
}

/**
 * Update resolution stats after a nudge
 */
export function updateResolutionNudgeStats(resolution: Resolution): void {
  if (!resolution.updateSettings) {
    return
  }

  resolution.updateSettings.lastNudgeAt = new Date().toISOString()
  resolution.updateSettings.nudgeCount = (resolution.updateSettings.nudgeCount || 0) + 1
}

/**
 * Mark a nudge as responded to
 */
export function markNudgeResponded(
  nudge: NudgeRecord,
  content: string,
  sentiment: 'positive' | 'neutral' | 'struggling'
): NudgeRecord {
  return {
    ...nudge,
    status: 'responded',
    responseAt: new Date().toISOString(),
    responseContent: content,
    responseSentiment: sentiment
  }
}
