/**
 * List Resolutions Endpoint
 * 
 * Returns all active resolutions for UI initialization.
 * GET /api/chat/resolutions/list/all
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { loadResolutions, DatabaseError } from '../../../lib/db'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  // Handle GET requests
  if (req.method === 'GET') {
    try {
      const allResolutions = await loadResolutions()
      const activeResolutions = Array.from(allResolutions.values()).filter(
        r => r.status === 'active'
      )

      console.log(`[Resolutions] Loaded ${activeResolutions.length} active resolutions`)

      return res.status(200).json({
        resolutions: activeResolutions,
        count: activeResolutions.length
      })
    } catch (error) {
      console.error('[Resolutions] Error:', error)
      
      if (error instanceof DatabaseError) {
        return res.status(503).json({
          error: 'Database unavailable',
          details: error.details,
          code: error.code,
          resolutions: [],
          count: 0
        })
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return res.status(500).json({
        error: 'Failed to fetch resolutions',
        details: errorMessage,
        resolutions: [],
        count: 0
      })
    }
  }

  // Handle other methods
  return res.status(405).json({
    error: 'Method not allowed',
    allowed: ['GET', 'OPTIONS']
  })
}
