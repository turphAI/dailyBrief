/**
 * Database Layer - Redis Only (Local Development)
 * 
 * Mirror of /api/lib/db.ts for local development.
 * Single source of truth for all data storage.
 */

import { createClient, RedisClientType } from 'redis'

// ============================================================================
// Types
// ============================================================================

export interface ResolutionUpdateSettings {
  enabled: boolean              // Override global setting for this resolution
  cadenceOverride?: {
    checkInDays: number[]       // 0-6, days of week
    preferredTimeUTC: string    // "14:00"
  }
  lastNudgeAt: string | null    // ISO timestamp
  nextNudgeAt: string | null    // ISO timestamp
  nudgeCount: number            // Total nudges sent
  responseRate: number          // 0-1, calculated from responses
}

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
  updateSettings: ResolutionUpdateSettings
  
  // Activity tracking (optional - for resolutions with recurring activities)
  cadence?: ResolutionCadence          // How often activity should be done
  milestones?: Milestone[]             // Checkpoints toward completion
  activityCompletions?: ActivityCompletion[]  // History of completed activities
}

export interface Update {
  id: string
  type: 'progress' | 'setback' | 'milestone' | 'note' | 'check_in_response'
  content: string
  sentiment?: 'positive' | 'neutral' | 'struggling'
  progressDelta?: number        // -100 to 100
  createdAt: string
  triggeredBy?: 'user' | 'nudge' | 'sms'
}

// ============================================================================
// Activity Tracking Types (Cadence & Completions)
// ============================================================================

/**
 * Defines how often an activity should be performed for a resolution.
 * Example: { frequency: 3, period: 'week' } = "3 times per week"
 */
export interface ResolutionCadence {
  frequency: number                    // How many times (e.g., 1, 3, 5)
  period: 'day' | 'week' | 'month'     // Per what period
  targetDays?: number[]                // Optional: specific days (0=Sun, 6=Sat)
  description?: string                 // Human-readable: "once a week"
}

/**
 * A milestone is a significant checkpoint toward completing a resolution.
 * Example: "Complete 10 hikes" or "Read 12 books"
 */
export interface Milestone {
  id: string
  title: string                        // "Complete 10 hikes"
  target: number                       // Target count (e.g., 10)
  current: number                      // Current progress count
  unit?: string                        // Optional unit: "hikes", "books", "workouts"
  completedAt?: string                 // ISO timestamp when milestone was achieved
  createdAt: string
}

/**
 * Records a single activity completion event.
 * Created when user reports completing an activity (e.g., "I just hiked Mt. Washington!")
 */
export interface ActivityCompletion {
  id: string
  timestamp: string                    // When the activity was completed
  description: string                  // What was done: "Hiked Mt. Washington"
  matchedFromMessage?: string          // Original user message that triggered this
  periodStart: string                  // Start of the cadence period this counts toward
  periodEnd: string                    // End of the cadence period
  createdAt: string                    // When this record was created
}

/**
 * Progress status for current cadence period
 */
export interface CadenceProgress {
  periodStart: string
  periodEnd: string
  completedCount: number               // How many activities completed this period
  targetCount: number                  // How many needed (from cadence.frequency)
  isOnTrack: boolean                   // completedCount >= targetCount
  remainingCount: number               // targetCount - completedCount (min 0)
  completionRate: number               // 0-1, completedCount / targetCount
}

export interface NudgeRecord {
  id: string
  resolutionId: string
  
  // Delivery
  channel: 'in_conversation' | 'sms'
  scheduledAt: string
  deliveredAt: string | null
  status: 'scheduled' | 'delivered' | 'responded' | 'skipped' | 'failed'
  
  // Content
  type: 'check_in' | 'encouragement' | 'milestone' | 'streak' | 'gentle_nudge'
  message: string
  
  // Response tracking
  responseAt: string | null
  responseContent: string | null
  responseSentiment: 'positive' | 'neutral' | 'struggling' | null
  
