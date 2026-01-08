import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from 'redis'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  
  const health: any = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      anthropicApiKey: !!process.env.ANTHROPIC_API_KEY,
      redisUrl: !!(process.env.KV_URL || process.env.REDIS_URL),
    }
  }

  // Test Redis connection
  const redisUrl = process.env.KV_URL || process.env.REDIS_URL
  if (redisUrl) {
    try {
      const client = createClient({ url: redisUrl })
      await client.connect()
      await client.ping()
      health.redis = { connected: true }
      await client.disconnect()
    } catch (e: any) {
      health.redis = { connected: false, error: e.message }
    }
  } else {
    health.redis = { connected: false, reason: 'No Redis URL configured' }
  }

  res.status(200).json(health)
}
