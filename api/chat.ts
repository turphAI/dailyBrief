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
  loadPreferences,
  savePreferences,
  saveNudge,
  DatabaseError,
  DEFAULT_UPDATE_SETTINGS,
  type Resolution,
  type Message,
  type UserPreferences,
  type Update,
  type NudgeRecord
} from './lib/db'
import {
  shouldNudge,
  generateNudgeContext,
  createNudgeRecord,
  updateResolutionNudgeStats,
  type NudgeContext
} from './lib/nudge'

// ============================================================================
// Session Tracking (Vercel Edge: use KV for persistent tracking if needed)
// For now, simple in-memory per request - resets each cold start
// ============================================================================

// In Vercel serverless, each invocation is isolated. Session tracking would
// need to be stored in Redis/KV for true persistence. For now, we allow
// one nudge per request (since cold starts are common).
const SESSION_NUDGE_LIMIT = 1

// ============================================================================
// Tool Result Interface
// ============================================================================

interface ToolResult {
  success: boolean
  message: string
  error?: string
  resolution?: any
  count?: number
  resolutions?: any[]
  preferences?: UserPreferences
  update?: Update
}

// ============================================================================
// Tool Implementations
// ============================================================================

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
      completedAt: undefined,
      updateSettings: { ...DEFAULT_UPDATE_SETTINGS }
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

function configureUpdates(
  input: any,
  resolutions: Map<string, Resolution>,
  preferences: UserPreferences
): ToolResult {
  try {
    const { action, scope = 'global', resolution_id, frequency, channel = 'all' } = input

    // Handle status request
    if (action === 'status') {
      if (resolution_id) {
        const resolution = resolutions.get(resolution_id)
        if (!resolution) {
          return { success: false, message: 'Resolution not found', error: `Resolution ${resolution_id} not found` }
        }
        return {
          success: true,
          message: `Update settings for "${resolution.title}"`,
          resolution: {
            resolution: resolution.title,
            enabled: resolution.updateSettings.enabled,
            lastNudge: resolution.updateSettings.lastNudgeAt,
            nudgeCount: resolution.updateSettings.nudgeCount
          }
        }
      }
      return {
        success: true,
        message: 'Current update settings',
        preferences,
        resolution: {
          globalEnabled: preferences.updatesEnabled,
          inConversation: preferences.inConversation,
          sms: { enabled: preferences.sms.enabled, configured: !!preferences.sms.phoneNumber }
        }
      }
    }

    // Handle resolution-specific changes
    if (scope === 'resolution' && resolution_id) {
      const resolution = resolutions.get(resolution_id)
      if (!resolution) {
        return { success: false, message: 'Resolution not found', error: `Resolution ${resolution_id} not found` }
      }

      if (action === 'enable') {
        resolution.updateSettings.enabled = true
        return { success: true, message: `Updates enabled for "${resolution.title}"`, resolution }
      }
      if (action === 'disable') {
        resolution.updateSettings.enabled = false
        return { success: true, message: `Updates disabled for "${resolution.title}"`, resolution }
      }
    }

    // Handle global changes
    const changes: string[] = []

    if (action === 'enable') {
      if (!preferences.updatesEnabled) {
        preferences.updatesEnabled = true
        changes.push('updates enabled globally')
      }
      if (channel === 'in_conversation' || channel === 'all') {
        preferences.inConversation.enabled = true
        changes.push('in-conversation nudges enabled')
      }
    }

    if (action === 'disable') {
      if (channel === 'in_conversation') {
        preferences.inConversation.enabled = false
        changes.push('in-conversation nudges disabled')
      } else if (channel === 'all') {
        preferences.updatesEnabled = false
        changes.push('all updates disabled')
      }
    }

    if (action === 'configure' && frequency) {
      preferences.inConversation.frequency = frequency
      changes.push(`frequency set to ${frequency}`)
    }

    console.log(`📝 Configured updates: ${changes.join(', ')}`)

    return {
      success: true,
      message: changes.length > 0 ? changes.join(', ') : 'No changes made',
      preferences
    }
  } catch (error) {
    console.error('Error in configureUpdates:', error)
    return { success: false, message: 'Failed to configure updates', error: (error as Error).message }
  }
}

