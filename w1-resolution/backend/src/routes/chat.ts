/**
 * Chat Routes - Local Development
 * 
 * Handles conversational messages with Claude tool calling.
 */

import express, { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { handleChatMessage } from '../services/chat.js'
import {
  loadResolutions,
  saveResolutions,
  loadConversation,
  saveConversation,
  loadPreferences,
  savePreferences,
  DatabaseError,
  type Resolution,
  type UserPreferences
} from '../lib/db.js'

const router = express.Router()

// Chat endpoint - handles conversational messages with tool calling
router.post('/', async (req: Request, res: Response) => {
  try {
    const { message, conversationId } = req.body

    if (!message || typeof message !== 'string') {
      res.status(400).json({ 
        error: 'Message is required',
        details: 'A message string is required'
      })
      return
    }

    const convId = conversationId || uuidv4()
    
    // Load state from database (no fallback)
    let resolutions: Map<string, Resolution>
    let preferences: UserPreferences
    let conversation: any
    
    try {
      resolutions = await loadResolutions()
      preferences = await loadPreferences()
      const messages = await loadConversation(convId)
      conversation = {
        id: convId,
        messages,
        createdAt: new Date()
      }
    } catch (error) {
      if (error instanceof DatabaseError) {
        console.error('[Chat] Database error:', error.details)
        res.status(503).json({
          error: 'Database unavailable',
          details: error.details,
          code: error.code
        })
        return
      }
      throw error
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
      resolutions,
      preferences
    )

    // Add assistant response to conversation
    conversation.messages.push({
      role: 'assistant',
      content: response.text
    })

    // Save state to database
    try {
      await saveResolutions(resolutions)
      await saveConversation(convId, conversation.messages)
      
      // Save preferences if they were updated
      if (response.preferencesUpdate) {
        await savePreferences(response.preferencesUpdate)
      }
    } catch (error) {
      if (error instanceof DatabaseError) {
        console.error('[Chat] Failed to save state:', error.details)
        // Still return the response, but log the save failure
      } else {
        throw error
      }
    }

    // Get current list of all resolutions to send to frontend
    const allResolutions = Array.from(resolutions.values()).filter(r => r.status === 'active')

    res.json({
      response: response.text,
      conversationId: convId,
      toolsUsed: response.toolsUsed,
      resolutionUpdate: response.resolutionUpdate,
      resolutions: allResolutions
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
router.get('/:conversationId', async (req: Request, res: Response) => {
  try {
    const messages = await loadConversation(req.params.conversationId)
    
    if (messages.length === 0) {
      res.status(404).json({ error: 'Conversation not found' })
      return
    }
    
    res.json({
      id: req.params.conversationId,
      messages
    })
  } catch (error) {
    if (error instanceof DatabaseError) {
      res.status(503).json({
        error: 'Database unavailable',
        details: error.details,
        code: error.code
      })
      return
    }
    console.error('Error fetching conversation:', error)
    res.status(500).json({ error: 'Failed to fetch conversation', details: (error as Error).message })
  }
})

// Get all resolutions (for UI initialization)
router.get('/resolutions/list/all', async (req: Request, res: Response) => {
  try {
    const allResolutions = await loadResolutions()
    const activeResolutions = Array.from(allResolutions.values()).filter(r => r.status === 'active')
    
    res.json({ 
      resolutions: activeResolutions,
      count: activeResolutions.length
    })
  } catch (error) {
    if (error instanceof DatabaseError) {
      res.status(503).json({
        error: 'Database unavailable',
        details: error.details,
        code: error.code,
        resolutions: [],
        count: 0
      })
      return
    }
    console.error('Error fetching resolutions:', error)
    res.status(500).json({ 
      error: 'Failed to fetch resolutions', 
      details: (error as Error).message,
      resolutions: [],
      count: 0
    })
  }
})

export default router
