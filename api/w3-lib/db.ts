/**
 * Database Layer - Redis/Vercel KV
 *
 * Persistent storage for research sessions, queries, resources, and presentations
 */

import { createClient, RedisClientType } from 'redis'

// ============================================================================
// Types (mirror frontend types)
// ============================================================================

export interface Resource {
  id: string
  url?: string
  file?: {
    name: string
    size: number
    type: string
    data?: string
  }
  title?: string
  type?: 'documentation' | 'article' | 'video' | 'github' | 'paper' | 'file' | 'other'
  notes?: string
  tags?: string[]
  addedAt: string
  linkedToQuery?: string
}

export interface ResearchQuery {
  id: string
  question: string
  timestamp: string
  response?: string
  sources?: string[]
  resources?: Resource[]
  notes?: string
  category?: 'concept' | 'technology' | 'company' | 'implementation' | 'other'
}

export interface Presentation {
  id: string
  title: string
  version: string
  targetAudience: string
  description?: string
  slides?: any[]
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface ConversationThread {
  id: string
  title: string
  messageIds: string[]
  createdAt: string
  status: 'draft' | 'applied' | 'archived'
  summary?: string
  appliedAt?: string
  documentImpact?: {
    section: string
    preview: string
  }
}

export interface ResearchSession {
  id: string
  topic: string
  description?: string
  queries: ResearchQuery[]
  resources: Resource[]
  presentations: Presentation[]
  threads?: ConversationThread[]
  messages?: Message[]
  createdAt: string
  updatedAt: string
}

// ============================================================================
// Redis Client Management
// ============================================================================

let redisClient: RedisClientType | null = null
let isConnected = false
let connectionPromise: Promise<RedisClientType> | null = null

async function getClient(): Promise<RedisClientType> {
  if (isConnected && redisClient) {
    return redisClient
  }

  if (connectionPromise) {
    return connectionPromise
  }

  connectionPromise = connectToRedis()

  try {
    const client = await connectionPromise
    return client
  } finally {
    connectionPromise = null
  }
}

async function connectToRedis(): Promise<RedisClientType> {
  const redisUrl = process.env.KV_URL || process.env.REDIS_URL

  if (!redisUrl) {
    throw new DatabaseError(
      'Database not configured',
      'REDIS_URL or KV_URL environment variable is required'
    )
  }

  try {
    redisClient = createClient({ url: redisUrl }) as RedisClientType

    redisClient.on('error', (err) => {
      console.error('[W3 DB] Redis error:', err.message)
      isConnected = false
    })

    redisClient.on('reconnecting', () => {
      console.log('[W3 DB] Redis reconnecting...')
    })

    redisClient.on('ready', () => {
      console.log('[W3 DB] Redis ready')
      isConnected = true
    })

    await redisClient.connect()
    isConnected = true
    console.log('[W3 DB] ✅ Redis connected')

    return redisClient
  } catch (error) {
    isConnected = false
    redisClient = null
    throw new DatabaseError(
      'Database connection failed',
      error instanceof Error ? error.message : 'Unknown error'
    )
  }
}

// ============================================================================
// Custom Error
// ============================================================================

export class DatabaseError extends Error {
  public readonly code: string
  public readonly details: string

  constructor(message: string, details: string, code: string = 'DB_ERROR') {
    super(message)
    this.name = 'DatabaseError'
    this.code = code
    this.details = details
  }
}

// ============================================================================
// Sessions
// ============================================================================

const SESSIONS_SET_KEY = 'w3:sessions:all'
const SESSION_KEY_PREFIX = 'w3:session:'

/**
 * Create or update a research session
 */
export async function saveSession(session: ResearchSession): Promise<void> {
  const client = await getClient()

  session.updatedAt = new Date().toISOString()

  await Promise.all([
    client.set(`${SESSION_KEY_PREFIX}${session.id}`, JSON.stringify(session)),
    client.sAdd(SESSIONS_SET_KEY, session.id)
  ])

  console.log(`[W3 DB] Saved session: ${session.topic}`)
}

/**
 * Load a single session by ID
 */
export async function loadSession(sessionId: string): Promise<ResearchSession | null> {
  const client = await getClient()
  const data = await client.get(`${SESSION_KEY_PREFIX}${sessionId}`)

  if (!data) {
    return null
  }

  try {
    return JSON.parse(data) as ResearchSession
  } catch (e) {
    console.error(`[W3 DB] Failed to parse session ${sessionId}:`, e)
    return null
  }
}

/**
 * Load all sessions
 */
export async function loadAllSessions(): Promise<ResearchSession[]> {
  const client = await getClient()
  const ids = await client.sMembers(SESSIONS_SET_KEY)

  if (ids.length === 0) {
    console.log('[W3 DB] No sessions found')
    return []
  }

  const results = await Promise.all(
    ids.map(id => client.get(`${SESSION_KEY_PREFIX}${id}`))
  )

  const sessions: ResearchSession[] = []
  for (let i = 0; i < ids.length; i++) {
    const data = results[i]
    if (data) {
      try {
        sessions.push(JSON.parse(data) as ResearchSession)
      } catch (e) {
        console.error(`[W3 DB] Failed to parse session ${ids[i]}:`, e)
      }
    }
  }

  console.log(`[W3 DB] Loaded ${sessions.length} sessions`)
  return sessions.sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
  const client = await getClient()

  const [deleted] = await Promise.all([
    client.del(`${SESSION_KEY_PREFIX}${sessionId}`),
    client.sRem(SESSIONS_SET_KEY, sessionId)
  ])

  console.log(`[W3 DB] Deleted session: ${sessionId}`)
  return deleted > 0
}

/**
 * Add a query to a session
 */
export async function addQueryToSession(
  sessionId: string,
  query: ResearchQuery
): Promise<ResearchSession | null> {
  const session = await loadSession(sessionId)
  if (!session) {
    return null
  }

  session.queries = [query, ...session.queries]
  await saveSession(session)

  return session
}

/**
 * Add a resource to a session
 */
export async function addResourceToSession(
  sessionId: string,
  resource: Resource
): Promise<ResearchSession | null> {
  const session = await loadSession(sessionId)
  if (!session) {
    return null
  }

  session.resources = [...session.resources, resource]
  await saveSession(session)

  return session
}

/**
 * Remove a resource from a session
 */
export async function removeResourceFromSession(
  sessionId: string,
  resourceId: string
): Promise<ResearchSession | null> {
  const session = await loadSession(sessionId)
  if (!session) {
    return null
  }

  session.resources = session.resources.filter(r => r.id !== resourceId)
  await saveSession(session)

  return session
}

/**
 * Update a resource in a session
 */
export async function updateResourceInSession(
  sessionId: string,
  resourceId: string,
  updates: Partial<Resource>
): Promise<ResearchSession | null> {
  const session = await loadSession(sessionId)
  if (!session) {
    return null
  }

  session.resources = session.resources.map(r =>
    r.id === resourceId ? { ...r, ...updates } : r
  )
  await saveSession(session)

  return session
}

// ============================================================================
// Health Check
// ============================================================================

export interface DatabaseHealth {
  connected: boolean
  latencyMs: number
  error?: string
}

export async function checkHealth(): Promise<DatabaseHealth> {
  const start = Date.now()

  try {
    const client = await getClient()
    await client.ping()

    return {
      connected: true,
      latencyMs: Date.now() - start
    }
  } catch (error) {
    return {
      connected: false,
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
