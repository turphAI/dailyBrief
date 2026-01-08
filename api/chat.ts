import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'
import { v4 as uuidv4 } from 'uuid'
import { createClient } from 'redis'

// Initialize Anthropic client
let anthropicClient: Anthropic | null = null
function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set')
    }
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }
  return anthropicClient
}

// Redis client
let redisClient: any = null
let isRedisConnected = false

async function getRedisClient() {
  if (isRedisConnected && redisClient) {
    return redisClient
  }

  const redisUrl = process.env.REDIS_URL || process.env.KV_URL
  if (redisUrl) {
    try {
      redisClient = createClient({ url: redisUrl })
      await redisClient.connect()
      isRedisConnected = true
      console.log('✅ Redis connected on Vercel')
      return redisClient
    } catch (e: any) {
      console.error('❌ Redis connection failed:', e.message)
      isRedisConnected = false
      return null
    }
  }
  return null
}

// Tool definitions
const TOOLS = [
  {
    name: 'create_resolution',
    description: 'Create a new active resolution with measurable criteria',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: {
          type: 'string',
          description: 'The resolution title'
        },
        measurable_criteria: {
          type: 'string',
          description: 'How to measure success'
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
          description: 'New title (optional)'
        },
        measurable_criteria: {
          type: 'string',
          description: 'New measurable criteria (optional)'
        },
        context: {
          type: 'string',
          description: 'New context (optional)'
        }
      },
      required: ['resolution_id']
    }
  },
  {
    name: 'list_resolutions',
    description: 'Get the current list of active resolutions',
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
    description: 'Intelligently prioritize resolutions',
    input_schema: {
      type: 'object' as const,
      properties: {
        timePerWeek: {
          type: 'number',
          description: 'Hours available per week (default: 20)'
        },
        focusArea: {
          type: 'string',
          description: 'Current life focus area'
        },
        constraints: {
          type: 'string',
          description: 'Any constraints'
        }
      },
      required: []
    }
  }
]

function getSystemPrompt(): string {
  return `You are Turph's supportive but challenging Resolution Coach.

## Your Role
Help Turph create, manage, and achieve meaningful resolutions through thoughtful conversation.

## Core Rules
1. **Resolution Limit**: Maximum 5 ACTIVE resolutions at any time
2. **Measurable**: Every resolution MUST include specific, measurable criteria
3. **Realistic**: Resolutions should be achievable within 1 year
4. **Clarity**: Push back on vague goals - ask clarifying questions

## Today's Date
${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

## IMPORTANT Guidelines
- **Personal Goals Only**: Resolutions must be PERSONAL goals only. Examples of PERSONAL goals: fitness, learning skills, reading, hobby development, personal finance, health improvements, habit building
- Examples of OUT-OF-SCOPE: political goals, world events, retirement planning, business ventures
- When uncertain about scope, ask clarifying questions or politely decline if it's not a personal goal
- Be encouraging but hold high standards
- Always explain what you're doing in plain language

Remember: You're coaching Turph toward meaningful, achievable personal growth.`
}

