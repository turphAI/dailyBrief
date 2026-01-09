/**
 * Preferences Routes - Local Development
 * 
 * Handles user preferences for updates/reminders.
 */

import express, { Request, Response } from 'express'
import {
  loadPreferences,
  savePreferences,
  DatabaseError,
  type UserPreferences
} from '../lib/db.js'

const router = express.Router()

// GET /api/preferences - Get current preferences
router.get('/', async (req: Request, res: Response) => {
  try {
    const preferences = await loadPreferences()
    res.json(preferences)
  } catch (error) {
    if (error instanceof DatabaseError) {
      res.status(503).json({
        error: 'Database unavailable',
        details: error.details,
        code: error.code
      })
      return
    }
    console.error('Error loading preferences:', error)
    res.status(500).json({ 
      error: 'Failed to load preferences',
      details: (error as Error).message
    })
  }
})

// PUT /api/preferences - Update preferences
router.put('/', async (req: Request, res: Response) => {
  try {
    const currentPrefs = await loadPreferences()
    const updates = req.body as Partial<UserPreferences>

    // Merge updates with current preferences
    const newPrefs: UserPreferences = {
      ...currentPrefs,
      ...updates,
      // Deep merge nested objects
      inConversation: {
        ...currentPrefs.inConversation,
        ...(updates.inConversation || {})
      },
      sms: {
        ...currentPrefs.sms,
        ...(updates.sms || {}),
        quietHours: {
          ...currentPrefs.sms.quietHours,
          ...(updates.sms?.quietHours || {})
        }
      },
      defaultCadence: {
        ...currentPrefs.defaultCadence,
        ...(updates.defaultCadence || {})
      },
      updatedAt: new Date().toISOString()
    }

    await savePreferences(newPrefs)
    console.log('[Preferences] Updated:', JSON.stringify(updates))

    res.json({
      success: true,
      message: 'Preferences updated',
      preferences: newPrefs
    })
  } catch (error) {
    if (error instanceof DatabaseError) {
      res.status(503).json({
        error: 'Database unavailable',
        details: error.details,
        code: error.code
      })
      return
    }
    console.error('Error saving preferences:', error)
    res.status(500).json({ 
      error: 'Failed to save preferences',
      details: (error as Error).message
    })
  }
})

export default router
