/**
 * Week 3 Deep Research - Unified API Endpoint
 *
 * Handles all w3 operations via query parameter routing:
 * - Research queries with Claude (auto-categorization)
 * - Session management (CRUD)
 * - Queries management
 * - Resources management
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'
import {
  saveSession,
  loadSession,
  loadAllSessions,
  deleteSession,
  addQueryToSession,
  addResourceToSession,
  removeResourceFromSession,
  updateResourceInSession,
  type ResearchSession,
  type ResearchQuery,
  type Resource
} from './w3-lib/db'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { action, sessionId } = req.query

  if (!action || typeof action !== 'string') {
    return res.status(400).json({ error: 'Action parameter is required' })
  }

  try {
    // ========================================================================
    // RESEARCH - Claude-powered research with auto-categorization
    // ========================================================================

    if (action === 'research' && req.method === 'POST') {
      const { topic, question, context = [] } = req.body

      if (!topic || !question) {
        return res.status(400).json({ error: 'Topic and question are required' })
      }

      const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

      if (!ANTHROPIC_API_KEY) {
        return res.status(500).json({ error: 'Anthropic API key not configured' })
      }

      const anthropic = new Anthropic({
        apiKey: ANTHROPIC_API_KEY
      })

      // Auto-detect category using Claude
      const categoryDetectionPrompt = `Analyze this research question and classify it into ONE of these categories:
- concept: Theoretical ideas, principles, methodologies, or abstract concepts
- technology: Specific technologies, frameworks, tools, programming languages, or technical implementations
- company: Companies, products, services, or commercial solutions
- implementation: How-to questions, implementation details, code examples, or practical application
- other: Questions that don't fit the above categories

Research Topic: ${topic}
Question: ${question}

Respond with ONLY the category name (concept, technology, company, implementation, or other). No explanation.`

      const categoryMessage = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 20,
        messages: [
          {
            role: 'user',
            content: categoryDetectionPrompt
          }
        ]
      })

      const detectedCategory = categoryMessage.content[0].type === 'text'
        ? categoryMessage.content[0].text.trim().toLowerCase()
        : 'other'

      // Validate category
      const validCategories = ['concept', 'technology', 'company', 'implementation', 'other']
      const category = validCategories.includes(detectedCategory) ? detectedCategory : 'other'

      // Build context from previous queries
      const contextStr = context.length > 0
        ? `\n\nPrevious research context:\n${context.map((c: any, i: number) =>
            `${i + 1}. Q: ${c.question}\n   A: ${c.response.substring(0, 200)}...`
          ).join('\n\n')}`
        : ''

      const systemPrompt = `You are an expert researcher helping to conduct deep research on the topic: "${topic}".

Your task is to provide comprehensive, well-researched answers that:
- Are accurate and fact-based
- Include multiple perspectives when relevant
- Cite key concepts, companies, or technologies
- Explain technical terms clearly
- Provide context and examples
- Suggest related areas to explore

This question has been categorized as: ${category}

Format your response in clear markdown with:
- Headers for main sections
- Bullet points for lists
- Code blocks for technical examples
- Bold for key terms${contextStr}`

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: question
          }
        ]
      })

      const response = message.content[0].type === 'text'
        ? message.content[0].text
        : 'Unable to generate response'

      return res.status(200).json({
        response,
        category,
        sources: []
      })
    }

    // ========================================================================
    // SESSIONS - Load session(s)
    // ========================================================================

    if (action === 'sessions' && req.method === 'GET') {
      if (sessionId && typeof sessionId === 'string') {
        const session = await loadSession(sessionId)
        if (!session) {
          return res.status(404).json({ error: 'Session not found' })
        }
        return res.status(200).json(session)
      } else {
        const sessions = await loadAllSessions()
        return res.status(200).json(sessions)
      }
    }

    // ========================================================================
    // SESSION - Create, update, or delete session
    // ========================================================================

    if (action === 'session') {
      // POST - Create or update session
      if (req.method === 'POST') {
        const session = req.body as ResearchSession

        if (!session.id || !session.topic) {
          return res.status(400).json({ error: 'Session ID and topic are required' })
        }

        session.queries = session.queries || []
        session.resources = session.resources || []
        session.presentations = session.presentations || []

        await saveSession(session)
        return res.status(200).json(session)
      }

      // DELETE - Delete session
      if (req.method === 'DELETE') {
        if (!sessionId || typeof sessionId !== 'string') {
          return res.status(400).json({ error: 'Session ID is required' })
        }

        const deleted = await deleteSession(sessionId)
        if (!deleted) {
          return res.status(404).json({ error: 'Session not found' })
        }

        return res.status(200).json({ success: true })
      }
    }

    // ========================================================================
    // QUERY - Add query to session
    // ========================================================================

    if (action === 'query' && req.method === 'POST') {
      const { sessionId: sid, query } = req.body as { sessionId: string; query: ResearchQuery }

      if (!sid || !query) {
        return res.status(400).json({ error: 'Session ID and query are required' })
      }

      const session = await addQueryToSession(sid, query)
      if (!session) {
        return res.status(404).json({ error: 'Session not found' })
      }

      return res.status(200).json(session)
    }

    // ========================================================================
    // RESOURCE - Add, update, or remove resource
    // ========================================================================

    if (action === 'resource') {
      // POST - Add resource
      if (req.method === 'POST') {
        const { sessionId: sid, resource } = req.body as { sessionId: string; resource: Resource }

        if (!sid || !resource) {
          return res.status(400).json({ error: 'Session ID and resource are required' })
        }

        const session = await addResourceToSession(sid, resource)
        if (!session) {
          return res.status(404).json({ error: 'Session not found' })
        }

        return res.status(200).json(session)
      }

      // PUT - Update resource
      if (req.method === 'PUT') {
        const { sessionId: sid, resourceId, updates } = req.body as {
          sessionId: string
          resourceId: string
          updates: Partial<Resource>
        }

        if (!sid || !resourceId || !updates) {
          return res.status(400).json({ error: 'Session ID, resource ID, and updates are required' })
        }

        const session = await updateResourceInSession(sid, resourceId, updates)
        if (!session) {
          return res.status(404).json({ error: 'Session not found' })
        }

        return res.status(200).json(session)
      }

      // DELETE - Remove resource
      if (req.method === 'DELETE') {
        const { sessionId: sid, resourceId } = req.body as { sessionId: string; resourceId: string }

        if (!sid || !resourceId) {
          return res.status(400).json({ error: 'Session ID and resource ID are required' })
        }

        const session = await removeResourceFromSession(sid, resourceId)
        if (!session) {
          return res.status(404).json({ error: 'Session not found' })
        }

        return res.status(200).json(session)
      }
    }

    return res.status(400).json({ error: 'Invalid action or method' })

  } catch (error) {
    console.error('W3 API error:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    })
  }
}
