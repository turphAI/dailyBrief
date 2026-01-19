import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'

interface ResearchRequest {
  topic: string
  question: string
  context?: Array<{ question: string; response: string }>
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { topic, question, context = [] } = req.body as ResearchRequest

  if (!topic || !question) {
    return res.status(400).json({ error: 'Topic and question are required' })
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Anthropic API key not configured' })
  }

  try {
    const anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY
    })

    // Auto-detect category using Claude
    const categoryDetectionPrompt = `Analyze this research question and classify it into ONE of these categories:
- concept: Theoretical ideas, principles, methodologies, or abstract concepts
- technology: Specific technologies, frameworks, tools, programming languages, or technical implementations
- company: Companies, products, services, or commercial solutions
- implementation: How-to questions, implementation details, code examples, or practical application
- other: Questions that don't fit the above categories

Research Topic: ${topic}
Question: ${question}

Respond with ONLY the category name (concept, technology, company, implementation, or other). No explanation.`

    const categoryMessage = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 20,
      messages: [
        {
          role: 'user',
          content: categoryDetectionPrompt
        }
      ]
    })

    const detectedCategory = categoryMessage.content[0].type === 'text'
      ? categoryMessage.content[0].text.trim().toLowerCase()
      : 'other'

    // Validate category
    const validCategories = ['concept', 'technology', 'company', 'implementation', 'other']
    const category = validCategories.includes(detectedCategory) ? detectedCategory : 'other'

    // Build context from previous queries
    const contextStr = context.length > 0
      ? `\n\nPrevious research context:\n${context.map((c, i) =>
          `${i + 1}. Q: ${c.question}\n   A: ${c.response.substring(0, 200)}...`
        ).join('\n\n')}`
      : ''

    const systemPrompt = `You are an expert researcher helping to conduct deep research on the topic: "${topic}".

Your task is to provide comprehensive, well-researched answers that:
- Are accurate and fact-based
- Include multiple perspectives when relevant
- Cite key concepts, companies, or technologies
- Explain technical terms clearly
- Provide context and examples
- Suggest related areas to explore

This question has been categorized as: ${category}

Format your response in clear markdown with:
- Headers for main sections
- Bullet points for lists
- Code blocks for technical examples
- Bold for key terms${contextStr}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: question
        }
      ]
    })

    const response = message.content[0].type === 'text'
      ? message.content[0].text
      : 'Unable to generate response'

    return res.status(200).json({
      response,
      category,
      sources: [] // Could be enhanced to extract sources from response
    })

  } catch (error) {
    console.error('Research API error:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Research failed'
    })
  }
}
