import { v4 as uuidv4 } from 'uuid'
import { ToolResult, Resolution } from './types'
import { 
  ResolutionCadence, 
  Milestone,
  getCadenceProgressSummary 
} from '../lib/db.js'

interface ConfigureCadenceInput {
  resolution_id: string
  frequency: number                    // How many times (e.g., 1, 3, 5)
  period: 'day' | 'week' | 'month'     // Per what period
  target_days?: number[]               // Optional: specific days (0=Sun, 6=Sat)
  milestones?: {                       // Optional: milestones to track
    title: string
    target: number
    unit?: string
  }[]
}

/**
 * Configure the activity cadence for a resolution.
 * 
 * This tool sets up how often an activity should be performed and optionally
 * creates milestones to track progress toward.
 * 
 * Examples:
 * - "I want to hike once a week" → { frequency: 1, period: 'week' }
 * - "Exercise 3 times per week" → { frequency: 3, period: 'week' }
 * - "Read daily" → { frequency: 1, period: 'day' }
 * - "Meditate 5 times a week, aiming for 100 sessions total"
 *   → { frequency: 5, period: 'week', milestones: [{ title: 'Complete 100 sessions', target: 100 }] }
 * 
 * @param input - Cadence configuration
 * @param resolutions - Map of all resolutions
 * @returns ToolResult with updated resolution
 */
export function configureCadence(
  input: ConfigureCadenceInput,
  resolutions: Map<string, Resolution>
): ToolResult {
  try {
    const { 
      resolution_id, 
      frequency, 
      period,
      target_days,
      milestones
    } = input

    // Validate required fields
    if (!resolution_id) {
      return {
        success: false,
        message: 'Resolution ID required',
        error: 'resolution_id is required to configure cadence'
      }
    }

    if (!frequency || frequency < 1) {
      return {
        success: false,
        message: 'Invalid frequency',
        error: 'frequency must be at least 1'
      }
    }

    if (!period || !['day', 'week', 'month'].includes(period)) {
      return {
        success: false,
        message: 'Invalid period',
        error: 'period must be one of: day, week, month'
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

    // Build human-readable description
    const periodLabel = period === 'day' ? 'daily' : 
                        period === 'week' ? 'per week' : 'per month'
    const description = frequency === 1 
      ? `once ${periodLabel.replace('per ', '')}` 
      : `${frequency} times ${periodLabel}`

    // Create the cadence configuration
    const cadence: ResolutionCadence = {
      frequency,
      period,
      targetDays: target_days,
      description
    }

    // Set cadence on resolution
    resolution.cadence = cadence

    // Initialize activity completions array if not present
    if (!resolution.activityCompletions) {
      resolution.activityCompletions = []
    }

    // Create milestones if provided
    if (milestones && milestones.length > 0) {
      resolution.milestones = milestones.map(m => ({
        id: uuidv4(),
        title: m.title,
        target: m.target,
        current: 0,
        unit: m.unit,
        createdAt: new Date().toISOString()
      }))
    }

    // Update resolution's updatedAt
    resolution.updatedAt = new Date().toISOString()

    // Build response message
    let message = `✅ Cadence set for "${resolution.title}": ${description}`
    
    if (resolution.milestones && resolution.milestones.length > 0) {
      message += `\n📍 Milestones created:`
      for (const m of resolution.milestones) {
        message += `\n   • ${m.title} (${m.current}/${m.target}${m.unit ? ' ' + m.unit : ''})`
      }
    }

    // Get current progress summary
    const progressSummary = getCadenceProgressSummary(resolution)
    if (progressSummary) {
      message += `\n📊 Current: ${progressSummary}`
    }

    console.log(`⚙️ Configured cadence for "${resolution.title}": ${description}`)

    return {
      success: true,
      message,
      resolution
    }
  } catch (error) {
    console.error('Error in configureCadence:', error)
    return {
      success: false,
      message: 'Failed to configure cadence',
      error: (error as Error).message
    }
  }
}
