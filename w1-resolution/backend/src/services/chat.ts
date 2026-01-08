import { v4 as uuidv4 } from 'uuid'
import { chatWithClaude } from './ai.js'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatResponse {
  text: string
  toolsUsed: string[]
  resolutionUpdate?: any
}

// Tool implementations
const toolImplementations: Record<string, Function> = {
  create_resolution: (input: any, resolutions: Map<string, any>) => {
    // Check if at limit
    const activeResolutions = Array.from(resolutions.values()).filter(
      (r: any) => r.status === 'active'
    )
    if (activeResolutions.length >= 5) {
      return {
        success: false,
        error: 'You have reached the 5-resolution limit. Complete or delete one first.'
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

    resolutions.set(id, resolution)
    console.log(`✅ Created resolution: ${input.title}`)
    return { success: true, resolution }
  },

  update_resolution: (input: any, resolutions: Map<string, any>) => {
    const resolution = resolutions.get(input.id)
    if (!resolution) {
      return { success: false, error: 'Resolution not found' }
    }

    if (input.title) resolution.title = input.title
    if (input.measurable_criteria) resolution.measurable_criteria = input.measurable_criteria

    console.log(`📝 Updated resolution: ${input.id}`)
    return { success: true, resolution }
  },

  complete_resolution: (input: any, resolutions: Map<string, any>) => {
    const resolution = resolutions.get(input.id)
    if (!resolution) {
      return { success: false, error: 'Resolution not found' }
    }

    resolution.status = 'completed'
    resolution.completedAt = new Date().toISOString()

    console.log(`🎉 Completed resolution: ${resolution.title}`)
    return { success: true, resolution }
  },

  delete_resolution: (input: any, resolutions: Map<string, any>) => {
    const resolution = resolutions.get(input.id)
    if (!resolution) {
      return { success: false, error: 'Resolution not found' }
    }

    resolutions.delete(input.id)
    console.log(`🗑️ Deleted resolution: ${resolution.title}`)
    return { success: true, message: 'Resolution deleted' }
  },

  list_resolutions: (input: any, resolutions: Map<string, any>) => {
    const all = Array.from(resolutions.values())
    let filtered = all

    if (input.status === 'active') {
      filtered = all.filter((r: any) => r.status === 'active')
    } else if (input.status === 'completed') {
      filtered = all.filter((r: any) => r.status === 'completed')
    }

    return {
      success: true,
      count: filtered.length,
      resolutions: filtered
    }
  },

  add_progress_update: (input: any, resolutions: Map<string, any>) => {
    const resolution = resolutions.get(input.id)
    if (!resolution) {
      return { success: false, error: 'Resolution not found' }
    }

    resolution.updates.push({
      id: uuidv4(),
      text: input.update,
      timestamp: new Date().toISOString()
    })

    console.log(`📊 Added update to: ${resolution.title}`)
    return { success: true, resolution }
  }
}

export async function handleChatMessage(
  messages: Message[],
  systemPrompt: string,
  _tools: any,
  resolutions: Map<string, any>
): Promise<ChatResponse> {
  const toolsUsed: string[] = []
  let resolutionUpdate: any = null

  try {
    // Get Claude's response using the working API
    const responseText = await chatWithClaude(
      systemPrompt,
      messages
    )

    console.log(`[Claude] Response received`)

    // Parse Claude's intent from response and execute appropriate actions
    const intent = parseResolutionIntent(responseText, messages)
    
    if (intent.action) {
      console.log(`[Intent] Detected: ${intent.action}`)
      toolsUsed.push(intent.action)

      const toolImpl = toolImplementations[intent.action]
      if (toolImpl && intent.params) {
        const result = toolImpl(intent.params, resolutions)
        if (result.resolution) {
          resolutionUpdate = result.resolution
        }
      }
    }

    return {
      text: responseText,
      toolsUsed,
      resolutionUpdate
    }
  } catch (error) {
    console.error('Claude API error:', error)
    throw error
  }
}

// Parse Claude's response to detect resolution management intents
function parseResolutionIntent(
  response: string,
  messages: Message[]
): { action?: string; params?: any } {
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || ''

  // Look for explicit JSON structures or patterns in Claude's response
  // that indicate a specific action
  
  // Pattern 1: Claude suggests a complete resolution with measurable criteria
  if (
    response.includes('create') &&
    response.includes('resolution') &&
    (lastUserMessage.includes('create') || lastUserMessage.includes('want') || lastUserMessage.includes('goal'))
  ) {
    // Extract title and measurable criteria from response
    const titleMatch = response.match(/(?:Resolution|Goal):\s*"([^"]+)"|^([^.]+)/m)
    const measurableMatch = response.match(/Measurable.*?:\s*"([^"]+)"|Daily:.*?(\d+)/i)

    if (titleMatch || measurableMatch) {
      return {
        action: 'create_resolution',
        params: {
          title: titleMatch?.[1] || titleMatch?.[2] || 'New Resolution',
          measurable_criteria: measurableMatch?.[1] || 'Track daily progress'
        }
      }
    }
  }

  // Pattern 2: User is completing a resolution
  if (
    (lastUserMessage.includes('done') || lastUserMessage.includes('complete') || lastUserMessage.includes('finished')) &&
    (response.includes('congratulations') || response.includes('completed'))
  ) {
    // This would need resolution ID context - skip for now
  }

  return {}
}
