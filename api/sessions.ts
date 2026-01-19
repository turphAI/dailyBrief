import type { VercelRequest, VercelResponse } from '@vercel/node'
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

  const { sessionId } = req.query

  try {
    // GET /api/sessions - Load all sessions
    // GET /api/sessions?sessionId=xxx - Load specific session
    if (req.method === 'GET') {
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

    // POST /api/sessions - Create or update session
    if (req.method === 'POST') {
      const session = req.body as ResearchSession

      if (!session.id || !session.topic) {
        return res.status(400).json({ error: 'Session ID and topic are required' })
      }

      // Ensure arrays exist
      session.queries = session.queries || []
      session.resources = session.resources || []
      session.presentations = session.presentations || []

      await saveSession(session)

      return res.status(200).json(session)
    }

    // DELETE /api/sessions?sessionId=xxx - Delete session
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

    return res.status(405).json({ error: 'Method not allowed' })

  } catch (error) {
    console.error('Sessions API error:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    })
  }
}
