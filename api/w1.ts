/**
 * Week 1 Resolution Tracker - Unified API Endpoint
 *
 * Handles all w1 utility operations via query parameter routing:
 * - List resolutions
 * - Preferences management
 * - SMS operations
 *
 * Note: Main chat endpoint remains at /api/chat due to complexity
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  loadResolutions,
  loadPreferences,
  savePreferences,
  DatabaseError,
  type UserPreferences
} from './lib/db'
import { sendSMS } from './lib/sms'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  const { action } = req.query

  if (!action || typeof action !== 'string') {
    return res.status(400).json({ error: 'Action parameter is required' })
  }

  try {
    // ========================================================================
    // RESOLUTIONS - List all active resolutions
    // ========================================================================

    if (action === 'resolutions' && req.method === 'GET') {
      try {
        const allResolutions = await loadResolutions()
        const activeResolutions = Array.from(allResolutions.values()).filter(
          r => r.status === 'active'
        )

        console.log(`[W1] Loaded ${activeResolutions.length} active resolutions`)

        return res.status(200).json({
          resolutions: activeResolutions,
          count: activeResolutions.length
        })
      } catch (error) {
        console.error('[W1 Resolutions] Error:', error)

        if (error instanceof DatabaseError) {
          return res.status(503).json({
            error: 'Database unavailable',
            details: error.details,
            code: error.code,
            resolutions: [],
            count: 0
          })
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return res.status(500).json({
          error: 'Failed to fetch resolutions',
          details: errorMessage,
          resolutions: [],
          count: 0
        })
      }
    }

    // ========================================================================
    // PREFERENCES - Get or update user preferences
    // ========================================================================

    if (action === 'preferences') {
      // GET - Fetch current preferences
      if (req.method === 'GET') {
        try {
          const preferences = await loadPreferences()

          return res.status(200).json({
            preferences,
            success: true
          })
        } catch (error) {
          console.error('[W1 Preferences] Error loading:', error)

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
          console.error('[W1 Preferences] Error saving:', error)

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
    }

    // ========================================================================
    // SMS - Send or verify SMS
    // ========================================================================

    if (action === 'sms' && req.method === 'POST') {
      const { phoneNumber, message } = req.body

      if (!phoneNumber || !message) {
        return res.status(400).json({
          error: 'Phone number and message are required'
        })
      }

      try {
        const result = await sendSMS(phoneNumber, message)

        return res.status(200).json({
          success: true,
          messageId: result.messageId,
          message: 'SMS sent successfully'
        })
      } catch (error) {
        console.error('[W1 SMS] Error sending:', error)

        return res.status(500).json({
          success: false,
          error: 'Failed to send SMS',
          details: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return res.status(400).json({ error: 'Invalid action or method' })

  } catch (error) {
    console.error('[W1] API error:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    })
  }
}