  createdAt: string
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
// Default Values
// ============================================================================

export const DEFAULT_UPDATE_SETTINGS: ResolutionUpdateSettings = {
  enabled: true,
  lastNudgeAt: null,
  nextNudgeAt: null,
  nudgeCount: 0,
  responseRate: 0
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
 * Ensure resolution has updateSettings (migration helper)
 */
function ensureUpdateSettings(resolution: any): Resolution {
  if (!resolution.updateSettings) {
    resolution.updateSettings = { ...DEFAULT_UPDATE_SETTINGS }
  }
  return resolution as Resolution
}

export async function loadResolutions(): Promise<Map<string, Resolution>> {
  const resolutions = new Map<string, Resolution>()
  
  const client = await getClient()
  const ids = await client.sMembers(RESOLUTIONS_SET_KEY)
  
  if (ids.length === 0) {
    console.log('[DB] No resolutions found')
    return resolutions
  }

  const results = await Promise.all(
    ids.map(id => client.get(`${RESOLUTION_KEY_PREFIX}${id}`))
  )

  for (let i = 0; i < ids.length; i++) {
    const data = results[i]
    if (data) {
      try {
        const resolution = ensureUpdateSettings(JSON.parse(data))
        resolutions.set(resolution.id, resolution)
      } catch (e) {
        console.error(`[DB] Failed to parse resolution ${ids[i]}:`, e)
      }
    }
  }

  console.log(`[DB] Loaded ${resolutions.size} resolutions`)
  return resolutions
}

export async function saveResolutions(resolutions: Map<string, Resolution>): Promise<void> {
  const client = await getClient()
  
  const pipeline = client.multi()
  
  for (const [id, resolution] of resolutions.entries()) {
    pipeline.set(`${RESOLUTION_KEY_PREFIX}${id}`, JSON.stringify(resolution))
    pipeline.sAdd(RESOLUTIONS_SET_KEY, id)
  }
  
  await pipeline.exec()
  console.log(`[DB] Saved ${resolutions.size} resolutions`)
}

export async function saveResolution(resolution: Resolution): Promise<void> {
  const client = await getClient()
  
  await Promise.all([
    client.set(`${RESOLUTION_KEY_PREFIX}${resolution.id}`, JSON.stringify(resolution)),
    client.sAdd(RESOLUTIONS_SET_KEY, resolution.id)
  ])
  
  console.log(`[DB] Saved resolution: ${resolution.title}`)
}

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
const CONVERSATION_TTL_SECONDS = 86400

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
// Preferences
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
    checkInDays: [1, 3, 5],
    preferredTimeUTC: '14:00',
    maxNudgesPerDay: 3
  },
  updatedAt: new Date().toISOString()
}

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

export async function savePreferences(preferences: UserPreferences): Promise<void> {
  const client = await getClient()
  preferences.updatedAt = new Date().toISOString()
  await client.set(PREFERENCES_KEY, JSON.stringify(preferences))
  console.log('[DB] Saved preferences')
}

// ============================================================================
// Nudge Records
// ============================================================================

const NUDGE_KEY_PREFIX = 'nudge:'
const NUDGES_BY_RESOLUTION_PREFIX = 'nudges:resolution:'
const NUDGES_SCHEDULED_KEY = 'nudges:scheduled'

export async function saveNudge(nudge: NudgeRecord): Promise<void> {
  const client = await getClient()
  
  const pipeline = client.multi()
  
  pipeline.set(`${NUDGE_KEY_PREFIX}${nudge.id}`, JSON.stringify(nudge))
  pipeline.sAdd(`${NUDGES_BY_RESOLUTION_PREFIX}${nudge.resolutionId}`, nudge.id)
  
  if (nudge.status === 'scheduled') {
    pipeline.zAdd(NUDGES_SCHEDULED_KEY, {
      score: new Date(nudge.scheduledAt).getTime(),
      value: nudge.id
    })
  }
  
  await pipeline.exec()
  console.log(`[DB] Saved nudge: ${nudge.id} for resolution ${nudge.resolutionId}`)
}

export async function loadNudge(nudgeId: string): Promise<NudgeRecord | null> {
  const client = await getClient()
  const data = await client.get(`${NUDGE_KEY_PREFIX}${nudgeId}`)
  
  if (!data) {
    return null
  }

  try {
    return JSON.parse(data) as NudgeRecord
  } catch (e) {
    console.error(`[DB] Failed to parse nudge ${nudgeId}:`, e)
    return null
  }
}

