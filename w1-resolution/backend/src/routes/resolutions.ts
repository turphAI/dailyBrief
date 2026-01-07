import express, { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { analyzeResolutionWithClaude } from '../services/ai.js'

const router = express.Router()

// In-memory storage (replace with database later)
const resolutions = new Map<string, any>()

// Get all resolutions
router.get('/', (req: Request, res: Response) => {
  const allResolutions = Array.from(resolutions.values())
  res.json(allResolutions)
})

// Create a new resolution
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title } = req.body

    if (!title || typeof title !== 'string') {
      res.status(400).json({ error: 'Title is required' })
      return
    }

    const id = uuidv4()
    
    console.log(`Creating resolution: "${title}"`)
    
    // Get AI analysis
    let analysis = ''
    try {
      analysis = await analyzeResolutionWithClaude(title)
      console.log(`AI Analysis received: ${analysis.substring(0, 100)}...`)
    } catch (aiError) {
      console.error('AI Analysis failed:', aiError)
      // Continue without AI for now
      analysis = 'AI analysis temporarily unavailable'
    }

    const resolution = {
      id,
      title,
      createdAt: new Date().toISOString(),
      analysis,
      updates: []
    }

    resolutions.set(id, resolution)
    console.log(`Resolution saved with ID: ${id}`)
    res.status(201).json(resolution)
  } catch (error) {
    console.error('Error creating resolution:', error)
    res.status(500).json({ error: 'Failed to create resolution', details: (error as Error).message })
  }
})

// Get a single resolution
router.get('/:id', (req: Request, res: Response) => {
  const resolution = resolutions.get(req.params.id)
  
  if (!resolution) {
    res.status(404).json({ error: 'Resolution not found' })
    return
  }
  
  res.json(resolution)
})

// Add an update to a resolution
router.post('/:id/updates', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { content } = req.body

    const resolution = resolutions.get(id)
    if (!resolution) {
      res.status(404).json({ error: 'Resolution not found' })
      return
    }

    if (!content || typeof content !== 'string') {
      res.status(400).json({ error: 'Content is required' })
      return
    }

    // Get AI feedback
    const feedback = await analyzeResolutionWithClaude(content)

    const update = {
      id: uuidv4(),
      content,
      feedback,
      createdAt: new Date().toISOString()
    }

    resolution.updates.push(update)
    res.status(201).json(update)
  } catch (error) {
    console.error('Error adding update:', error)
    res.status(500).json({ error: 'Failed to add update' })
  }
})

export default router