function logUpdate(input: any, resolutions: Map<string, Resolution>): ToolResult {
  try {
    const { resolution_id, type, content, sentiment, progress_delta, triggered_by = 'user' } = input

    if (!resolution_id || !type || !content) {
      return {
        success: false,
        message: 'Missing required fields',
        error: 'resolution_id, type, and content are required'
      }
    }

    const resolution = resolutions.get(resolution_id)
    if (!resolution) {
      return { success: false, message: 'Resolution not found', error: `Resolution ${resolution_id} not found` }
    }

    const update: Update = {
      id: uuidv4(),
      type,
      content: content.trim(),
      sentiment,
      progressDelta: progress_delta,
      createdAt: new Date().toISOString(),
      triggeredBy: triggered_by
    }

    if (!resolution.updates) resolution.updates = []
    resolution.updates.push(update)
    resolution.updatedAt = new Date().toISOString()

    const emoji = type === 'milestone' ? '🎯' : type === 'setback' ? '💪' : type === 'progress' ? '📊' : '📝'
    console.log(`${emoji} Logged ${type} for "${resolution.title}"`)

    return {
      success: true,
      message: `${emoji} ${type.charAt(0).toUpperCase() + type.slice(1)} logged for "${resolution.title}"`,
      resolution,
      update
    }
  } catch (error) {
    console.error('Error in logUpdate:', error)
    return { success: false, message: 'Failed to log update', error: (error as Error).message }
  }
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
        title: { type: 'string', description: 'The resolution title' },
        measurable_criteria: { type: 'string', description: 'How to measure success' },
        context: { type: 'string', description: 'Brief context (optional)' }
      },
      required: ['title', 'measurable_criteria']
    }
  },
  {
    name: 'edit_resolution',
    description: 'Edit an existing resolution',
    input_schema: {
      type: 'object' as const,
      properties: {
        resolution_id: { type: 'string', description: 'The resolution ID' },
        title: { type: 'string', description: 'New title (optional)' },
        measurable_criteria: { type: 'string', description: 'New criteria (optional)' },
        context: { type: 'string', description: 'New context (optional)' }
      },
      required: ['resolution_id']
    }
  },
  {
    name: 'list_resolutions',
    description: 'Get resolutions list',
    input_schema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', enum: ['active', 'completed', 'all'], description: 'Filter by status' }
      },
      required: ['status']
    }
  },
  {
    name: 'complete_resolution',
    description: 'Mark a resolution as completed',
    input_schema: {
      type: 'object' as const,
      properties: { id: { type: 'string', description: 'Resolution ID' } },
      required: ['id']
    }
  },
  {
    name: 'delete_resolution',
    description: 'Delete a resolution',
    input_schema: {
      type: 'object' as const,
      properties: { id: { type: 'string', description: 'Resolution ID' } },
      required: ['id']
    }
  },
  {
    name: 'prioritize_resolutions',
    description: 'Intelligently prioritize resolutions',
    input_schema: {
      type: 'object' as const,
      properties: {
        timePerWeek: { type: 'number', description: 'Hours available per week' },
        focusArea: { type: 'string', description: 'Current focus area' },
        constraints: { type: 'string', description: 'Any constraints' },
        askFollowUp: { type: 'boolean', description: 'Ask clarifying questions' }
      },
      required: []
    }
  },
  {
    name: 'configure_updates',
    description: 'Configure update/reminder settings. Use for enabling/disabling reminders.',
    input_schema: {
      type: 'object' as const,
      properties: {
        action: { type: 'string', enum: ['enable', 'disable', 'configure', 'status'], description: 'Action to perform' },
        scope: { type: 'string', enum: ['global', 'resolution'], description: 'Apply globally or to specific resolution' },
        resolution_id: { type: 'string', description: 'Required if scope is resolution' },
        frequency: { type: 'string', enum: ['gentle', 'moderate', 'persistent'], description: 'Nudge frequency' },
        channel: { type: 'string', enum: ['in_conversation', 'sms', 'all'], description: 'Which channel' }
      },
      required: ['action']
    }
  },
  {
    name: 'log_update',
    description: 'Log progress, setback, milestone, or note for a resolution',
    input_schema: {
      type: 'object' as const,
      properties: {
        resolution_id: { type: 'string', description: 'Resolution to update' },
        type: { type: 'string', enum: ['progress', 'setback', 'milestone', 'note'], description: 'Update type' },
        content: { type: 'string', description: 'Summary of the update' },
        sentiment: { type: 'string', enum: ['positive', 'neutral', 'struggling'], description: 'User sentiment' },
        progress_delta: { type: 'number', description: 'Progress change (-100 to 100)' }
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

interface ChatResponse {
  text: string
  toolsUsed: string[]
  resolutionUpdate?: any
  preferencesUpdate?: UserPreferences
  nudgeDelivered?: NudgeRecord
}

async function handleChatMessage(
  messages: Message[],
  resolutions: Map<string, Resolution>,
  preferences: UserPreferences,
  nudgeContext: NudgeContext
): Promise<ChatResponse> {
  const toolsUsed: string[] = []
  let resolutionUpdate: any = null
  let preferencesUpdate: UserPreferences | undefined = undefined
  let nudgeDelivered: NudgeRecord | undefined = undefined
  let finalText = ''

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  const toolImplementations: Record<string, (input: any, resolutions: Map<string, Resolution>) => ToolResult> = {
    create_resolution: (input, res) => createResolution(input, res),
    edit_resolution: (input, res) => editResolution(input, res),
    list_resolutions: (input, res) => listResolutions(input, res),
    complete_resolution: (input, res) => completeResolution(input, res),
    delete_resolution: (input, res) => deleteResolution(input, res),
    prioritize_resolutions: (input, res) => prioritizeResolutions(input, res),
    configure_updates: (input, res) => configureUpdates(input, res, preferences),
    log_update: (input, res) => logUpdate(input, res)
  }

  // Build system prompt with nudge context
  const systemPrompt = buildSystemPrompt(nudgeContext)

  const claudeMessages: Anthropic.MessageParam[] = messages.map(m => ({
    role: m.role,
    content: m.content
  }))

  let response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    tools: TOOLS,
    messages: claudeMessages
  })

  console.log(`[Claude] Initial response stop_reason: ${response.stop_reason}`)

  while (response.stop_reason === 'tool_use') {
    const toolUseBlock = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
    )

    if (!toolUseBlock) break

    const toolName = toolUseBlock.name
    const toolInput = toolUseBlock.input as any

    console.log(`[Tool] Using: ${toolName}`)
    toolsUsed.push(toolName)

    const toolImpl = toolImplementations[toolName]
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
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      tools: TOOLS,
      messages: claudeMessages
    })

    console.log(`[Claude] Continued response stop_reason: ${response.stop_reason}`)
  }

  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === 'text'
  )
  finalText = textBlock?.text || "I'm ready to help with your resolutions!"

  // Track nudge delivery if applicable
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
}

