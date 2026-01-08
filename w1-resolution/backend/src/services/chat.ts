import Anthropic from '@anthropic-ai/sdk'
import { v4 as uuidv4 } from 'uuid'
import { 
  createResolution, 
  listResolutions, 
  completeResolution, 
  deleteResolution,
  prioritizeResolutions
} from '../tools/index'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatResponse {
  text: string
  toolsUsed: string[]
  resolutionUpdate?: any
}

// Tool definitions for Claude
const TOOLS = [
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
    description: 'Intelligently prioritize resolutions with reasoning about focus, time allocation, and dependencies. Creates a fluid strategy for balanced progress.',
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

// Tool implementations
const toolImplementations: Record<string, Function> = {
  create_resolution: createResolution,
  list_resolutions: listResolutions,
  complete_resolution: completeResolution,
  delete_resolution: deleteResolution,
  prioritize_resolutions: prioritizeResolutions
}

export async function handleChatMessage(
  messages: Message[],
  resolutions: Map<string, any>
): Promise<ChatResponse> {
  const toolsUsed: string[] = []
  let resolutionUpdate: any = null
  let finalText = ''

  try {
    // Convert messages to Claude format
    const claudeMessages: Anthropic.MessageParam[] = messages.map(m => ({
      role: m.role,
      content: m.content
    }))

    // Initial request to Claude with tools
    let response = await client.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: TOOLS as Anthropic.Tool[],
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
      response = await client.messages.create({
        model: 'claude-opus-4-1-20250805',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: TOOLS as Anthropic.Tool[],
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
  } catch (error) {
    console.error('Claude API error:', error)
    throw error
  }
}
