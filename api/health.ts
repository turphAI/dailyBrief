/**
 * Health Check Endpoint
 * 
 * Verifies database connectivity and returns system status.
 * GET /api/health
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { checkHealth } from './lib/db'

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  checks: {
    database: {
      status: 'connected' | 'disconnected'
      latencyMs: number
      error?: string
    }
    anthropic: {
      configured: boolean
    }
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const dbHealth = await checkHealth()
  const anthropicConfigured = !!process.env.ANTHROPIC_API_KEY

  // Determine overall status
  let status: HealthResponse['status'] = 'healthy'
  if (!dbHealth.connected) {
    status = 'unhealthy'
  } else if (!anthropicConfigured) {
    status = 'degraded'
  }

  const response: HealthResponse = {
    status,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    checks: {
      database: {
        status: dbHealth.connected ? 'connected' : 'disconnected',
        latencyMs: dbHealth.latencyMs,
        ...(dbHealth.error && { error: dbHealth.error })
      },
      anthropic: {
        configured: anthropicConfigured
      }
    }
  }

  // Return appropriate status code
  const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503
  res.status(statusCode).json(response)
}
