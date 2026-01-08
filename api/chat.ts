import type { VercelRequest, VercelResponse } from '@vercel/node'

const conversations = new Map()
const resolutions = new Map()

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method === 'POST') {
    const { message, conversationId } = req.body

    if (!message) {
      res.status(400).json({ error: 'No message' })
      return
    }

    const convId = conversationId || 'default'
    if (!conversations.has(convId)) {
      conversations.set(convId, { messages: [] })
    }

    const conv = conversations.get(convId)
    conv.messages.push({ role: 'user', content: message })

    const response = `I received: "${message}". The AI features are being set up!`
    conv.messages.push({ role: 'assistant', content: response })

    res.status(200).json({
      response,
      conversationId: convId,
      resolutions: []
    })
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
