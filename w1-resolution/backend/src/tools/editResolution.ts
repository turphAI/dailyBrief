import { ToolResult } from './types'

/**
 * Edit an existing resolution's title, measurable criteria, and context
 * @param input - { resolution_id: string, title?: string, measurable_criteria?: string, context?: string }
 * @param resolutions - Map of all resolutions
 * @returns ToolResult with updated resolution
 */
export function editResolution(input: any, resolutions: Map<string, any>): ToolResult {
  try {
    const { resolution_id, title, measurable_criteria, context } = input

    if (!resolution_id) {
      return {
        success: false,
        message: 'Missing resolution ID',
        error: 'resolution_id is required to edit a resolution'
      }
    }

    const resolution = resolutions.get(resolution_id)
    if (!resolution) {
      return {
        success: false,
        message: 'Resolution not found',
        error: `Resolution with ID "${resolution_id}" does not exist`
      }
    }

    // Track what was changed
    const changes: string[] = []

    // Update title if provided
    if (title !== undefined && title !== null && title.trim() !== '') {
      const oldTitle = resolution.title
      resolution.title = title.trim()
      changes.push(`title: "${oldTitle}" → "${title.trim()}"`)
    }

    // Update measurable_criteria if provided
    if (measurable_criteria !== undefined && measurable_criteria !== null && measurable_criteria.trim() !== '') {
      const oldCriteria = resolution.measurable_criteria
      resolution.measurable_criteria = measurable_criteria.trim()
      changes.push(`measurable criteria updated`)
    }

    // Update context if provided
    if (context !== undefined && context !== null) {
      const oldContext = resolution.context || ''
      resolution.context = context.trim()
      if (context.trim() !== oldContext) {
        changes.push(`context updated`)
      }
    }

    if (changes.length === 0) {
      return {
        success: false,
        message: 'No changes provided',
        error: 'At least one field (title, measurable_criteria, or context) must be provided to edit'
      }
    }

    // Update modification timestamp
    resolution.updatedAt = new Date().toISOString()

    // Update the resolution in the map
    resolutions.set(resolution_id, resolution)

    console.log(`✅ Edited resolution: ${resolution.title} - ${changes.join(', ')}`)

    return {
      success: true,
      message: `Updated resolution "${resolution.title}": ${changes.join(', ')}`,
      resolution
    }
  } catch (error) {
    console.error('Error in editResolution:', error)
    return {
      success: false,
      message: 'Failed to edit resolution',
      error: (error as Error).message
    }
  }
}
