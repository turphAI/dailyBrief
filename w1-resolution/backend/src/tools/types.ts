import type { Resolution, Update, UserPreferences, NudgeRecord, ResolutionUpdateSettings } from '../lib/db.js'

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
  preferences?: UserPreferences
  update?: Update
}

export interface ToolOutput {
  result: ToolResult
  resolution?: Resolution
}

// Re-export types from db for convenience
export type { 
  Resolution, 
  Update, 
  UserPreferences, 
  NudgeRecord,
  ResolutionUpdateSettings 
} from '../lib/db.js'
