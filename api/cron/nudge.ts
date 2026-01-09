/**
 * Cron Nudge Endpoint
 * 
 * Called by Vercel Cron to process and send scheduled SMS nudges.
 * Runs every hour to check for due nudges.
 * 
 * POST /api/cron/nudge (called by Vercel Cron with CRON_SECRET)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { v4 as uuidv4 } from 'uuid'
import {
  loadResolutions,
  loadPreferences,
  getDueNudges,
  updateNudge,
  saveNudge,
  DatabaseError,
  type Resolution,
  type NudgeRecord
} from '../lib/db'
import {
  sendNudgeSMS,
  isQuietHours,
  isSMSConfigured
} from '../lib/sms'

// ============================================================================
// Nudge Scheduling Logic
// ============================================================================

/**
 * Determine which resolutions need an SMS nudge based on cadence
 */
function getResolutionsDueForNudge(
  resolutions: Resolution[],
  preferences: any
): Resolution[] {
  if (!preferences.sms.enabled || !preferences.sms.verified) {
    return []
  }

  const now = Date.now()
  const frequencyMs = {
    gentle: 7 * 24 * 60 * 60 * 1000,      // 7 days
    moderate: 3 * 24 * 60 * 60 * 1000,    // 3 days
    persistent: 1 * 24 * 60 * 60 * 1000   // 1 day
  }

  // Use in-conversation frequency for SMS too (or could add separate SMS frequency)
  const threshold = frequencyMs[preferences.inConversation.frequency] || frequencyMs.moderate

  return resolutions.filter(r => {
    if (r.status !== 'active') return false
    if (!r.updateSettings?.enabled) return false
    
    const lastNudge = r.updateSettings?.lastNudgeAt
    if (!lastNudge) return true // Never nudged
    
    const timeSince = now - new Date(lastNudge).getTime()
    return timeSince >= threshold
  })
}

/**
 * Determine nudge type based on resolution state
 */
function determineNudgeType(resolution: Resolution): NudgeRecord['type'] {
  const updates = resolution.updates || []
  
  // Check for recent updates (last 7 days)
  const recentUpdates = updates.filter(u => {
    const updateTime = new Date(u.createdAt).getTime()
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
    return updateTime > sevenDaysAgo
  })

  // Streak detection
  if (recentUpdates.length >= 3) {
    return 'streak'
  }

  // Recent setback needs encouragement
  const lastUpdate = updates[updates.length - 1]
  if (lastUpdate?.type === 'setback' || lastUpdate?.sentiment === 'struggling') {
    return 'encouragement'
  }

  // Milestone approaching
  const progressUpdates = updates.filter(u => u.type === 'progress' || u.type === 'milestone')
  if (progressUpdates.length > 0 && progressUpdates.length % 5 === 4) {
    return 'milestone'
  }

  // No recent activity
  if (recentUpdates.length === 0) {
    return 'gentle_nudge'
  }

  return 'check_in'
}

/**
 * Create scheduled nudge record
 */
function createScheduledNudge(resolution: Resolution, type: NudgeRecord['type']): NudgeRecord {
  return {
    id: uuidv4(),
    resolutionId: resolution.id,
    channel: 'sms',
    scheduledAt: new Date().toISOString(),
    deliveredAt: null,
    status: 'scheduled',
    type,
    message: '', // Will be generated on send
    responseAt: null,
    responseContent: null,
    responseSentiment: null,
    createdAt: new Date().toISOString()
  }
}

