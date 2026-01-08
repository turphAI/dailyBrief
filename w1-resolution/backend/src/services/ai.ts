import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function analyzeResolutionWithClaude(text: string): Promise<string> {
  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-1-20250805',
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
