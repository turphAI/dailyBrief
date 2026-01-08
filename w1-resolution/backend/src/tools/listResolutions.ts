import { ToolResult } from './types'

/**
 * List resolutions filtered by status
 * @param input - { status: 'active' | 'completed' | 'all' }
 * @param resolutions - Map of all resolutions
 * @returns ToolResult with filtered list of resolutions
 */
export function listResolutions(input: any, resolutions: Map<string, any>): ToolResult {
  try {
    const all = Array.from(resolutions.values())
    let filtered = all

    if (input.status === 'active') {
      filtered = all.filter((r: any) => r.status === 'active')
    } else if (input.status === 'completed') {
      filtered = all.filter((r: any) => r.status === 'completed')
    }

    console.log(`📋 Listed ${filtered.length} ${input.status} resolutions`)
    
    return {
      success: true,
      message: `Found ${filtered.length} ${input.status} resolutions`,
      count: filtered.length,
      resolutions: filtered
    }
  } catch (error) {
    console.error('Error in listResolutions:', error)
    return {
      success: false,
      message: 'Failed to list resolutions',
      error: (error as Error).message
    }
  }
}
