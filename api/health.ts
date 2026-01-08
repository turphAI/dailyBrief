import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    apiKey: !!process.env.ANTHROPIC_API_KEY,
    redis: !!process.env.REDIS_URL
  })
}
