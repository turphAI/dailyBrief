import type { VercelRequest, VercelResponse } from '@vercel/node'

// Global state
const conversations = new Map<string, any>()
const resolutions = new Map<string, any>()

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'POST') {
    try {
      const { message, conversationId } = req.body

      if (!message) {
        return res.status(400).json({ error: 'No message' })
      }

      let convId = conversationId || 'default'
      if (!conversations.has(convId)) {
        conversations.set(convId, { messages: [] })
      }

      const conv = conversations.get(convId)
      conv.messages.push({ role: 'user', content: message })

      // Try to load and use the real chat handler
      try {
        const { handleChatMessage } = await import(
          '../w1-resolution/backend/dist/services/chat'
        )
        const response = await handleChatMessage(conv.messages, resolutions)
        conv.messages.push({ role: 'assistant', content: response.text })

        return res.status(200).json({
          response: response.text,
          conversationId: convId,
          resolutions: Array.from(resolutions.values()).filter((r) => r.status === 'active')
        })
      } catch (importError) {
        console.error('Failed to import handler:', importError)
        // Fallback: just echo the message
        const echoResponse = `I received your message: "${message}". (Backend services not available)`
        conv.messages.push({ role: 'assistant', content: echoResponse })

        return res.status(200).json({
          response: echoResponse,
          conversationId: convId,
          resolutions: []
        })
      }
    } catch (error) {
      console.error('Error:', error)
      return res.status(500).json({ error: String(error) })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
