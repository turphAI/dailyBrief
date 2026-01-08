import type { VercelRequest, VercelResponse } from '@vercel/node'

// Global state (same instance as chat.ts during request)
// NOTE: This is a simplified approach for MVP
// In production, this would be shared across functions via Vercel KV
const resolutions = new Map<string, any>()

/**
 * List Resolutions Handler - GET /api/chat/resolutions/list/all
 * Returns all active resolutions for UI initialization
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
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

  // Handle GET requests
  if (req.method === 'GET') {
    try {
      const allResolutions = Array.from(resolutions.values()).filter(
        (r) => r.status === 'active'
      )

      console.log(`[Resolutions] Listed ${allResolutions.length} active resolutions`)

      return res.status(200).json({
        resolutions: allResolutions,
        count: allResolutions.length
      })
    } catch (error) {
      console.error('[Resolutions] Error:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      return res.status(500).json({
        error: 'Failed to fetch resolutions',
        details: errorMessage
      })
    }
  }

  // Handle other methods
  return res.status(405).json({
    error: 'Method not allowed',
    allowed: ['GET', 'OPTIONS']
  })
}
