import { ToolResult } from './types'

/**
 * Delete a resolution permanently
 * @param input - { id: string }
 * @param resolutions - Map of all resolutions
 * @returns ToolResult with deletion confirmation
 */
export function deleteResolution(input: any, resolutions: Map<string, any>): ToolResult {
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

    const title = resolution.title
    resolutions.delete(input.id)
    
    console.log(`🗑️ Deleted resolution: ${title}`)
    
    return { 
      success: true, 
      message: `Deleted resolution: "${title}"`
    }
  } catch (error) {
    console.error('Error in deleteResolution:', error)
    return {
      success: false,
      message: 'Failed to delete resolution',
      error: (error as Error).message
    }
  }
}
