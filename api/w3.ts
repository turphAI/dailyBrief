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

/**
 * Unified W3 Deep Research API endpoint
 * Handles sessions, queries, and resources operations
 *
 * Routes:
 * - GET  /api/w3?action=sessions&sessionId=xxx  - Load session
 * - GET  /api/w3?action=sessions                - Load all sessions
 * - POST /api/w3?action=session                 - Create/update session
 * - DELETE /api/w3?action=session&sessionId=xxx - Delete session
 * - POST /api/w3?action=query                   - Add query to session
 * - POST /api/w3?action=resource                - Add resource to session
 * - PUT  /api/w3?action=resource                - Update resource
 * - DELETE /api/w3?action=resource              - Remove resource
 */
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
    // SESSIONS OPERATIONS
    // ========================================================================

    if (action === 'sessions') {
      // GET - Load session(s)
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
    }

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
    // QUERIES OPERATIONS
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
    // RESOURCES OPERATIONS
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