// ============================================================================
// Handler
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify cron secret for security
  const cronSecret = req.headers['authorization']?.replace('Bearer ', '')
  const expectedSecret = process.env.CRON_SECRET

  if (expectedSecret && cronSecret !== expectedSecret) {
    console.log('[Cron] Unauthorized request')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Only allow POST for cron jobs
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowed: ['POST']
    })
  }

  const startTime = Date.now()
  const results = {
    processed: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    errors: [] as string[],
    smsConfigured: isSMSConfigured()
  }

  try {
    // Load data
    let resolutions: Map<string, Resolution>
    let preferences: any
    
    try {
      resolutions = await loadResolutions()
      preferences = await loadPreferences()
    } catch (error) {
      if (error instanceof DatabaseError) {
        console.error('[Cron] Database error:', error.details)
        return res.status(503).json({
          error: 'Database unavailable',
          details: error.details
        })
      }
      throw error
    }

    // Check if SMS is enabled at all
    if (!preferences.sms.enabled) {
      console.log('[Cron] SMS not enabled, skipping')
      return res.status(200).json({
        message: 'SMS not enabled',
        ...results,
        durationMs: Date.now() - startTime
      })
    }

    // Check quiet hours
    if (isQuietHours(preferences)) {
      console.log('[Cron] Currently in quiet hours, skipping')
      return res.status(200).json({
        message: 'In quiet hours',
        ...results,
        durationMs: Date.now() - startTime
      })
    }

    // Process due nudges first (previously scheduled)
    const dueNudges = await getDueNudges()
    console.log(`[Cron] Found ${dueNudges.length} due nudges`)

    for (const nudge of dueNudges) {
      results.processed++
      
      const resolution = resolutions.get(nudge.resolutionId)
      if (!resolution) {
        nudge.status = 'skipped'
        await updateNudge(nudge)
        results.skipped++
        continue
      }

      // Send SMS
      const sendResult = await sendNudgeSMS(nudge, resolution, preferences)
      
      if (sendResult.success) {
        nudge.status = 'delivered'
        nudge.deliveredAt = new Date().toISOString()
        results.sent++
        
        // Update resolution stats
        if (resolution.updateSettings) {
          resolution.updateSettings.lastNudgeAt = new Date().toISOString()
          resolution.updateSettings.nudgeCount++
        }
      } else {
        nudge.status = 'failed'
        results.failed++
        results.errors.push(`${resolution.title}: ${sendResult.error}`)
      }

      await updateNudge(nudge)
    }

    // Schedule new nudges for resolutions that are due
    const resolutionsList = Array.from(resolutions.values())
    const dueResolutions = getResolutionsDueForNudge(resolutionsList, preferences)
    console.log(`[Cron] ${dueResolutions.length} resolutions due for new nudge`)

    // Limit to maxNudgesPerDay
    const nudgesToday = dueResolutions.slice(0, preferences.defaultCadence.maxNudgesPerDay)

    for (const resolution of nudgesToday) {
      const type = determineNudgeType(resolution)
      const nudge = createScheduledNudge(resolution, type)
      
      // For immediate processing, try to send now
      const sendResult = await sendNudgeSMS(nudge, resolution, preferences)
      
      if (sendResult.success) {
        nudge.status = 'delivered'
        nudge.deliveredAt = new Date().toISOString()
        results.sent++
        
        // Update resolution stats
        if (resolution.updateSettings) {
          resolution.updateSettings.lastNudgeAt = new Date().toISOString()
          resolution.updateSettings.nudgeCount++
        }
      } else {
        nudge.status = 'failed'
        results.failed++
        results.errors.push(`${resolution.title}: ${sendResult.error}`)
      }

      await saveNudge(nudge)
      results.processed++
    }

    // Save updated resolutions
    const { saveResolutions } = await import('../lib/db')
    await saveResolutions(resolutions)

    const duration = Date.now() - startTime
    console.log(`[Cron] Completed in ${duration}ms: ${results.sent} sent, ${results.skipped} skipped, ${results.failed} failed`)

    return res.status(200).json({
      message: 'Nudge cron completed',
      ...results,
      durationMs: duration
    })

  } catch (error) {
    console.error('[Cron] Error:', error)
    return res.status(500).json({
      error: 'Cron job failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      ...results,
      durationMs: Date.now() - startTime
    })
  }
}
