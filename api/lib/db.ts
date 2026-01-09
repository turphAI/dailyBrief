/**
 * Database Layer - Redis Only
 * 
 * Single source of truth for all data storage.
 * No in-memory fallback - if Redis is unavailable, operations fail gracefully.
 */

import { createClient, RedisClientType } from 'redis'

// ============================================================================
// Types
// ============================================================================

export interface Resolution {
  id: string
  title: string
  measurable_criteria: string
  context?: string
  status: 'active' | 'completed'
  createdAt: string
  updatedAt?: string
  completedAt?: string
  updates: Update[]
  // Future: updateSettings for nudge configuration
}

export interface Update {
  id: string
  type: 'progress' | 'setback' | 'milestone' | 'note' | 'check_in_response'
  content: string
  sentiment?: 'positive' | 'neutral' | 'struggling'
  progressDelta?: number
  createdAt: string
  triggeredBy?: 'user' | 'nudge' | 'sms'
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface DatabaseHealth {
  connected: boolean
  latencyMs: number
  error?: string
}

// ============================================================================
// Redis Client Management
// ============================================================================

let redisClient: RedisClientType | null = null
let isConnected = false
let connectionPromise: Promise<RedisClientType> | null = null

/**
 * Get or create Redis client connection.
 * Throws if Redis URL is not configured or connection fails.
 */
async function getClient(): Promise<RedisClientType> {
  // Return existing connected client
  if (isConnected && redisClient) {
    return redisClient
  }

  // Return in-progress connection
  if (connectionPromise) {
    return connectionPromise
  }

  // Start new connection
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
      console.error('[DB] Redis error:', err.message)
      isConnected = false
    })

    redisClient.on('reconnecting', () => {
      console.log('[DB] Redis reconnecting...')
    })

    redisClient.on('ready', () => {
      console.log('[DB] Redis ready')
      isConnected = true
    })

    await redisClient.connect()
    isConnected = true
    console.log('[DB] ✅ Redis connected')
    
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
// Health Check
// ============================================================================

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

// ============================================================================
// Resolutions
// ============================================================================

const RESOLUTIONS_SET_KEY = 'resolutions:all'
const RESOLUTION_KEY_PREFIX = 'resolution:'

/**
 * Load all resolutions from database.
 * Returns empty Map if no resolutions exist.
 * Throws DatabaseError if connection fails.
 */
export async function loadResolutions(): Promise<Map<string, Resolution>> {
  const resolutions = new Map<string, Resolution>()
  
  const client = await getClient()
  const ids = await client.sMembers(RESOLUTIONS_SET_KEY)
  
  if (ids.length === 0) {
    console.log('[DB] No resolutions found')
    return resolutions
  }

  // Load all resolutions in parallel
  const results = await Promise.all(
    ids.map(id => client.get(`${RESOLUTION_KEY_PREFIX}${id}`))
  )

  for (let i = 0; i < ids.length; i++) {
    const data = results[i]
    if (data) {
      try {
        const resolution = JSON.parse(data) as Resolution
        resolutions.set(resolution.id, resolution)
      } catch (e) {
        console.error(`[DB] Failed to parse resolution ${ids[i]}:`, e)
      }
    }
  }

  console.log(`[DB] Loaded ${resolutions.size} resolutions`)
  return resolutions
}

/**
 * Save all resolutions to database.
 * Uses pipeline for efficiency.
 */
export async function saveResolutions(resolutions: Map<string, Resolution>): Promise<void> {
  const client = await getClient()
  
  // Use pipeline for atomic batch operation
  const pipeline = client.multi()
  
  for (const [id, resolution] of resolutions.entries()) {
    pipeline.set(`${RESOLUTION_KEY_PREFIX}${id}`, JSON.stringify(resolution))
    pipeline.sAdd(RESOLUTIONS_SET_KEY, id)
  }
  
  await pipeline.exec()
  console.log(`[DB] Saved ${resolutions.size} resolutions`)
}

/**
 * Save a single resolution.
 */
