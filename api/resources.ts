import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  addResourceToSession,
  removeResourceFromSession,
  updateResourceInSession,
  type Resource
} from './w3-lib/db'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // POST /api/resources - Add resource to session
    if (req.method === 'POST') {
      const { sessionId, resource } = req.body as { sessionId: string; resource: Resource }

      if (!sessionId || !resource) {
        return res.status(400).json({ error: 'Session ID and resource are required' })
      }

      const session = await addResourceToSession(sessionId, resource)

      if (!session) {
        return res.status(404).json({ error: 'Session not found' })
      }

      return res.status(200).json(session)
    }

    // PUT /api/resources - Update resource in session
    if (req.method === 'PUT') {
      const { sessionId, resourceId, updates } = req.body as {
        sessionId: string
        resourceId: string
        updates: Partial<Resource>
      }

      if (!sessionId || !resourceId || !updates) {
        return res.status(400).json({ error: 'Session ID, resource ID, and updates are required' })
      }

      const session = await updateResourceInSession(sessionId, resourceId, updates)

      if (!session) {
        return res.status(404).json({ error: 'Session not found' })
      }

      return res.status(200).json(session)
    }

    // DELETE /api/resources - Remove resource from session
    if (req.method === 'DELETE') {
      const { sessionId, resourceId } = req.body as { sessionId: string; resourceId: string }

      if (!sessionId || !resourceId) {
        return res.status(400).json({ error: 'Session ID and resource ID are required' })
      }

      const session = await removeResourceFromSession(sessionId, resourceId)

      if (!session) {
        return res.status(404).json({ error: 'Session not found' })
      }

      return res.status(200).json(session)
    }

    return res.status(405).json({ error: 'Method not allowed' })

  } catch (error) {
    console.error('Resources API error:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    })
  }
}
