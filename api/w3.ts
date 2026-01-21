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
      const {
        topic,
        question,
        description,
        context = [],
        threadContext = null,
        appliedThreads = [],
        inThread = false
      } = req.body

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

      // Build conversation history (use thread-specific if in thread)
      const conversationHistory = (inThread && threadContext) ? threadContext : context
      const conversationMessages = conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }))

      // Build context from applied threads
      const appliedThreadsContext = appliedThreads.length > 0
        ? `\n\n## Previously Researched Topics (Applied Threads)\n${appliedThreads.map((t: any) =>
            `### ${t.title}\n${t.summary || 'No summary available'}`
          ).join('\n\n')}`
        : ''

      // Build comprehensive system prompt
      let systemPrompt = `You are an expert AI researcher conducting deep, focused research on a specific topic. Your role is to help build comprehensive knowledge through iterative conversation and research.

## Research Topic
**${topic}**
${description ? `\n**Description**: ${description}\n` : ''}

## Your Task
Provide comprehensive, well-researched answers that:
- Stay strictly focused on the research topic: "${topic}"
- Build upon previous conversation context (if provided)
- Are accurate, fact-based, and include citations when relevant
- Include multiple perspectives when appropriate
- Explain technical terms clearly with examples
- Suggest related areas to explore within this topic
- Use concrete examples and case studies
- Identify key concepts, technologies, and companies

## Question Category
This question has been categorized as: **${category}**

## Knowledge Integration
${inThread ? '**Note**: You are in a focused conversation thread. Build upon the thread context to develop deeper understanding.' : 'You may reference previously researched topics when relevant, but stay focused on the current question.'}
${appliedThreadsContext}

## Response Format
Use clear markdown formatting:
- Headers (##, ###) for main sections
- Bullet points for lists
- Code blocks with language tags for technical examples
- **Bold** for key terms and concepts
- > Blockquotes for important callouts or definitions

Keep responses comprehensive but focused. Aim for depth over breadth.`

      // Build messages array with conversation history
      const messages = [
        ...conversationMessages,
        {
          role: 'user' as const,
          content: question
        }
      ]

      const completion = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        system: systemPrompt,
        messages: messages
      })

      const response = completion.content[0].type === 'text'
        ? completion.content[0].text
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

      const systemPrompt = `You are an expert technical writer and researcher specializing in synthesizing research into comprehensive, educational documentation.

## Your Task
Create a well-structured research document that serves as both a learning resource and technical reference.

## Document Requirements

### Structure
- **Executive Summary**: Concise overview of the topic, key insights, and what the document covers
- **Logical Organization**: Group related concepts into thematic sections
- **Progressive Depth**: Start with fundamentals, build to advanced topics
- **Clear Hierarchy**: Use ## for major sections, ### for subsections, #### for detailed points

### Content Quality
- **Synthesis Over Summation**: Integrate information from multiple sources into coherent narratives
- **Concrete Examples**: Include real-world examples, code snippets, case studies
- **Technical Accuracy**: Cite specific technologies, companies, methodologies
- **Actionable Insights**: Explain not just "what" but "why" and "how"
- **Balanced Perspective**: Include tradeoffs, challenges, and alternative approaches when relevant

### Formatting
- Use markdown effectively: headers, **bold** for key terms, \`code\`, code blocks with language tags
- Include > blockquotes for important callouts or definitions
- Use bullet points for lists, numbered lists for sequences
- Add horizontal rules (---) between major sections if needed

## Content Priority
1. **Applied Thread Content** (highest priority): Already synthesized prose from focused conversations
2. **Research Queries**: Raw Q&A that adds value not covered in threads
3. **Resources**: Citations and references that support the content

## Critical Guidelines
- NEVER use Q&A format in the final document
- Transform conversations into educational prose
- Connect ideas across different threads and queries
- Eliminate redundancy - synthesize overlapping content
- Maintain consistent terminology throughout
- Write for someone learning the topic from scratch`

      const userPrompt = `# Research Topic: ${topic}
${description ? `\n**Context**: ${description}\n` : ''}

${threadsContext ? `## Applied Research Threads\nThe following sections contain synthesized research from focused conversation threads. Use this as your primary content source:\n\n${threadsContext}\n\n` : ''}
${queriesContext ? `## Additional Research Questions & Answers\nThese Q&A pairs provide supplementary information. Integrate relevant insights into your document:\n\n${queriesContext}\n\n` : ''}
${resourcesContext ? `## Referenced Resources\nCite these resources where relevant:\n\n${resourcesContext}\n\n` : ''}

---

**Your Task**: Create a comprehensive, well-structured research document on "${topic}".

**Structure Guidance**:
1. Start with an Executive Summary
2. Organize content thematically (not chronologically or by source)
3. Build from foundational concepts to advanced topics
4. Include concrete examples and practical applications
5. End with conclusions or future directions

**Remember**: This document should teach someone about ${topic} in a coherent, engaging way. Transform the raw research into polished, educational content.`

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000, // Increased for comprehensive documents
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
      const {
        sessionId: sid,
        threadId,
        threadTitle,
        topic,
        description,
        messages: threadMessages = [],
        existingDocument = '',
        appliedThreads = []
      } = req.body

      if (!threadMessages || threadMessages.length === 0) {
        return res.status(400).json({ error: 'Thread messages are required' })
      }

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

      // Build context from other applied threads
      const otherThreadsContext = appliedThreads.length > 0
        ? `\n\n## Other Applied Threads\n${appliedThreads
            .filter((t: any) => t.id !== threadId)
            .map((t: any) => `- ${t.title}: ${t.summary || 'No summary'}`)
            .join('\n')}`
        : ''

      const systemPrompt = `You are a research document architect specializing in synthesizing research conversations into structured documentation.

