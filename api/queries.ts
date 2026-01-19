import type { VercelRequest, VercelResponse } from '@vercel/node'
import { addQueryToSession, type ResearchQuery } from './w3-lib/db'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { sessionId, query } = req.body as { sessionId: string; query: ResearchQuery }

    if (!sessionId || !query) {
      return res.status(400).json({ error: 'Session ID and query are required' })
    }

    const session = await addQueryToSession(sessionId, query)

    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    return res.status(200).json(session)

  } catch (error) {
    console.error('Queries API error:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    })
  }
}