// Tool implementations
async function createResolution(input: any, resolutionsMap: Map<string, any>) {
  try {
    const activeResolutions = Array.from(resolutionsMap.values()).filter(
      (r: any) => r.status === 'active'
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
    const resolution = {
      id,
      title: input.title,
      measurable_criteria: input.measurable_criteria,
      context: input.context || '',
      status: 'active',
      createdAt: new Date().toISOString(),
      updates: [],
      completedAt: null
    }

    resolutionsMap.set(id, resolution)
    return { 
      success: true, 
      message: `Created resolution: "${input.title}"`,
      resolution 
    }
  } catch (error) {
    return {
      success: false,
      message: 'Failed to create resolution',
      error: (error as Error).message
    }
  }
}

async function editResolution(input: any, resolutionsMap: Map<string, any>) {
  try {
    const { resolution_id, title, measurable_criteria, context } = input

    if (!resolution_id) {
      return {
        success: false,
        message: 'Missing resolution ID',
        error: 'resolution_id is required'
      }
    }

    const resolution = resolutionsMap.get(resolution_id)
    if (!resolution) {
      return {
        success: false,
        message: 'Resolution not found',
        error: `Resolution with ID "${resolution_id}" does not exist`
      }
    }

    const changes: string[] = []

    if (title !== undefined && title !== null && title.trim() !== '') {
      resolution.title = title.trim()
      changes.push(`title updated`)
    }

    if (measurable_criteria !== undefined && measurable_criteria !== null && measurable_criteria.trim() !== '') {
      resolution.measurable_criteria = measurable_criteria.trim()
      changes.push(`measurable criteria updated`)
    }

    if (context !== undefined && context !== null) {
      resolution.context = context.trim()
      changes.push(`context updated`)
    }

    if (changes.length === 0) {
      return {
        success: false,
        message: 'No changes provided',
        error: 'At least one field must be provided to edit'
      }
    }

    resolution.updatedAt = new Date().toISOString()
    resolutionsMap.set(resolution_id, resolution)

    return {
      success: true,
      message: `Updated resolution "${resolution.title}": ${changes.join(', ')}`,
      resolution
    }
  } catch (error) {
    return {
      success: false,
      message: 'Failed to edit resolution',
      error: (error as Error).message
    }
  }
}

async function listResolutions(input: any, resolutionsMap: Map<string, any>) {
  try {
    const status = input.status || 'active'
    let resolutions = Array.from(resolutionsMap.values())
    
    if (status !== 'all') {
      resolutions = resolutions.filter((r: any) => r.status === status)
    }

    return {
      success: true,
      message: `Found ${resolutions.length} ${status} resolutions`,
      count: resolutions.length,
      resolutions
    }
  } catch (error) {
    return {
      success: false,
      message: 'Failed to list resolutions',
      error: (error as Error).message
    }
  }
}

async function completeResolution(input: any, resolutionsMap: Map<string, any>) {
  try {
    const resolution = resolutionsMap.get(input.id)
    if (!resolution) {
      return {
        success: false,
        message: 'Resolution not found',
        error: `Resolution with ID "${input.id}" does not exist`
      }
    }

    resolution.status = 'completed'
    resolution.completedAt = new Date().toISOString()
    resolutionsMap.set(input.id, resolution)

    return {
      success: true,
      message: `Completed resolution: "${resolution.title}"`,
      resolution
    }
  } catch (error) {
    return {
      success: false,
      message: 'Failed to complete resolution',
      error: (error as Error).message
    }
  }
}

async function deleteResolution(input: any, resolutionsMap: Map<string, any>) {
  try {
    const resolution = resolutionsMap.get(input.id)
    if (!resolution) {
      return {
        success: false,
        message: 'Resolution not found',
        error: `Resolution with ID "${input.id}" does not exist`
      }
    }

    resolutionsMap.delete(input.id)

    return {
      success: true,
      message: `Deleted resolution: "${resolution.title}"`
    }
  } catch (error) {
    return {
      success: false,
      message: 'Failed to delete resolution',
      error: (error as Error).message
    }
  }
}

async function prioritizeResolutions(input: any, resolutionsMap: Map<string, any>) {
  try {
    const resolutions = Array.from(resolutionsMap.values()).filter((r: any) => r.status === 'active')

    return {
      success: true,
      message: `Prioritizing ${resolutions.length} resolutions based on your focus area`,
      resolutions
    }
  } catch (error) {
    return {
      success: false,
      message: 'Failed to prioritize resolutions',
      error: (error as Error).message
    }
  }
}

const toolImplementations: Record<string, Function> = {
  create_resolution: createResolution,
  edit_resolution: editResolution,
  list_resolutions: listResolutions,
  complete_resolution: completeResolution,
  delete_resolution: deleteResolution,
  prioritize_resolutions: prioritizeResolutions
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method === 'POST') {
    try {
      const { message, conversationId } = req.body

      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'Message is required' })
        return
      }

      const convId = conversationId || uuidv4()
      const useRedis = !!(process.env.REDIS_URL || process.env.KV_URL)

      // Load resolutions from Redis or memory
      let resolutions = new Map<string, any>()
      if (useRedis) {
        const client = await getRedisClient()
        if (client && isRedisConnected) {
          const ids = await client.sMembers('resolutions:all')
          if (ids && ids.length > 0) {
            for (const id of ids) {
              const data = await client.get(`resolution:${id}`)
              if (data) {
                resolutions.set(id, JSON.parse(data))
              }
            }
          }
        }
      }

      // Get or create conversation
      let conversation: any = null
      if (useRedis) {
        const client = await getRedisClient()
        if (client && isRedisConnected) {
          const data = await client.get(`conversation:${convId}`)
          conversation = data ? JSON.parse(data) : null
        }
      }

      if (!conversation) {
        conversation = {
          id: convId,
          messages: [],
          createdAt: new Date().toISOString()
        }
      }

      // Add user message
      conversation.messages.push({
        role: 'user',
        content: message
      })

      // Call Claude with tools
      const anthropic = getAnthropicClient()
      const claudeMessages: Anthropic.MessageParam[] = conversation.messages.map((m: any) => ({
        role: m.role,
        content: m.content
      }))

      let response = await anthropic.messages.create({
        model: 'claude-opus-4-1-20250805',
        max_tokens: 1024,
        system: getSystemPrompt(),
        tools: TOOLS as Anthropic.Tool[],
        messages: claudeMessages
      })

      const toolsUsed: string[] = []

      // Handle tool use in a loop
      while (response.stop_reason === 'tool_use') {
        const toolUseBlock = response.content.find(
          (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
        )

        if (!toolUseBlock) break

        const toolName = toolUseBlock.name
        const toolInput = toolUseBlock.input as any
        toolsUsed.push(toolName)

        const toolImpl = toolImplementations[toolName]
        if (!toolImpl) {
          console.error(`Unknown tool: ${toolName}`)
          break
        }

        const toolResult = await toolImpl(toolInput, resolutions)

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

        response = await anthropic.messages.create({
          model: 'claude-opus-4-1-20250805',
          max_tokens: 1024,
          system: getSystemPrompt(),
          tools: TOOLS as Anthropic.Tool[],
          messages: claudeMessages
        })
      }

      const textBlock = response.content.find(
        (block): block is Anthropic.TextBlock => block.type === 'text'
      )
      const finalText = textBlock?.text || "I'm ready to help with your resolutions!"

      // Add assistant response
      conversation.messages.push({
        role: 'assistant',
        content: finalText
      })

      // Save conversation and resolutions to Redis
      if (useRedis) {
        const client = await getRedisClient()
        if (client && isRedisConnected) {
          await client.setEx(`conversation:${convId}`, 86400, JSON.stringify(conversation))
          for (const [id, resolution] of resolutions.entries()) {
            await client.set(`resolution:${id}`, JSON.stringify(resolution))
            await client.sAdd('resolutions:all', id)
          }
        }
      }

      const allResolutions = Array.from(resolutions.values()).filter(r => r.status === 'active')

      res.status(200).json({
        response: finalText,
        conversationId: convId,
        toolsUsed,
        resolutions: allResolutions
      })
    } catch (error) {
      console.error('Chat error:', error)
      res.status(500).json({
        error: 'Failed to process message',
        details: (error as Error).message
      })
    }
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
