import { v4 as uuidv4 } from 'uuid'
import { ToolResult, Resolution } from './types'

/**
 * Create a new resolution with measurable criteria
 * @param input - { title: string, measurable_criteria: string, context?: string }
 * @param resolutions - Map of all resolutions
 * @returns ToolResult with created resolution
 */
export function createResolution(input: any, resolutions: Map<string, Resolution>): ToolResult {
  try {
    const activeResolutions = Array.from(resolutions.values()).filter(
      (r) => r.status === 'active'
    )
    
    if (activeResolutions.length >= 5) {
      return {
        success: false,
        message: 'Resolution limit reached',
        error: 'You have reached the 5-resolution limit. Complete or delete one first.'
      }
    }

    if (!input.title || !input.measurable_criteria) {
      return {
        success: false,
        message: 'Missing required fields',
        error: 'Title and measurable_criteria are required'
      }
    }

    const id = uuidv4()
    const resolution: Resolution = {
      id,
      title: input.title,
      measurable_criteria: input.measurable_criteria,
      context: input.context || '',
      status: 'active',
      createdAt: new Date().toISOString(),
      updates: [],
      completedAt: undefined
    }

    resolutions.set(id, resolution)
    console.log(`✅ Created resolution: ${input.title}`)
    
    return { 
      success: true, 
      message: `Created resolution: "${input.title}"`,
      resolution 
    }
  } catch (error) {
    console.error('Error in createResolution:', error)
    return {
      success: false,
      message: 'Failed to create resolution',
      error: (error as Error).message
    }
  }
}
