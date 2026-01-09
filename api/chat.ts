/**
 * Chat API Endpoint
 * 
 * Handles conversational messages with Claude tool calling.
 * POST /api/chat
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'
import { v4 as uuidv4 } from 'uuid'
import {
  loadResolutions,
  saveResolutions,
  loadConversation,
  saveConversation,
  DatabaseError,
  type Resolution,
  type Message
} from './lib/db'

// ============================================================================
// Tool Implementations
// ============================================================================

interface ToolResult {
  success: boolean
  message: string
  error?: string
  resolution?: any
  count?: number
  resolutions?: any[]
}

function createResolution(input: any, resolutions: Map<string, Resolution>): ToolResult {
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

function editResolution(input: any, resolutions: Map<string, Resolution>): ToolResult {
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

    const changes: string[] = []

    if (title !== undefined && title !== null && title.trim() !== '') {
      const oldTitle = resolution.title
      resolution.title = title.trim()
      changes.push(`title: "${oldTitle}" → "${title.trim()}"`)
    }

    if (measurable_criteria !== undefined && measurable_criteria !== null && measurable_criteria.trim() !== '') {
      resolution.measurable_criteria = measurable_criteria.trim()
      changes.push(`measurable criteria updated`)
    }

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

    resolution.updatedAt = new Date().toISOString()
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

function listResolutions(input: any, resolutions: Map<string, Resolution>): ToolResult {
  try {
    const all = Array.from(resolutions.values())
    let filtered = all

    if (input.status === 'active') {
      filtered = all.filter((r) => r.status === 'active')
    } else if (input.status === 'completed') {
      filtered = all.filter((r) => r.status === 'completed')
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

function completeResolution(input: any, resolutions: Map<string, Resolution>): ToolResult {
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

function deleteResolution(input: any, resolutions: Map<string, Resolution>): ToolResult {
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

function prioritizeResolutions(input: any, resolutions: Map<string, Resolution>): ToolResult {
  try {
    const activeResolutions = Array.from(resolutions.values()).filter(
      (r) => r.status === 'active'
    )

    if (activeResolutions.length === 0) {
      return {
        success: false,
        message: 'No active resolutions to prioritize',
        error: 'Create some resolutions first before prioritizing'
      }
    }

    const timePerWeek = input.timePerWeek || 20
    const focusArea = input.focusArea || 'balanced growth'

    const strategy = {
      immediate: [] as any[],
      secondary: [] as any[],
      maintenance: [] as any[],
      strategy: `Focus on ${focusArea} with ${timePerWeek} hours/week available.`
    }

    activeResolutions.forEach((r, i) => {
      if (i === 0) {
        strategy.immediate.push({
          resolution: r.title,
          reason: 'Primary focus this period',
          suggestedWeeklyHours: Math.floor(timePerWeek * 0.4)
        })
      } else if (i < 3) {
        strategy.secondary.push({
          resolution: r.title,
          reason: 'Important but requires less focused effort',
          suggestedWeeklyHours: Math.floor(timePerWeek * 0.2)
        })
      } else {
        strategy.maintenance.push({
          resolution: r.title,
          reason: 'Maintain momentum with minimal effort',
          suggestedMinimalEffort: '30 minutes per week'
        })
      }
    })

    console.log(`📊 Prioritized ${activeResolutions.length} active resolutions`)

    return {
      success: true,
      message: `Created prioritization strategy for ${activeResolutions.length} resolutions`,
      resolution: strategy
    }
  } catch (error) {
    console.error('Error in prioritizeResolutions:', error)
    return {
      success: false,
      message: 'Failed to prioritize resolutions',
      error: (error as Error).message
    }
  }
}

// Tool mapping
const toolImplementations: Record<string, (input: any, resolutions: Map<string, Resolution>) => ToolResult> = {
  create_resolution: createResolution,
  edit_resolution: editResolution,
  list_resolutions: listResolutions,
  complete_resolution: completeResolution,
  delete_resolution: deleteResolution,
  prioritize_resolutions: prioritizeResolutions
}

// ============================================================================
// Claude Integration
// ============================================================================

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'create_resolution',
    description: 'Create a new active resolution with measurable criteria',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: {
          type: 'string',
          description: 'The resolution title (e.g., "Exercise 3 times per week")'
        },
        measurable_criteria: {
          type: 'string',
          description: 'How to measure success (e.g., "3 workouts per week for 52 weeks")'
        },
        context: {
          type: 'string',
          description: 'Brief context about why this matters (optional)'
        }
      },
      required: ['title', 'measurable_criteria']
    }
  },
  {
    name: 'edit_resolution',
    description: 'Edit an existing resolution title, measurable criteria, or context',
    input_schema: {
      type: 'object' as const,
      properties: {
        resolution_id: {
          type: 'string',
          description: 'The ID of the resolution to edit'
        },
        title: {
          type: 'string',
          description: 'New title for the resolution (optional)'
        },
        measurable_criteria: {
          type: 'string',
          description: 'New measurable criteria (optional)'
        },
        context: {
          type: 'string',
          description: 'New context statement (optional)'
        }
      },
      required: ['resolution_id']
    }
  },
  {
    name: 'list_resolutions',
    description: 'Get the current list of active resolutions to check status, limits, and duplicates',
    input_schema: {
      type: 'object' as const,
      properties: {
        status: {
          type: 'string',
          enum: ['active', 'completed', 'all'],
          description: 'Which resolutions to list'
        }
      },
      required: ['status']
    }
  },
  {
    name: 'complete_resolution',
    description: 'Mark a resolution as completed',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: {
          type: 'string',
          description: 'The resolution ID'
        }
      },
      required: ['id']
    }
  },
  {
    name: 'delete_resolution',
    description: 'Delete a resolution',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: {
          type: 'string',
          description: 'The resolution ID to delete'
        }
      },
      required: ['id']
    }
  },
  {
    name: 'prioritize_resolutions',
    description: 'Intelligently prioritize resolutions with reasoning about focus, time allocation, and dependencies.',
    input_schema: {
      type: 'object' as const,
      properties: {
        timePerWeek: {
          type: 'number',
          description: 'Hours available per week for resolutions (default: 20)'
        },
        focusArea: {
          type: 'string',
          description: 'Current life focus area (e.g., "health", "career", "balanced growth")'
        },
        constraints: {
          type: 'string',
          description: 'Any constraints or challenges affecting prioritization'
        },
        askFollowUp: {
          type: 'boolean',
          description: 'Whether to ask clarifying questions to refine the strategy'
        }
      },
      required: []
    }
  }
]

const SYSTEM_PROMPT = `You are Turph's supportive but challenging Resolution Coach.

## Your Role
Help Turph create, manage, and achieve meaningful resolutions through thoughtful conversation.

## Core Rules
1. **Resolution Limit**: Maximum 5 ACTIVE resolutions at any time
2. **Measurable**: Every resolution MUST include specific, measurable criteria
3. **Realistic**: Resolutions should be achievable within 1 year
4. **Clarity**: Push back on vague goals - ask clarifying questions

## Your Conversational Style
- Be encouraging but honest
- Challenge vague resolutions with specific questions
- Help refine resolutions before creating them
- Celebrate progress and completed resolutions
- Never create a resolution without measurable criteria

## How to Respond
1. When user suggests a resolution, ask clarifying questions if needed
2. Refine it together conversationally
3. Once solid, use the create_resolution tool
4. Always explain what you're doing in plain language
5. If user hits the 5-resolution limit, suggest reviewing existing ones
6. Use list_resolutions to check current status before creating new ones

Remember: You're coaching Turph toward meaningful, achievable growth. Be supportive but hold high standards.`

interface ChatResponse {
  text: string
  toolsUsed: string[]
  resolutionUpdate?: any
}

async function handleChatMessage(
  messages: Message[],
  resolutions: Map<string, Resolution>
): Promise<ChatResponse> {
  const toolsUsed: string[] = []
  let resolutionUpdate: any = null
  let finalText = ''

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  // Convert messages to Claude format
  const claudeMessages: Anthropic.MessageParam[] = messages.map(m => ({
    role: m.role,
    content: m.content
  }))

  // Initial request to Claude with tools
  let response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools: TOOLS,
    messages: claudeMessages
  })

  console.log(`[Claude] Initial response stop_reason: ${response.stop_reason}`)

  // Handle tool use in a loop
  while (response.stop_reason === 'tool_use') {
    const toolUseBlock = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
    )

    if (!toolUseBlock) break

    const toolName = toolUseBlock.name
    const toolInput = toolUseBlock.input as any

    console.log(`[Tool] Using: ${toolName}`)
    toolsUsed.push(toolName)

    // Execute the tool
    const toolImpl = toolImplementations[toolName]
    if (!toolImpl) {
      console.error(`Unknown tool: ${toolName}`)
      break
    }

    const toolResult = toolImpl(toolInput, resolutions)

    if (toolResult.resolution) {
      resolutionUpdate = toolResult.resolution
    }

    // Add assistant message and tool result to messages
    claudeMessages.push({
      role: 'assistant',
      content: response.content
    })

    claudeMessages.push({
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_use_id: toolUseBlock.id,
          content: JSON.stringify(toolResult)
        }
      ]
    })

    // Get next response from Claude
    response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages: claudeMessages
    })

    console.log(`[Claude] Continued response stop_reason: ${response.stop_reason}`)
  }

  // Extract final text response
  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === 'text'
  )
  finalText = textBlock?.text || "I'm ready to help with your resolutions!"

  return {
    text: finalText,
    toolsUsed,
    resolutionUpdate
  }
}

// ============================================================================
// API Handler
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  // Handle POST requests
  if (req.method === 'POST') {
    try {
      const { message, conversationId } = req.body

      // Validate input
      if (!message || typeof message !== 'string') {
        return res.status(400).json({
          error: 'Missing or invalid message',
          details: 'A message string is required'
        })
      }

      // Generate or use conversation ID
      const convId = conversationId || `conv-${uuidv4()}`

      // Load state from database (no fallback)
      let resolutions: Map<string, Resolution>
      let messages: Message[]
      
      try {
        resolutions = await loadResolutions()
        messages = await loadConversation(convId)
      } catch (error) {
        if (error instanceof DatabaseError) {
          console.error('[Chat] Database error:', error.details)
          return res.status(503).json({
            error: 'Database unavailable',
            details: error.details,
            code: error.code
          })
        }
        throw error
      }

      // Add user message
      messages.push({
        role: 'user',
        content: message
      })

      console.log(`[Chat] Processing message: "${message.substring(0, 50)}..."`)

      // Get Claude's response with tools
      const response = await handleChatMessage(messages, resolutions)

      // Add assistant response
      messages.push({
        role: 'assistant',
        content: response.text
      })

      // Save state to database
      try {
        await saveResolutions(resolutions)
        await saveConversation(convId, messages)
      } catch (error) {
        if (error instanceof DatabaseError) {
          console.error('[Chat] Failed to save state:', error.details)
          // Still return the response, but log the save failure
        } else {
          throw error
        }
      }

      // Get current list of active resolutions
      const allResolutions = Array.from(resolutions.values()).filter(r => r.status === 'active')

      console.log(`[Chat] Response sent. Tools used: ${response.toolsUsed.join(', ') || 'none'}`)
      console.log(`[Chat] Active resolutions: ${allResolutions.length}`)

      return res.status(200).json({
        response: response.text,
        conversationId: convId,
        toolsUsed: response.toolsUsed,
        resolutionUpdate: response.resolutionUpdate,
        resolutions: allResolutions
      })
    } catch (error) {
      console.error('[Chat] Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      return res.status(500).json({
        error: 'Failed to process message',
        details: errorMessage
      })
    }
  }

  // Handle other methods
  return res.status(405).json({
    error: 'Method not allowed',
    allowed: ['POST', 'OPTIONS']
  })
}
