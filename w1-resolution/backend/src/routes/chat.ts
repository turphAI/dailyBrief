import express, { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { handleChatMessage } from '../services/chat.js'

const router = express.Router()

// In-memory storage for demo (replace with database)
const resolutions = new Map<string, any>()
const conversations = new Map<string, any>()

// Chat endpoint - handles conversational messages with tool calling
router.post('/', async (req: Request, res: Response) => {
  try {
    const { message, conversationId } = req.body

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' })
      return
    }

    const convId = conversationId || uuidv4()
    
    // Get or create conversation
    let conversation = conversations.get(convId) || {
      id: convId,
      messages: [],
      createdAt: new Date()
    }

    // Add user message
    conversation.messages.push({
      role: 'user',
      content: message
    })

    console.log(`[Chat] Processing message: "${message.substring(0, 50)}..."`)

    // Get Claude's response with tool use
    const response = await handleChatMessage(
      conversation.messages,
      resolutions
    )

    // Add assistant response to conversation
    conversation.messages.push({
      role: 'assistant',
      content: response.text
    })

    // Save conversation
    conversations.set(convId, conversation)

    res.json({
      response: response.text,
      conversationId: convId,
      toolsUsed: response.toolsUsed,
      resolutionUpdate: response.resolutionUpdate
    })
  } catch (error) {
    console.error('Chat error:', error)
    res.status(500).json({ 
      error: 'Failed to process message',
      details: (error as Error).message
    })
  }
})

// Get conversation history
router.get('/:conversationId', (req: Request, res: Response) => {
  const conversation = conversations.get(req.params.conversationId)
  if (!conversation) {
    res.status(404).json({ error: 'Conversation not found' })
    return
  }
  res.json(conversation)
})

export default router

