import { ToolResult, Resolution } from './types'

/**
 * Mark a resolution as completed
 * @param input - { id: string }
 * @param resolutions - Map of all resolutions
 * @returns ToolResult with completed resolution
 */
export function completeResolution(input: any, resolutions: Map<string, Resolution>): ToolResult {
  try {
    if (!input.id) {
      return {
        success: false,
        message: 'Missing resolution ID',
        error: 'ID is required'
      }
    }

    const resolution = resolutions.get(input.id)
    if (!resolution) {
      return {
        success: false,
        message: 'Resolution not found',
        error: `Resolution with ID ${input.id} does not exist`
      }
    }

    resolution.status = 'completed'
    resolution.completedAt = new Date().toISOString()

    console.log(`🎉 Completed resolution: ${resolution.title}`)
    
    return { 
      success: true, 
      message: `Completed: "${resolution.title}" 🎉`,
      resolution 
    }
  } catch (error) {
    console.error('Error in completeResolution:', error)
    return {
      success: false,
      message: 'Failed to complete resolution',
      error: (error as Error).message
    }
  }
}
