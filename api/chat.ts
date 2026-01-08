import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    // Import dynamically to avoid issues
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const { v4: uuidv4 } = await import('uuid')
    const redis = await import('redis')
    
    const { message, conversationId } = req.body

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' })
      return
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })
      return
    }

    const convId = conversationId || uuidv4()
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    // Simple test to verify API is working
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 100,
      system: 'You are a helpful assistant. Respond briefly.',
      messages: [
        {
          role: 'user',
          content: message
        }
      ]
    })

    const textBlock = response.content.find(
      (block): block is any => block.type === 'text'
    )
    const text = textBlock?.text || 'No response'

    res.status(200).json({
      response: text,
      conversationId: convId,
      resolutions: []
    })
  } catch (error) {
    console.error('API Error:', error)
    res.status(500).json({
      error: 'Failed to process request',
      details: (error as any).message || String(error)
    })
  }
}
