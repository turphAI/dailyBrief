import { v4 as uuidv4 } from 'uuid'
import { ToolResult, Resolution } from './types'
import { 
  ActivityCompletion, 
  getCurrentPeriodBounds, 
  calculateCadenceProgress,
  getCadenceProgressSummary
} from '../lib/db.js'

interface LogActivityCompletionInput {
  resolution_id: string
  description: string                  // What was completed: "Hiked Mt. Washington"
  completed_at?: string                // Optional ISO timestamp (defaults to now)
  original_message?: string            // The user's original message
}

/**
 * Log an activity completion for a resolution with a recurring cadence.
 * 
 * This tool is used when the user reports completing an activity that contributes
 * to their resolution goal. For example:
 * - "I just hiked Mt. Washington!" → logs completion for hiking resolution
 * - "Did my morning run" → logs completion for exercise resolution
 * - "Read another chapter" → logs completion for reading resolution
 * 
 * The tool:
 * 1. Records the completion with timestamp
 * 2. Updates progress toward cadence goal (e.g., 2/3 this week)
 * 3. Updates milestone progress if applicable
 * 4. Returns current period status for feedback
 * 
 * @param input - Activity completion details
 * @param resolutions - Map of all resolutions
 * @returns ToolResult with completion status and progress update
 */
export function logActivityCompletion(
  input: LogActivityCompletionInput,
  resolutions: Map<string, Resolution>
): ToolResult {
  try {
    const { 
      resolution_id, 
      description, 
      completed_at,
      original_message 
    } = input

    // Validate required fields
    if (!resolution_id) {
      return {
        success: false,
        message: 'Resolution ID required',
        error: 'resolution_id is required to log an activity completion'
      }
    }

    if (!description || description.trim() === '') {
      return {
        success: false,
        message: 'Description required',
        error: 'A description of what was completed is required'
      }
    }

    // Find the resolution
    const resolution = resolutions.get(resolution_id)
    if (!resolution) {
      return {
        success: false,
        message: 'Resolution not found',
        error: `Resolution with ID "${resolution_id}" does not exist`
      }
    }

    // Determine the completion timestamp
    const completionTime = completed_at 
      ? new Date(completed_at) 
      : new Date()

    // Get the period bounds for the completion
    const period = resolution.cadence?.period || 'week'
    const { start, end } = getCurrentPeriodBounds(period, completionTime)

    // Create the activity completion record
    const completion: ActivityCompletion = {
      id: uuidv4(),
      timestamp: completionTime.toISOString(),
      description: description.trim(),
      matchedFromMessage: original_message,
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      createdAt: new Date().toISOString()
    }

    // Initialize array if needed and add completion
    if (!resolution.activityCompletions) {
      resolution.activityCompletions = []
    }
    resolution.activityCompletions.push(completion)

    // Update resolution's updatedAt
    resolution.updatedAt = new Date().toISOString()

    // Update milestone progress if there are milestones
    let milestoneUpdate: string | null = null
    if (resolution.milestones && resolution.milestones.length > 0) {
      // Find first incomplete milestone and increment
      const incompleteMilestone = resolution.milestones.find(m => !m.completedAt)
      if (incompleteMilestone) {
        incompleteMilestone.current += 1
        
        // Check if milestone was just completed
        if (incompleteMilestone.current >= incompleteMilestone.target) {
          incompleteMilestone.completedAt = new Date().toISOString()
          milestoneUpdate = `🎯 Milestone achieved: "${incompleteMilestone.title}"!`
        } else {
          milestoneUpdate = `Progress on "${incompleteMilestone.title}": ${incompleteMilestone.current}/${incompleteMilestone.target}`
        }
      }
    }

    // Calculate cadence progress
    const progress = calculateCadenceProgress(resolution)
    const progressSummary = getCadenceProgressSummary(resolution)

    // Build response message
    let message = `✅ Logged: "${description}"`
    
    if (progressSummary) {
      message += `\n📊 ${progressSummary}`
    }
    
    if (milestoneUpdate) {
      message += `\n${milestoneUpdate}`
    }

    // Add encouragement if they just hit their target
    if (progress?.isOnTrack && progress.completedCount === progress.targetCount) {
      message += `\n🎉 You've hit your target for ${period === 'week' ? 'this week' : period === 'month' ? 'this month' : 'today'}!`
    }

    console.log(`✅ Activity logged for "${resolution.title}": ${description}`)

    return {
      success: true,
      message,
      resolution,
      activityCompletion: completion,
      cadenceProgress: progress
    }
  } catch (error) {
    console.error('Error in logActivityCompletion:', error)
    return {
      success: false,
      message: 'Failed to log activity completion',
      error: (error as Error).message
    }
  }
}
