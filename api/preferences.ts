/**
 * Preferences API Endpoint
 * 
 * GET /api/preferences - Get current user preferences
 * PUT /api/preferences - Update user preferences
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { loadPreferences, savePreferences, DatabaseError, type UserPreferences } from './lib/db'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  // GET - Fetch current preferences
  if (req.method === 'GET') {
    try {
      const preferences = await loadPreferences()
      
      return res.status(200).json({
        preferences,
        success: true
      })
    } catch (error) {
      console.error('[Preferences] Error loading:', error)
      
      if (error instanceof DatabaseError) {
        return res.status(503).json({
          error: 'Database unavailable',
          details: error.details,
          code: error.code
        })
      }

      return res.status(500).json({
        error: 'Failed to load preferences',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // PUT - Update preferences
  if (req.method === 'PUT') {
    try {
      const updates = req.body as Partial<UserPreferences>
      
      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({
          error: 'Invalid request body',
          details: 'Request body must be a preferences object'
        })
      }

      // Load current preferences and merge with updates
      const currentPreferences = await loadPreferences()
      
      // Deep merge updates
      const updatedPreferences: UserPreferences = {
        ...currentPreferences,
        ...updates,
        inConversation: {
          ...currentPreferences.inConversation,
          ...(updates.inConversation || {})
        },
        sms: {
          ...currentPreferences.sms,
          ...(updates.sms || {}),
          quietHours: {
            ...currentPreferences.sms.quietHours,
            ...(updates.sms?.quietHours || {})
          }
        },
        defaultCadence: {
          ...currentPreferences.defaultCadence,
          ...(updates.defaultCadence || {})
        }
      }

      await savePreferences(updatedPreferences)

      return res.status(200).json({
        preferences: updatedPreferences,
        success: true,
        message: 'Preferences updated'
      })
    } catch (error) {
      console.error('[Preferences] Error saving:', error)
      
      if (error instanceof DatabaseError) {
        return res.status(503).json({
          error: 'Database unavailable',
          details: error.details,
          code: error.code
        })
      }

      return res.status(500).json({
        error: 'Failed to save preferences',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Handle other methods
  return res.status(405).json({
    error: 'Method not allowed',
    allowed: ['GET', 'PUT', 'OPTIONS']
  })
}
