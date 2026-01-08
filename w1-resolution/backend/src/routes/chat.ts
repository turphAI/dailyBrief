import express, { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { handleChatMessage } from '../services/chat.js'
import { createClient } from 'redis'
import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Load .env.local from project root
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const envPath = path.resolve(__dirname, '../../../../.env.local')

dotenv.config({ path: envPath })

const router = express.Router()

let redisClient: any = null
let isRedisConnected = false

async function getRedisClient() {
  if (isRedisConnected && redisClient) {
    return redisClient
  }

  const redisUrl = process.env.KV_URL || process.env.REDIS_URL
  if (redisUrl) {
    try {
      redisClient = createClient({ url: redisUrl })
      await redisClient.connect()
      isRedisConnected = true
      console.log('✅ Redis connected')
      return redisClient
    } catch (e: any) {
      console.error('❌ Redis connection failed:', e.message)
      isRedisConnected = false
      return null
    }
  }
  return null
}

// In-memory storage fallback
const inMemoryResolutions = new Map<string, any>()
const inMemoryConversations = new Map<string, any>()

// Chat endpoint - handles conversational messages with tool calling
router.post('/', async (req: Request, res: Response) => {
  const useRedis = !!(process.env.KV_URL || process.env.REDIS_URL)
  
  try {
    const { message, conversationId } = req.body

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' })
      return
    }

    const convId = conversationId || uuidv4()
    
    // Get or create conversation
    let conversation: any = null
    if (useRedis) {
      const client = await getRedisClient()
      if (client && isRedisConnected) {
        const data = await client.get(`conversation:${convId}`)
        conversation = data ? JSON.parse(data) : null
      }
    }
    
    if (!conversation) {
      conversation = inMemoryConversations.get(convId)
    }

    if (!conversation) {
      conversation = {
        id: convId,
        messages: [],
        createdAt: new Date()
      }
    }

    // Add user message
    conversation.messages.push({
      role: 'user',
      content: message
    })

    console.log(`[Chat] Processing message: "${message.substring(0, 50)}..." (using ${useRedis && isRedisConnected ? 'Redis' : 'in-memory'})`)

    // Get resolutions from Redis or memory
    let resolutions = new Map<string, any>()
    if (useRedis) {
      const client = await getRedisClient()
      if (client && isRedisConnected) {
        const ids = await client.sMembers('resolutions:all')
        if (ids && ids.length > 0) {
          for (const id of ids) {
            const data = await client.get(`resolution:${id}`)
            if (data) {
              const resolution = JSON.parse(data)
              resolutions.set(resolution.id, resolution)
            }
          }
        }
      } else {
        resolutions = inMemoryResolutions
      }
    } else {
      resolutions = inMemoryResolutions
    }

    // Get Claude's response with tool use
    const response = await handleChatMessage(
      conversation.messages,
      resolutions
    )

    // Add assistant response to conversation
    conversation.messages.push({
      role: 'assistant',
      content: response.text
    })

    // Save conversation
    if (useRedis) {
      const client = await getRedisClient()
      if (client && isRedisConnected) {
        await client.setEx(`conversation:${convId}`, 86400, JSON.stringify(conversation))
      } else {
        inMemoryConversations.set(convId, conversation)
      }
    } else {
      inMemoryConversations.set(convId, conversation)
    }

    // Save resolutions back to Redis if using Redis
    if (useRedis) {
      const client = await getRedisClient()
      if (client && isRedisConnected) {
        for (const [id, resolution] of resolutions.entries()) {
          await client.set(`resolution:${id}`, JSON.stringify(resolution))
          await client.sAdd('resolutions:all', id)
        }
      }
    }

    // Get current list of all resolutions to send to frontend
    const allResolutions = Array.from(resolutions.values()).filter(r => r.status === 'active')

    res.json({
      response: response.text,
      conversationId: convId,
      toolsUsed: response.toolsUsed,
      resolutionUpdate: response.resolutionUpdate,
      resolutions: allResolutions // Include all resolutions for UI sync
    })
  } catch (error) {
    console.error('Chat error:', error)
    res.status(500).json({ 
      error: 'Failed to process message',
      details: (error as Error).message
    })
  }
})

// Get conversation history
router.get('/:conversationId', async (req: Request, res: Response) => {
  const useRedis = !!(process.env.KV_URL || process.env.REDIS_URL)
  
  try {
    let conversation: any = null
    
    if (useRedis) {
      const client = await getRedisClient()
      if (client && isRedisConnected) {
        const data = await client.get(`conversation:${req.params.conversationId}`)
        conversation = data ? JSON.parse(data) : null
      }
    }
    
    if (!conversation) {
      conversation = inMemoryConversations.get(req.params.conversationId)
    }
    
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' })
      return
    }
    
    res.json(conversation)
  } catch (error) {
    console.error('Error fetching conversation:', error)
    res.status(500).json({ error: 'Failed to fetch conversation', details: (error as Error).message })
  }
})

// Get all resolutions (for UI initialization)
router.get('/resolutions/list/all', async (req: Request, res: Response) => {
  const useRedis = !!(process.env.KV_URL || process.env.REDIS_URL)
  
  try {
    let allResolutions: any[] = []
    
    if (useRedis) {
      const client = await getRedisClient()
      if (client && isRedisConnected) {
        const ids = await client.sMembers('resolutions:all')
        if (ids && ids.length > 0) {
          for (const id of ids) {
            const data = await client.get(`resolution:${id}`)
            if (data) {
              allResolutions.push(JSON.parse(data))
            }
          }
        }
      } else {
        allResolutions = Array.from(inMemoryResolutions.values())
      }
    } else {
      allResolutions = Array.from(inMemoryResolutions.values())
    }
    
    res.json({ resolutions: allResolutions })
  } catch (error) {
    console.error('Error fetching resolutions:', error)
    res.status(500).json({ error: 'Failed to fetch resolutions', details: (error as Error).message })
  }
})

export default router

