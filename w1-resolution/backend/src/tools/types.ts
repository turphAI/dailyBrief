import type { Resolution } from '../lib/db.js'

export interface ToolInput {
  [key: string]: any
}

export interface ToolResult {
  success: boolean
  message: string
  error?: string
  resolution?: Resolution | any  // Resolution or strategy object for prioritize
  count?: number
  resolutions?: Resolution[]
}

export interface ToolOutput {
  result: ToolResult
  resolution?: Resolution
}

// Re-export Resolution type for convenience
export type { Resolution } from '../lib/db.js'
