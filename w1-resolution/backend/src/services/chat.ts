import Anthropic from '@anthropic-ai/sdk'
import { 
  createResolution, 
  editResolution,
  listResolutions, 
  completeResolution, 
  deleteResolution,
  prioritizeResolutions,
  configureUpdates,
  logUpdate
} from '../tools/index'
import type { Resolution, UserPreferences, NudgeRecord } from '../lib/db.js'
import {
  shouldNudge,
  generateNudgeContext,
  createNudgeRecord,
  updateResolutionNudgeStats,
  type NudgeContext
} from './nudge.js'

let client: Anthropic | null = null

function getAnthropicClient(): Anthropic {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set. Cannot initialize Anthropic client.')
    }
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }
  return client
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatResponse {
  text: string
  toolsUsed: string[]
  resolutionUpdate?: any
  preferencesUpdate?: UserPreferences
  nudgeDelivered?: NudgeRecord
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
  },
  {
    name: 'configure_updates',
    description: 'Configure the update/reminder system for resolutions. Can enable/disable globally or per-resolution, and adjust frequency settings.',
    input_schema: {
      type: 'object' as const,
      properties: {
        action: {
          type: 'string',
          enum: ['enable', 'disable', 'configure', 'status'],
          description: 'Action to perform on updates'
        },
        scope: {
          type: 'string',
          enum: ['global', 'resolution'],
          description: 'Apply globally or to a specific resolution'
        },
        resolution_id: {
          type: 'string',
          description: 'Required if scope is "resolution"'
        },
        frequency: {
          type: 'string',
          enum: ['gentle', 'moderate', 'persistent'],
          description: 'How often to send nudges (gentle=weekly, moderate=every few days, persistent=daily)'
        },
        channel: {
          type: 'string',
          enum: ['in_conversation', 'sms', 'all'],
          description: 'Which channel to configure'
        }
      },
      required: ['action']
    }
  },
  {
    name: 'log_update',
    description: 'Log a progress update, setback, milestone, or note for a resolution. Use this when the user shares progress or struggles.',
    input_schema: {
      type: 'object' as const,
      properties: {
        resolution_id: {
          type: 'string',
          description: 'The resolution to update'
        },
        type: {
          type: 'string',
          enum: ['progress', 'setback', 'milestone', 'note'],
          description: 'Type of update'
        },
        content: {
          type: 'string',
          description: 'Summary of the update (what happened, what was achieved)'
        },
        sentiment: {
          type: 'string',
          enum: ['positive', 'neutral', 'struggling'],
          description: 'User sentiment detected from their message'
        },
        progress_delta: {
          type: 'number',
          description: 'Optional progress change percentage (-100 to 100)'
        }
      },
      required: ['resolution_id', 'type', 'content']
    }
  }
]

const BASE_SYSTEM_PROMPT = `You are Turph's supportive but challenging Resolution Coach.

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

## Progress Tracking
When Turph shares progress, struggles, or updates about their resolutions:
1. Acknowledge what they shared with empathy
2. Use log_update to record the update (progress, setback, milestone, or note)
3. Detect sentiment (positive, neutral, struggling) and respond appropriately
4. For setbacks, be supportive and help identify blockers
5. For progress, celebrate and reinforce the positive behavior

## Update/Reminder Settings
Turph can configure reminder preferences via conversation:
- "Turn on/off reminders" → use configure_updates
- "Remind me about X more/less often" → configure per-resolution
- "What are my reminder settings?" → show status
- Frequency options: gentle (weekly), moderate (every few days), persistent (daily)

## Proactive Check-Ins
When you receive [NUDGE CONTEXT], naturally weave in a question about the mentioned resolution:
- Don't be pushy or formulaic
- Make it feel like a natural part of the conversation
- If the user responds with progress, use log_update to record it
- Adjust your tone based on their response

Remember: You're coaching Turph toward meaningful, achievable growth. Be supportive but hold high standards.`

/**
 * Build system prompt with optional nudge context
 */
function buildSystemPrompt(nudgeContext: NudgeContext): string {
  if (!nudgeContext.hasNudge || !nudgeContext.prompt) {
    return BASE_SYSTEM_PROMPT
  }

  return `${nudgeContext.prompt}\n\n${BASE_SYSTEM_PROMPT}`
}