export async function loadNudgesForResolution(resolutionId: string): Promise<NudgeRecord[]> {
  const client = await getClient()
  const ids = await client.sMembers(`${NUDGES_BY_RESOLUTION_PREFIX}${resolutionId}`)
  
  if (ids.length === 0) {
    return []
  }

  const results = await Promise.all(
    ids.map(id => client.get(`${NUDGE_KEY_PREFIX}${id}`))
  )

  const nudges: NudgeRecord[] = []
  for (const data of results) {
    if (data) {
      try {
        nudges.push(JSON.parse(data) as NudgeRecord)
      } catch (e) {
        // Skip invalid records
      }
    }
  }

  return nudges.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export async function updateNudge(nudge: NudgeRecord): Promise<void> {
  const client = await getClient()
  
  if (nudge.status !== 'scheduled') {
    await client.zRem(NUDGES_SCHEDULED_KEY, nudge.id)
  }
  
  await client.set(`${NUDGE_KEY_PREFIX}${nudge.id}`, JSON.stringify(nudge))
  console.log(`[DB] Updated nudge: ${nudge.id} status=${nudge.status}`)
}

export async function getDueNudges(): Promise<NudgeRecord[]> {
  const client = await getClient()
  const now = Date.now()
  
  const ids = await client.zRangeByScore(NUDGES_SCHEDULED_KEY, 0, now)
  
  if (ids.length === 0) {
    return []
  }

  const results = await Promise.all(
    ids.map(id => client.get(`${NUDGE_KEY_PREFIX}${id}`))
  )

  const nudges: NudgeRecord[] = []
  for (const data of results) {
    if (data) {
      try {
        nudges.push(JSON.parse(data) as NudgeRecord)
      } catch (e) {
        // Skip invalid records
      }
    }
  }

  return nudges
}

// ============================================================================
// Cadence & Activity Progress Helpers
// ============================================================================

/**
 * Get the start and end of the current cadence period
 */
export function getCurrentPeriodBounds(
  period: 'day' | 'week' | 'month',
  referenceDate: Date = new Date()
): { start: Date; end: Date } {
  const start = new Date(referenceDate)
  const end = new Date(referenceDate)
  
  switch (period) {
    case 'day':
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      break
    case 'week':
      // Start on Sunday
      const dayOfWeek = start.getDay()
      start.setDate(start.getDate() - dayOfWeek)
      start.setHours(0, 0, 0, 0)
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
      break
    case 'month':
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      end.setMonth(end.getMonth() + 1)
      end.setDate(0) // Last day of current month
      end.setHours(23, 59, 59, 999)
      break
  }
  
  return { start, end }
}

/**
 * Calculate progress for a resolution's current cadence period
 */
export function calculateCadenceProgress(resolution: Resolution): CadenceProgress | null {
  if (!resolution.cadence) {
    return null
  }
  
  const { start, end } = getCurrentPeriodBounds(resolution.cadence.period)
  const completions = resolution.activityCompletions || []
  
  // Count completions within current period
  const periodCompletions = completions.filter(c => {
    const timestamp = new Date(c.timestamp)
    return timestamp >= start && timestamp <= end
  })
  
  const completedCount = periodCompletions.length
  const targetCount = resolution.cadence.frequency
  const remainingCount = Math.max(0, targetCount - completedCount)
  
  return {
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
    completedCount,
    targetCount,
    isOnTrack: completedCount >= targetCount,
    remainingCount,
    completionRate: targetCount > 0 ? Math.min(1, completedCount / targetCount) : 1
  }
}

/**
 * Check if a resolution has met its cadence target for the current period
 */
export function hasMetCadenceTarget(resolution: Resolution): boolean {
  const progress = calculateCadenceProgress(resolution)
  return progress?.isOnTrack ?? true // If no cadence, consider it "on track"
}

/**
 * Get a human-readable summary of cadence progress
 */
export function getCadenceProgressSummary(resolution: Resolution): string | null {
  const progress = calculateCadenceProgress(resolution)
  if (!progress) return null
  
  const cadence = resolution.cadence!
  const periodName = cadence.period === 'day' ? 'today' : 
                     cadence.period === 'week' ? 'this week' : 'this month'
  
  if (progress.isOnTrack) {
    return `✓ Completed ${progress.completedCount}/${progress.targetCount} ${periodName}`
  } else {
    return `${progress.completedCount}/${progress.targetCount} ${periodName} (${progress.remainingCount} remaining)`
  }
}
