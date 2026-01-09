import { v4 as uuidv4 } from 'uuid'
import { ToolResult, Resolution, Update } from './types'

interface LogUpdateInput {
  resolution_id: string
  type: 'progress' | 'setback' | 'milestone' | 'note'
  content: string
  sentiment?: 'positive' | 'neutral' | 'struggling'
  progress_delta?: number  // -100 to 100
  triggered_by?: 'user' | 'nudge' | 'sms'
}

/**
 * Log a progress update for a resolution
 * 
 * This tool records progress updates, setbacks, milestones, and notes
 * for tracking resolution progress over time.
 * 
 * @param input - Update details
 * @param resolutions - Map of all resolutions
 * @returns ToolResult with the logged update
 */
export function logUpdate(
  input: LogUpdateInput,
  resolutions: Map<string, Resolution>
): ToolResult {
  try {
    const { 
      resolution_id, 
      type, 
      content, 
      sentiment, 
      progress_delta,
      triggered_by = 'user'
    } = input

    // Validate required fields
    if (!resolution_id) {
      return {
        success: false,
        message: 'Resolution ID required',
        error: 'resolution_id is required to log an update'
      }
    }

    if (!type) {
      return {
        success: false,
        message: 'Update type required',
        error: 'type must be one of: progress, setback, milestone, note'
      }
    }

    if (!content || content.trim() === '') {
      return {
        success: false,
        message: 'Content required',
        error: 'Update content cannot be empty'
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

    // Validate progress_delta if provided
    if (progress_delta !== undefined) {
      if (progress_delta < -100 || progress_delta > 100) {
        return {
          success: false,
          message: 'Invalid progress delta',
          error: 'progress_delta must be between -100 and 100'
        }
      }
    }

    // Create the update
    const update: Update = {
      id: uuidv4(),
      type,
      content: content.trim(),
      sentiment,
      progressDelta: progress_delta,
      createdAt: new Date().toISOString(),
      triggeredBy: triggered_by
    }

    // Add to resolution's updates array
    if (!resolution.updates) {
      resolution.updates = []
    }
    resolution.updates.push(update)

    // Update resolution's updatedAt
    resolution.updatedAt = new Date().toISOString()

    // If this was triggered by a nudge, update the resolution's nudge response rate
    if (triggered_by === 'nudge') {
      const nudgeCount = resolution.updateSettings.nudgeCount || 0
      const currentResponses = (resolution.updateSettings.responseRate || 0) * nudgeCount
      resolution.updateSettings.responseRate = (currentResponses + 1) / (nudgeCount || 1)
    }

    // Generate appropriate message based on type
    let message = ''
    const emoji = getUpdateEmoji(type, sentiment)

    switch (type) {
      case 'progress':
        message = `${emoji} Progress logged for "${resolution.title}"`
        if (progress_delta && progress_delta > 0) {
          message += ` (+${progress_delta}%)`
        }
        break
      case 'setback':
        message = `${emoji} Setback noted for "${resolution.title}"`
        if (progress_delta && progress_delta < 0) {
          message += ` (${progress_delta}%)`
        }
        break
      case 'milestone':
        message = `${emoji} Milestone achieved for "${resolution.title}"!`
        break
      case 'note':
        message = `${emoji} Note added to "${resolution.title}"`
        break
    }

    console.log(`📝 ${message}: ${content.substring(0, 50)}...`)

    return {
      success: true,
      message,
      resolution,
      update
    }
  } catch (error) {
    console.error('Error in logUpdate:', error)
    return {
      success: false,
      message: 'Failed to log update',
      error: (error as Error).message
    }
  }
}

/**
 * Get an appropriate emoji for the update type and sentiment
 */
function getUpdateEmoji(type: string, sentiment?: string): string {
  if (type === 'milestone') return '🎯'
  if (type === 'setback') return '💪' // Encouraging even on setbacks
  if (type === 'note') return '📝'
  
  // Progress with sentiment
  if (sentiment === 'positive') return '✨'
  if (sentiment === 'struggling') return '🤝'
  return '📊'
}
