import type { VercelRequest, VercelResponse } from '@vercel/node'

interface ModelResponse {
  model: string
  response: string
  responseTime: number
  error?: string
}

interface ComparisonRequest {
  prompt: string
  models: string[]
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { prompt, models } = req.body as ComparisonRequest

  // Validate input
  if (!prompt || !models || !Array.isArray(models) || models.length === 0) {
    return res.status(400).json({
      error: 'Invalid request. Provide prompt and models array.'
    })
  }

  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({
      error: 'OpenRouter API key not configured'
    })
  }

  // Run all model requests in parallel
  const results = await Promise.all(
    models.map(async (model): Promise<ModelResponse> => {
      const startTime = Date.now()

      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.VERCEL_URL || 'http://localhost:3000',
            'X-Title': 'Model Mapper'
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 1000
          })
        })

        const responseTime = Date.now() - startTime

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          return {
            model,
            response: '',
            responseTime,
            error: errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
          }
        }

        const data = await response.json()
        const content = data.choices?.[0]?.message?.content || 'No response'

        return {
          model,
          response: content,
          responseTime
        }
      } catch (error) {
        const responseTime = Date.now() - startTime
        return {
          model,
          response: '',
          responseTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    })
  )

  return res.status(200).json({
    results
  })
}
