import type { VercelRequest, VercelResponse } from '@vercel/node'

// Services are available in the uploaded repo at this path
import { handleChatMessage } from '../w1-resolution/backend/dist/services/chat.js'

// Global state for this function instance
// NOTE: This resets on redeploy or when function scales
// For production persistence, use Vercel KV or a database
const conversations = new Map<string, any>()
const resolutions = new Map<string, any>()

/**
 * Chat API Handler - POST /api/chat
 * Receives a message and returns Claude's response with resolution updates
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS,PATCH,DELETE,POST,PUT'
  )
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  // Handle POST requests
  if (req.method === 'POST') {
    try {
      const { message, conversationId } = req.body

      // Validate input
      if (!message || typeof message !== 'string') {
        return res.status(400).json({
          error: 'Missing or invalid message',
          resolutions: Array.from(resolutions.values()).filter(
            (r) => r.status === 'active'
          )
        })
      }

      // Get or create conversation
      let convId = conversationId || 'default-' + Date.now()
      if (!conversations.has(convId)) {
        conversations.set(convId, { messages: [] })
      }

      const conversation = conversations.get(convId)!

      // Add user message to conversation history
      conversation.messages.push({
        role: 'user',
        content: message
      })

      console.log(`[Chat] Processing message for conversation: ${convId}`)

      // Get Claude's response with tools
      const response = await handleChatMessage(
        conversation.messages,
        resolutions
      )

      // Add assistant response to conversation history
      conversation.messages.push({
        role: 'assistant',
        content: response.text
      })

      // Get current list of active resolutions
      const allResolutions = Array.from(resolutions.values()).filter(
        (r) => r.status === 'active'
      )

      console.log(
        `[Chat] Response sent. Tools used: ${response.toolsUsed.join(', ')}`
      )
      console.log(`[Chat] Active resolutions: ${allResolutions.length}`)

      // Return response
      return res.status(200).json({
        response: response.text,
        conversationId: convId,
        toolsUsed: response.toolsUsed,
        resolutionUpdate: response.resolutionUpdate,
        resolutions: allResolutions // Include all active resolutions for UI sync
      })
    } catch (error) {
      console.error('[Chat] Error:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      return res.status(500).json({
        error: 'Failed to process message',
        details: errorMessage,
        resolutions: Array.from(resolutions.values()).filter(
          (r) => r.status === 'active'
        )
      })
    }
  }

  // Handle other methods
  return res.status(405).json({
    error: 'Method not allowed',
    allowed: ['POST', 'OPTIONS']
  })
}