// Tool implementations - some need preferences
const getToolImplementations = (preferences: UserPreferences) => ({
  create_resolution: (input: any, resolutions: Map<string, Resolution>) => 
    createResolution(input, resolutions),
  edit_resolution: (input: any, resolutions: Map<string, Resolution>) => 
    editResolution(input, resolutions),
  list_resolutions: (input: any, resolutions: Map<string, Resolution>) => 
    listResolutions(input, resolutions),
  complete_resolution: (input: any, resolutions: Map<string, Resolution>) => 
    completeResolution(input, resolutions),
  delete_resolution: (input: any, resolutions: Map<string, Resolution>) => 
    deleteResolution(input, resolutions),
  prioritize_resolutions: (input: any, resolutions: Map<string, Resolution>) => 
    prioritizeResolutions(input, resolutions),
  configure_updates: (input: any, resolutions: Map<string, Resolution>) => 
    configureUpdates(input, resolutions, preferences),
  log_update: (input: any, resolutions: Map<string, Resolution>) => 
    logUpdate(input, resolutions)
})

export async function handleChatMessage(
  messages: Message[],
  resolutions: Map<string, Resolution>,
  preferences: UserPreferences,
  sessionNudgeCount: number = 0
): Promise<ChatResponse> {
  const toolsUsed: string[] = []
  let resolutionUpdate: any = null
  let preferencesUpdate: UserPreferences | undefined = undefined
  let nudgeDelivered: NudgeRecord | undefined = undefined
  let finalText = ''

  const toolImplementations = getToolImplementations(preferences)

  try {
    // Check if we should nudge the user
    const resolutionsList = Array.from(resolutions.values())
    const nudgeDecision = shouldNudge(preferences, resolutionsList, sessionNudgeCount)
    const nudgeContext = generateNudgeContext(nudgeDecision)

    // Log nudge decision
    if (nudgeDecision.shouldNudge) {
      console.log(`[Nudge] Will nudge about "${nudgeDecision.resolutionTitle}" (${nudgeDecision.type}): ${nudgeDecision.reason}`)
    } else {
      console.log(`[Nudge] No nudge: ${nudgeDecision.reason}`)
    }

    // Build system prompt with nudge context if applicable
    const systemPrompt = buildSystemPrompt(nudgeContext)

    // Convert messages to Claude format
    const claudeMessages: Anthropic.MessageParam[] = messages.map(m => ({
      role: m.role,
      content: m.content
    }))

    // Initial request to Claude with tools
    const anthropicClient = getAnthropicClient()
    let response = await anthropicClient.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 1024,
      system: systemPrompt,
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
      const toolImpl = toolImplementations[toolName as keyof typeof toolImplementations]
      if (!toolImpl) {
        console.error(`Unknown tool: ${toolName}`)
        break
      }

      const toolResult = toolImpl(toolInput, resolutions)

      if (toolResult.resolution) {
        resolutionUpdate = toolResult.resolution
      }

      if (toolResult.preferences) {
        preferencesUpdate = toolResult.preferences
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
      response = await anthropicClient.messages.create({
        model: 'claude-opus-4-1-20250805',
        max_tokens: 1024,
        system: systemPrompt,
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

    // If we had a nudge context and got a response, track the nudge delivery
    if (nudgeContext.hasNudge && nudgeContext.resolutionId) {
      const nudgeRecord = createNudgeRecord(nudgeContext)
      if (nudgeRecord) {
        nudgeDelivered = nudgeRecord
        
        // Update resolution stats
        const resolution = resolutions.get(nudgeContext.resolutionId)
        if (resolution) {
          updateResolutionNudgeStats(resolution)
          console.log(`[Nudge] Delivered and tracked for "${nudgeContext.resolutionTitle}"`)
        }
      }
    }

    return {
      text: finalText,
      toolsUsed,
      resolutionUpdate,
      preferencesUpdate,
      nudgeDelivered
    }
  } catch (error) {
    console.error('Claude API error:', error)
    throw error
  }
}