// ============================================================================
// API Handler
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method === 'POST') {
    try {
      const { message, conversationId } = req.body

      if (!message || typeof message !== 'string') {
        return res.status(400).json({
          error: 'Missing or invalid message',
          details: 'A message string is required'
        })
      }

      const convId = conversationId || `conv-${uuidv4()}`

      let resolutions: Map<string, Resolution>
      let preferences: UserPreferences
      let messages: Message[]
      
      try {
        resolutions = await loadResolutions()
        preferences = await loadPreferences()
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

      // Check for nudge (session count = 0 for serverless since each request is isolated)
      const resolutionsList = Array.from(resolutions.values())
      const nudgeDecision = shouldNudge(preferences, resolutionsList, 0)
      const nudgeContext = generateNudgeContext(nudgeDecision)

      if (nudgeDecision.shouldNudge) {
        console.log(`[Nudge] Will nudge about "${nudgeDecision.resolutionTitle}" (${nudgeDecision.type}): ${nudgeDecision.reason}`)
      } else {
        console.log(`[Nudge] No nudge: ${nudgeDecision.reason}`)
      }

      messages.push({
        role: 'user',
        content: message
      })

      console.log(`[Chat] Processing message: "${message.substring(0, 50)}..."`)

      const response = await handleChatMessage(messages, resolutions, preferences, nudgeContext)

      messages.push({
        role: 'assistant',
        content: response.text
      })

      try {
        await saveResolutions(resolutions)
        await saveConversation(convId, messages)
        if (response.preferencesUpdate) {
          await savePreferences(response.preferencesUpdate)
        }
        if (response.nudgeDelivered) {
          await saveNudge(response.nudgeDelivered)
        }
      } catch (error) {
        if (error instanceof DatabaseError) {
          console.error('[Chat] Failed to save state:', error.details)
        } else {
          throw error
        }
      }

      const allResolutions = Array.from(resolutions.values()).filter(r => r.status === 'active')

      console.log(`[Chat] Response sent. Tools used: ${response.toolsUsed.join(', ') || 'none'}`)
      console.log(`[Chat] Active resolutions: ${allResolutions.length}`)

      return res.status(200).json({
        response: response.text,
        conversationId: convId,
        toolsUsed: response.toolsUsed,
        resolutionUpdate: response.resolutionUpdate,
        resolutions: allResolutions,
        nudgeDelivered: response.nudgeDelivered ? {
          id: response.nudgeDelivered.id,
          resolutionId: response.nudgeDelivered.resolutionId,
          type: response.nudgeDelivered.type
        } : undefined
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

  return res.status(405).json({
    error: 'Method not allowed',
    allowed: ['POST', 'OPTIONS']
  })
}
