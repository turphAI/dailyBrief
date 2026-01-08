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
    console.log('=== Chat API Request ===')
    console.log('Body:', req.body)

    const { message, conversationId } = req.body

    if (!message || typeof message !== 'string') {
      console.log('Invalid message:', message)
      res.status(400).json({ error: 'Message is required' })
      return
    }

    console.log('Message received:', message.substring(0, 50))

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY not set')
      res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })
      return
    }

    console.log('Importing dependencies...')
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const { v4: uuidv4 } = await import('uuid')

    const convId = conversationId || uuidv4()
    console.log('Conversation ID:', convId)

    console.log('Creating Anthropic client...')
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    console.log('Calling Claude API...')
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 512,
      system: `You are Turph's Resolution Coach. Help him create and manage personal goals.
Today is ${new Date().toLocaleDateString()}.
Keep responses concise and supportive.`,
      messages: [
        {
          role: 'user',
          content: message
        }
      ]
    })

    console.log('Claude response received')

    const textBlock = response.content.find(
      (block): block is any => block.type === 'text'
    )
    const text = textBlock?.text || 'Unable to generate response'

    console.log('Response:', text.substring(0, 100))

    res.status(200).json({
      response: text,
      conversationId: convId,
      resolutions: [],
      toolsUsed: []
    })

    console.log('=== Chat API Success ===')
  } catch (error: any) {
    console.error('=== Chat API Error ===')
    console.error('Error type:', error?.constructor?.name)
    console.error('Error message:', error?.message)
    console.error('Error status:', error?.status)
    console.error('Full error:', error)

    res.status(500).json({
      error: 'Failed to process request',
      details: error?.message || String(error),
      type: error?.constructor?.name
    })
  }
}
