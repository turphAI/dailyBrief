import { Anthropic } from '@anthropic-ai/sdk'
import { v4 as uuidv4 } from 'uuid'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Tool {
  name: string
  description: string
  input_schema: any
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
  tools: Tool[],
  resolutions: Map<string, any>
): Promise<ChatResponse> {
  const toolsUsed: string[] = []
  let resolutionUpdate: any = null

  try {
    // Initial Claude request
    let response = await (client.beta.messages as any).create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      tools: tools,
      messages: messages
    })

    console.log(`[Claude] Initial response stop_reason: ${response.stop_reason}`)

    // Handle tool use in a loop
    while (response.stop_reason === 'tool_use') {
      const toolUseBlock = response.content.find((block: any) => block.type === 'tool_use')

      if (!toolUseBlock) break

      const toolName = toolUseBlock.name
      const toolInput = toolUseBlock.input

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

      // Add assistant response and tool result to messages for next iteration
      const assistantMessage = {
        role: 'assistant' as const,
        content: response.content
      }

      const toolResultMessage = {
        role: 'user' as const,
        content: [
          {
            type: 'tool_result' as const,
            tool_use_id: toolUseBlock.id,
            content: JSON.stringify(toolResult)
          }
        ]
      }

      messages.push(assistantMessage)
      messages.push(toolResultMessage)

      // Get next response
      response = await (client.beta.messages as any).create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: systemPrompt,
        tools: tools,
        messages: messages
      })

      console.log(`[Claude] Continued response stop_reason: ${response.stop_reason}`)
    }

    // Extract final text response
    const textContent = response.content.find((block: any) => block.type === 'text')
    const finalText = textContent?.text || "I'm ready to help with your resolutions!"

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

