import { v4 as uuidv4 } from 'uuid'

export interface ToolInput {
  [key: string]: any
}

export interface ToolResult {
  success: boolean
  message: string
  error?: string
  resolution?: any
  count?: number
  resolutions?: any[]
}

export interface ToolOutput {
  result: ToolResult
  resolution?: any
}
