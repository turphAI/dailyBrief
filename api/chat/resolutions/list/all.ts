import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from 'redis'

// Redis client management
let redisClient: ReturnType<typeof createClient> | null = null
let isRedisConnected = false

async function getRedisClient() {
  if (isRedisConnected && redisClient) {
    return redisClient
  }

  const redisUrl = process.env.KV_URL || process.env.REDIS_URL
  if (redisUrl) {
    try {
      redisClient = createClient({ url: redisUrl })
      redisClient.on('error', (err) => {
        console.error('Redis client error:', err)
        isRedisConnected = false
      })
      await redisClient.connect()
      isRedisConnected = true
      console.log('✅ Redis connected')
      return redisClient
    } catch (e: any) {
      console.error('❌ Redis connection failed:', e.message)
      isRedisConnected = false
      return null
    }
  }
  return null
}

/**
 * List Resolutions Handler - GET /api/chat/resolutions/list/all
 * Returns all active resolutions for UI initialization
 */
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
      const resolutions: any[] = []

      // Try to load from Redis
      const client = await getRedisClient()
      if (client && isRedisConnected) {
        const ids = await client.sMembers('resolutions:all')
        if (ids && ids.length > 0) {
          for (const id of ids) {
            const data = await client.get(`resolution:${id}`)
            if (data) {
              const resolution = JSON.parse(data)
              if (resolution.status === 'active') {
                resolutions.push(resolution)
              }
            }
          }
        }
        console.log(`[Resolutions] Loaded ${resolutions.length} active resolutions from Redis`)
      } else {
        console.log('[Resolutions] No Redis connection, returning empty list')
      }

      return res.status(200).json({
        resolutions,
        count: resolutions.length
      })
    } catch (error) {
      console.error('[Resolutions] Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
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
