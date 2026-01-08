import { Anthropic } from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function analyzeResolutionWithClaude(text: string): Promise<string> {
  try {
    const message = await (client.beta.messages as any).create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a supportive resolution coach. Analyze this resolution or progress update and provide constructive feedback.

Resolution/Update: "${text}"

Provide:
1. A brief assessment (1-2 sentences)
2. One key strength or positive aspect
3. One actionable suggestion for improvement
4. An encouraging note

Keep it concise and motivating.`
        }
      ]
    })

    const content = message.content[0]
    if (content.type === 'text') {
      return content.text
    }
    
    return 'Unable to process feedback'
  } catch (error) {
    console.error('Claude API error:', error)
    throw error
  }
}

export async function chatWithClaude(
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  try {
    // Combine system prompt with first user message
    const enhancedMessages = [
      {
        role: 'user' as const,
        content: systemPrompt + '\n\n---USER REQUEST---\n' + messages[0].content
      },
      ...messages.slice(1)
    ]

    const message = await (client.beta.messages as any).create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: enhancedMessages
    } as any)

    const content = message.content[0]
    if (content && content.type === 'text') {
      return content.text
    }
    
    return "I'm ready to help with your resolutions!"
  } catch (error) {
    console.error('Claude API error:', error)
    throw error
  }
}