export async function saveResolution(resolution: Resolution): Promise<void> {
  const client = await getClient()
  
  await Promise.all([
    client.set(`${RESOLUTION_KEY_PREFIX}${resolution.id}`, JSON.stringify(resolution)),
    client.sAdd(RESOLUTIONS_SET_KEY, resolution.id)
  ])
  
  console.log(`[DB] Saved resolution: ${resolution.title}`)
}

/**
 * Delete a resolution.
 */
export async function deleteResolutionFromDb(id: string): Promise<boolean> {
  const client = await getClient()
  
  const [deleted] = await Promise.all([
    client.del(`${RESOLUTION_KEY_PREFIX}${id}`),
    client.sRem(RESOLUTIONS_SET_KEY, id)
  ])
  
  console.log(`[DB] Deleted resolution: ${id}`)
  return deleted > 0
}

// ============================================================================
// Conversations
// ============================================================================

const CONVERSATION_KEY_PREFIX = 'conversation:'
const CONVERSATION_TTL_SECONDS = 86400 // 24 hours

/**
 * Load conversation messages.
 * Returns empty array if conversation doesn't exist.
 */
export async function loadConversation(conversationId: string): Promise<Message[]> {
  const client = await getClient()
  const data = await client.get(`${CONVERSATION_KEY_PREFIX}${conversationId}`)
  
  if (!data) {
    return []
  }

  try {
    return JSON.parse(data) as Message[]
  } catch (e) {
    console.error(`[DB] Failed to parse conversation ${conversationId}:`, e)
    return []
  }
}

/**
 * Save conversation messages with TTL.
 */
export async function saveConversation(conversationId: string, messages: Message[]): Promise<void> {
  const client = await getClient()
  
  await client.setEx(
    `${CONVERSATION_KEY_PREFIX}${conversationId}`,
    CONVERSATION_TTL_SECONDS,
    JSON.stringify(messages)
  )
  
  console.log(`[DB] Saved conversation: ${conversationId} (${messages.length} messages)`)
}

// ============================================================================
// Future: Preferences (stubbed for Phase 1)
// ============================================================================

const PREFERENCES_KEY = 'preferences'

export interface UserPreferences {
  updatesEnabled: boolean
  inConversation: {
    enabled: boolean
    frequency: 'gentle' | 'moderate' | 'persistent'
  }
  sms: {
    enabled: boolean
    phoneNumber: string | null
    verified: boolean
    quietHours: {
      enabled: boolean
      start: string
      end: string
      timezone: string
    }
  }
  defaultCadence: {
    checkInDays: number[]
    preferredTimeUTC: string
    maxNudgesPerDay: number
  }
  updatedAt: string
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  updatesEnabled: true,
  inConversation: {
    enabled: true,
    frequency: 'moderate'
  },
  sms: {
    enabled: false,
    phoneNumber: null,
    verified: false,
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '08:00',
      timezone: 'America/New_York'
    }
  },
  defaultCadence: {
    checkInDays: [1, 3, 5], // Mon, Wed, Fri
    preferredTimeUTC: '14:00',
    maxNudgesPerDay: 3
  },
  updatedAt: new Date().toISOString()
}

/**
 * Load user preferences, returning defaults if none exist.
 */
export async function loadPreferences(): Promise<UserPreferences> {
  const client = await getClient()
  const data = await client.get(PREFERENCES_KEY)
  
  if (!data) {
    return { ...DEFAULT_PREFERENCES }
  }

  try {
    return JSON.parse(data) as UserPreferences
  } catch (e) {
    console.error('[DB] Failed to parse preferences:', e)
    return { ...DEFAULT_PREFERENCES }
  }
}

/**
 * Save user preferences.
 */
export async function savePreferences(preferences: UserPreferences): Promise<void> {
  const client = await getClient()
  preferences.updatedAt = new Date().toISOString()
  await client.set(PREFERENCES_KEY, JSON.stringify(preferences))
  console.log('[DB] Saved preferences')
}
