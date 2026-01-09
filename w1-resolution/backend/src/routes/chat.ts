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
  saveNudge,
  loadNudgesForResolution,
  DatabaseError,
  type Resolution,
  type UserPreferences,
  type NudgeRecord
} from '../lib/db.js'
import { generateUserInsights } from '../services/analytics.js'

const router = express.Router()

// Session nudge tracking (in-memory per conversation for simplicity)
// Reset when conversation changes or server restarts
const sessionNudgeCounts = new Map<string, number>()

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

    // Get session nudge count for this conversation
    const sessionNudgeCount = sessionNudgeCounts.get(convId) || 0

    // Load nudge records for analytics
    const allNudgeRecords: NudgeRecord[] = []
    for (const resolution of resolutions.values()) {
      const nudges = await loadNudgesForResolution(resolution.id)
      allNudgeRecords.push(...nudges)
    }

    // Add user message
    conversation.messages.push({
      role: 'user',
      content: message
    })

    console.log(`[Chat] Processing message: "${message.substring(0, 50)}..."`)

    // Get Claude's response with tool use, nudge logic, and analytics
    const response = await handleChatMessage(
      conversation.messages,
      resolutions,
      preferences,
      sessionNudgeCount,
      allNudgeRecords
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

      // Save nudge record if one was delivered
      if (response.nudgeDelivered) {
        await saveNudge(response.nudgeDelivered)
        // Increment session nudge count
        sessionNudgeCounts.set(convId, sessionNudgeCount + 1)
        console.log(`[Chat] Session nudge count for ${convId}: ${sessionNudgeCount + 1}`)
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
      resolutions: allResolutions,
      nudgeDelivered: response.nudgeDelivered ? {
        id: response.nudgeDelivered.id,
        resolutionId: response.nudgeDelivered.resolutionId,
        type: response.nudgeDelivered.type
      } : undefined
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

// Reset session nudge count (useful for testing or new sessions)
router.post('/session/reset', async (req: Request, res: Response) => {
  const { conversationId } = req.body
  if (conversationId) {
    sessionNudgeCounts.delete(conversationId)
    res.json({ success: true, message: `Session reset for ${conversationId}` })
  } else {
    sessionNudgeCounts.clear()
    res.json({ success: true, message: 'All sessions reset' })
  }
})

// Get analytics insights (for debugging and future dashboard)
router.get('/analytics/insights', async (req: Request, res: Response) => {
  try {
    const resolutions = await loadResolutions()
    
    // Load all nudge records
    const allNudgeRecords: NudgeRecord[] = []
    for (const resolution of resolutions.values()) {
      const nudges = await loadNudgesForResolution(resolution.id)
      allNudgeRecords.push(...nudges)
    }
    
    const insights = generateUserInsights(resolutions, allNudgeRecords)
    
    res.json({
      insights,
      summary: {
        totalDataPoints: insights.dataPoints,
        insightsGenerated: insights.promptInsights.length,
        promptInsights: insights.promptInsights
      }
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
    console.error('Error generating analytics:', error)
    res.status(500).json({ 
      error: 'Failed to generate analytics', 
      details: (error as Error).message 
    })
  }
})

export default router
