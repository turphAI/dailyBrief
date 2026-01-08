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

      // For now, return a simple echo response
      // This allows the UI to work while we fix the backend integration
      const response = `I received: "${message}". \n\nNote: The AI features are being set up. Stay tuned!`
      
      conv.messages.push({ role: 'assistant', content: response })

      return res.status(200).json({
        response: response,
        conversationId: convId,
        toolsUsed: [],
        resolutions: Array.from(resolutions.values()).filter((r: any) => r.status === 'active')
      })
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      return res.status(500).json({ 
        error: 'Internal Server Error',
        details: errorMessage
      })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