## Research Context
**Topic**: ${topic}
${description ? `**Description**: ${description}` : ''}
**Thread Title**: ${threadTitle || 'Untitled Thread'}

## Your Task
Analyze this focused conversation thread and determine how to integrate it into a comprehensive research document. Remember:

1. **Read Chronologically**: Understand how the conversation evolved and what was discovered
2. **Identify Core Insights**: Extract key learnings, patterns, and conclusions
3. **Synthesize Into Prose**: Convert Q&A into coherent, well-written narrative
4. **Consider Context**: How does this relate to existing document content and other threads?
5. **Structure Thoughtfully**: Determine the best place and format for this content

## Integration Strategies
- **new-section**: Create a new section when the thread explores a distinct subtopic
- **merge-existing**: Merge into an existing section when it expands on covered material

## Output Format
Respond with JSON:
{
  "summary": "1-2 sentence summary of what this thread explores and concludes",
  "insights": ["Key insight 1", "Key insight 2", "Key insight 3"],
  "integrationStrategy": "new-section" | "merge-existing",
  "targetSection": "Existing section name (if merging) or suggested section name (if new)",
  "proposedContent": "Well-written markdown prose (NOT Q&A format)",
  "reasoning": "Brief explanation of your integration strategy and how it fits the topic"
}

**CRITICAL**: The proposedContent must be:
- Coherent narrative prose, NOT Q&A format
- Well-structured with headers (###), lists, code blocks as appropriate
- Focused on insights and learnings, not conversation mechanics
- Written for a reader who wants to learn about the topic
- Comprehensive enough to stand alone or enhance existing content`

      const userPrompt = `## Existing Document Structure
${documentSections ? `Current Sections: ${documentSections}` : 'No existing document sections'}
${otherThreadsContext}

## Conversation Thread to Analyze
${conversationContext}

Analyze this thread and provide integration recommendations in JSON format. Focus on synthesizing the conversation into valuable content for a research document on "${topic}".`

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
    // RUN-SKILL - Execute a research skill
    // ========================================================================

    if (action === 'run-skill' && req.method === 'POST') {
      const {
        sessionId: sid,
        skillId,
        skill,
        topic,
        description,
        parameters,
        documentContext
      } = req.body

      if (!skill || !topic) {
        return res.status(400).json({ error: 'Skill and topic are required' })
      }

      const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

      if (!ANTHROPIC_API_KEY) {
        return res.status(500).json({ error: 'Anthropic API key not configured' })
      }

      const anthropic = new Anthropic({
        apiKey: ANTHROPIC_API_KEY
      })

      // Build user prompt from template by replacing placeholders
      let userPrompt = skill.userPromptTemplate

      // Replace {topic} placeholder
      userPrompt = userPrompt.replace(/\{topic\}/g, topic)

      // Replace parameter placeholders
      for (const [key, value] of Object.entries(parameters)) {
        const placeholder = `{${key}}`
        userPrompt = userPrompt.replace(new RegExp(placeholder, 'g'), value as string)
      }

      // Add document context if available
      const contextNote = documentContext
        ? `\n\n## Current Document Context\n${documentContext.substring(0, 2000)}...`
        : ''

      const finalUserPrompt = userPrompt + contextNote

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: skill.systemPrompt,
        messages: [
          {
            role: 'user',
            content: finalUserPrompt
          }
        ]
      })

      const result = message.content[0].type === 'text'
        ? message.content[0].text
        : 'Unable to generate response'

      return res.status(200).json({
        result,
        skillId: skill.id,
        generatedAt: new Date().toISOString()
      })
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
