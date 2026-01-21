/**
 * Week 3 Deep Research - Unified API Endpoint
 *
 * Handles all w3 operations via query parameter routing:
 * - Research queries with Claude (auto-categorization)
 * - Session management (CRUD)
 * - Queries management
 * - Resources management
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'
import {
  saveSession,
  loadSession,
  loadAllSessions,
  deleteSession,
  addQueryToSession,
  addResourceToSession,
  removeResourceFromSession,
  updateResourceInSession,
  type ResearchSession,
  type ResearchQuery,
  type Resource
} from './w3-lib/db'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { action, sessionId } = req.query

  if (!action || typeof action !== 'string') {
    return res.status(400).json({ error: 'Action parameter is required' })
  }

  try {
    // ========================================================================
    // RESEARCH - Claude-powered research with auto-categorization
    // ========================================================================

    if (action === 'research' && req.method === 'POST') {
      const { topic, question, context = [] } = req.body

      if (!topic || !question) {
        return res.status(400).json({ error: 'Topic and question are required' })
      }

      const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

      if (!ANTHROPIC_API_KEY) {
        return res.status(500).json({ error: 'Anthropic API key not configured' })
      }

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
        ? `\n\nPrevious research context:\n${context.map((c: any, i: number) =>
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
        sources: []
      })
    }

    // ========================================================================
    // GENERATE-DOCUMENT - Generate comprehensive research document
    // ========================================================================

    if (action === 'generate-document' && req.method === 'POST') {
      const { sessionId: sid, topic, description, queries = [], resources = [], threads = [] } = req.body

      if (!topic) {
        return res.status(400).json({ error: 'Topic is required' })
      }

      const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

      if (!ANTHROPIC_API_KEY) {
        return res.status(500).json({ error: 'Anthropic API key not configured' })
      }

      const anthropic = new Anthropic({
        apiKey: ANTHROPIC_API_KEY
      })

      // Build context from applied threads (highest priority)
      const appliedThreads = threads.filter((t: any) => t.status === 'applied' && t.documentImpact)
      const threadsContext = appliedThreads.length > 0
        ? appliedThreads.map((t: any) =>
            `### ${t.title}\n\n${t.documentImpact.preview}`
          ).join('\n\n')
        : ''

      // Build context from queries (only include non-thread queries or use as supplementary)
      const queriesContext = queries.length > 0
        ? queries.slice(0, 20).map((q: any, i: number) =>
            `Q${i + 1}: ${q.question}\nA${i + 1}: ${q.response}`
          ).join('\n\n')
        : ''

      // Build context from resources
      const resourcesContext = resources.length > 0
        ? resources.map((r: any) =>
            `- ${r.title || 'Untitled'} ${r.url ? `(${r.url})` : ''}${r.notes ? `: ${r.notes}` : ''}`
          ).join('\n')
        : ''

      const systemPrompt = `You are an expert technical writer and researcher. Your task is to create a comprehensive, well-structured research document.

The document should:
- Start with a clear executive summary
- Be organized with clear sections and subsections
- Synthesize information from conversation threads, queries, and resources
- Use markdown formatting (headers, lists, code blocks, emphasis)
- Include concrete examples and explanations
- Highlight key concepts, technologies, and companies
- Be coherent and flow naturally (not just a Q&A list)
- Be suitable for both learning and reference

IMPORTANT: Prioritize content from applied conversation threads (already synthesized) over raw Q&A queries.

Format: Use proper markdown with ## for main sections, ### for subsections, bullet points, code blocks, etc.`

      const userPrompt = `Generate a comprehensive research document on the topic: **${topic}**

${description ? `Description: ${description}\n` : ''}
${threadsContext ? `\n## Applied Research Threads (Priority Content)\n\n${threadsContext}\n` : ''}
${queriesContext ? `\n## Additional Research Queries\n\n${queriesContext}\n` : ''}
${resourcesContext ? `\n## Additional Resources\n\n${resourcesContext}\n` : ''}

Based on the above information, create a well-structured research document that synthesizes everything into a cohesive, educational document. Prioritize the applied threads content (already in prose form) and integrate any additional queries/resources that add value. Organize information thematically into logical sections.`

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      })

      const document = message.content[0].type === 'text'
        ? message.content[0].text
        : '# Unable to generate document\n\nPlease try again.'

      return res.status(200).json({
        document,
        generatedAt: new Date().toISOString()
      })
    }

    // ========================================================================
    // ANALYZE-THREAD - Analyze conversation thread for document integration
    // ========================================================================

    if (action === 'analyze-thread' && req.method === 'POST') {
      const { sessionId: sid, threadId, messages: threadMessages = [], existingDocument = '' } = req.body

      if (!threadMessages || threadMessages.length === 0) {
        return res.status(400).json({ error: 'Thread messages are required' })
      }

      const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

      if (!ANTHROPIC_API_KEY) {
        return res.status(500).json({ error: 'Anthropic API key not configured' })
      }

      const anthropic = new Anthropic({
        apiKey: ANTHROPIC_API_KEY
      })

      // Build conversation context
      const conversationContext = threadMessages
        .map((m: any) => `[${m.role.toUpperCase()}]: ${m.content}`)
        .join('\n\n')

      // Parse existing document sections (if available)
      const documentSections = existingDocument
        .split('\n')
        .filter(line => line.startsWith('##'))
        .map(line => line.replace(/^##\s*/, ''))
        .join(', ')

      const systemPrompt = `You are a research document architect. Analyze a conversation thread and determine how to integrate it into a research document.

Your task:
1. Read the conversation thread chronologically
2. Identify the core topic/question being explored
3. Track how understanding evolved through the conversation
4. Extract the final conclusions and key insights
5. Synthesize into coherent, well-written prose (NOT Q&A format)
6. Determine where this fits in the existing document structure

Respond with JSON containing:
{
  "summary": "Brief description of what this thread explores (1-2 sentences)",
  "insights": ["Key insight 1", "Key insight 2", ...],
  "integrationStrategy": "new-section" | "merge-existing",
  "targetSection": "Section name if merging, null for new section",
  "proposedContent": "Markdown content to add (coherent prose, not Q&A)",
  "reasoning": "Brief explanation of your integration strategy"
}

IMPORTANT: proposedContent should be well-written prose that synthesizes the conversation into a coherent narrative. Include markdown formatting (headers, lists, code blocks as needed).`

      const userPrompt = `## Existing Document Sections
${documentSections || 'No existing sections'}

## Conversation Thread
${conversationContext}

Analyze this thread and provide integration recommendations in JSON format.`

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      })

      const responseText = message.content[0].type === 'text'
        ? message.content[0].text
        : '{}'

      // Parse JSON response
      let analysis
      try {
        // Extract JSON from response (handle cases where Claude adds extra text)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
      } catch (e) {
        console.error('Failed to parse analysis JSON:', e)
        analysis = {
          summary: 'Failed to analyze thread',
          insights: [],
          integrationStrategy: 'new-section',
          targetSection: null,
          proposedContent: conversationContext,
          reasoning: 'Auto-generated fallback'
        }
      }

      return res.status(200).json(analysis)
    }

    // ========================================================================
    // APPLY-THREAD - Apply analyzed thread to document
    // ========================================================================

    if (action === 'apply-thread' && req.method === 'POST') {
      const { sessionId: sid, threadId, proposedContent } = req.body

      if (!sid || !threadId || !proposedContent) {
        return res.status(400).json({ error: 'Session ID, thread ID, and proposed content are required' })
      }

      // Load session
      const session = await loadSession(sid)
      if (!session) {
        return res.status(404).json({ error: 'Session not found' })
      }

      // For now, we'll just mark this as successful
      // The actual document integration happens in the frontend when regenerating
      // The proposedContent will be included when calling generate-document

      return res.status(200).json({
        success: true,
        message: 'Thread marked for application'
      })
    }

    // ========================================================================
    // SESSIONS - Load session(s)
    // ========================================================================

    if (action === 'sessions' && req.method === 'GET') {
      if (sessionId && typeof sessionId === 'string') {
        const session = await loadSession(sessionId)
        if (!session) {
          return res.status(404).json({ error: 'Session not found' })
        }
        return res.status(200).json(session)
      } else {
        const sessions = await loadAllSessions()
        return res.status(200).json(sessions)
      }
    }

    // ========================================================================
    // SESSION - Create, update, or delete session
    // ========================================================================

    if (action === 'session') {
      // POST - Create or update session
      if (req.method === 'POST') {
        const session = req.body as ResearchSession

        if (!session.id || !session.topic) {
          return res.status(400).json({ error: 'Session ID and topic are required' })
        }

        session.queries = session.queries || []
        session.resources = session.resources || []
        session.presentations = session.presentations || []

        await saveSession(session)
        return res.status(200).json(session)
      }

      // DELETE - Delete session
      if (req.method === 'DELETE') {
        if (!sessionId || typeof sessionId !== 'string') {
          return res.status(400).json({ error: 'Session ID is required' })
        }

        const deleted = await deleteSession(sessionId)
        if (!deleted) {
          return res.status(404).json({ error: 'Session not found' })
        }

        return res.status(200).json({ success: true })
      }
    }

    // ========================================================================
    // QUERY - Add query to session
    // ========================================================================

    if (action === 'query' && req.method === 'POST') {
      const { sessionId: sid, query } = req.body as { sessionId: string; query: ResearchQuery }

      if (!sid || !query) {
        return res.status(400).json({ error: 'Session ID and query are required' })
      }

      const session = await addQueryToSession(sid, query)
      if (!session) {
        return res.status(404).json({ error: 'Session not found' })
      }

      return res.status(200).json(session)
    }

    // ========================================================================
    // RESOURCE - Add, update, or remove resource
    // ========================================================================

    if (action === 'resource') {
      // POST - Add resource
      if (req.method === 'POST') {
        const { sessionId: sid, resource } = req.body as { sessionId: string; resource: Resource }

        if (!sid || !resource) {
          return res.status(400).json({ error: 'Session ID and resource are required' })
        }

        const session = await addResourceToSession(sid, resource)
        if (!session) {
          return res.status(404).json({ error: 'Session not found' })
        }

        return res.status(200).json(session)
      }

      // PUT - Update resource
      if (req.method === 'PUT') {
        const { sessionId: sid, resourceId, updates } = req.body as {
          sessionId: string
          resourceId: string
          updates: Partial<Resource>
        }

        if (!sid || !resourceId || !updates) {
          return res.status(400).json({ error: 'Session ID, resource ID, and updates are required' })
        }

        const session = await updateResourceInSession(sid, resourceId, updates)
        if (!session) {
          return res.status(404).json({ error: 'Session not found' })
        }

        return res.status(200).json(session)
      }

      // DELETE - Remove resource
      if (req.method === 'DELETE') {
        const { sessionId: sid, resourceId } = req.body as { sessionId: string; resourceId: string }

        if (!sid || !resourceId) {
          return res.status(400).json({ error: 'Session ID and resource ID are required' })
        }

        const session = await removeResourceFromSession(sid, resourceId)
        if (!session) {
          return res.status(404).json({ error: 'Session not found' })
        }

        return res.status(200).json(session)
      }
    }

    // ========================================================================
    // HEALTH - Database health check
    // ========================================================================

    if (action === 'health' && req.method === 'GET') {
      const { checkHealth } = await import('./w3-lib/db')
      const health = await checkHealth()

      return res.status(health.connected ? 200 : 503).json({
        database: health,
        timestamp: new Date().toISOString()
      })
    }

    return res.status(400).json({ error: 'Invalid action or method' })

  } catch (error) {
    console.error('W3 API error:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    })
  }
}
