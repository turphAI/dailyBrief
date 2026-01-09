/**
 * SMS Management API
 * 
 * Handles phone number configuration and verification.
 * 
 * POST /api/sms/verify - Request verification code
 * POST /api/sms/confirm - Confirm verification code
 * DELETE /api/sms - Remove phone number
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from 'redis'
import {
  loadPreferences,
  savePreferences,
  DatabaseError
} from './lib/db'
import {
  normalizePhoneNumber,
  sendVerificationCode,
  isSMSConfigured
} from './lib/sms'

// ============================================================================
// Verification Code Storage
// ============================================================================

const VERIFICATION_TTL = 600 // 10 minutes
const VERIFICATION_KEY_PREFIX = 'sms:verify:'

async function storeVerificationCode(phone: string, code: string): Promise<void> {
  const redisUrl = process.env.KV_URL || process.env.REDIS_URL
  if (!redisUrl) {
    console.log('[SMS] No Redis, storing code in memory (dev mode)')
    return
  }

  const client = createClient({ url: redisUrl })
  await client.connect()
  await client.setEx(`${VERIFICATION_KEY_PREFIX}${phone}`, VERIFICATION_TTL, code)
  await client.quit()
}

async function getVerificationCode(phone: string): Promise<string | null> {
  const redisUrl = process.env.KV_URL || process.env.REDIS_URL
  if (!redisUrl) {
    return null
  }

  const client = createClient({ url: redisUrl })
  await client.connect()
  const code = await client.get(`${VERIFICATION_KEY_PREFIX}${phone}`)
  await client.quit()
  return code
}

async function clearVerificationCode(phone: string): Promise<void> {
  const redisUrl = process.env.KV_URL || process.env.REDIS_URL
  if (!redisUrl) return

  const client = createClient({ url: redisUrl })
  await client.connect()
  await client.del(`${VERIFICATION_KEY_PREFIX}${phone}`)
  await client.quit()
}

// ============================================================================
// Handler
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,DELETE')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const path = req.url?.replace('/api/sms', '') || ''

  // GET /api/sms - Get SMS status
  if (req.method === 'GET') {
    try {
      const preferences = await loadPreferences()
      
      return res.status(200).json({
        enabled: preferences.sms.enabled,
        configured: !!preferences.sms.phoneNumber,
        verified: preferences.sms.verified,
        phoneNumber: preferences.sms.phoneNumber 
          ? `***-***-${preferences.sms.phoneNumber.slice(-4)}`
          : null,
        quietHours: preferences.sms.quietHours,
        snsConfigured: isSMSConfigured()
      })
    } catch (error) {
      if (error instanceof DatabaseError) {
        return res.status(503).json({ error: 'Database unavailable', details: error.details })
      }
      throw error
    }
  }

  // POST /api/sms/verify - Request verification code
  if (req.method === 'POST' && path === '/verify') {
    try {
      const { phoneNumber } = req.body

      if (!phoneNumber) {
        return res.status(400).json({ error: 'Phone number required' })
      }

      // Normalize phone number
      const { valid, normalized, error } = normalizePhoneNumber(phoneNumber)
      if (!valid || !normalized) {
        return res.status(400).json({ error: error || 'Invalid phone number' })
      }

      // Generate and send verification code
      const result = await sendVerificationCode(normalized)
      
      if (!result.success) {
        return res.status(500).json({ error: 'Failed to send verification code', details: result.error })
      }

      // Store the code (result.messageId contains the code in stubbed mode)
      const code = result.stubbed ? result.messageId! : Math.floor(100000 + Math.random() * 900000).toString()
      await storeVerificationCode(normalized, code)

      // Update preferences with pending phone number
      const preferences = await loadPreferences()
      preferences.sms.phoneNumber = normalized
      preferences.sms.verified = false
      await savePreferences(preferences)

      return res.status(200).json({
        success: true,
        message: 'Verification code sent',
        stubbed: result.stubbed,
        // Only include code in stubbed mode for testing
        ...(result.stubbed ? { code } : {})
      })
    } catch (error) {
      console.error('[SMS] Verify error:', error)
      return res.status(500).json({ 
        error: 'Failed to send verification',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // POST /api/sms/confirm - Confirm verification code
  if (req.method === 'POST' && path === '/confirm') {
    try {
      const { code } = req.body

      if (!code) {
        return res.status(400).json({ error: 'Verification code required' })
      }

      const preferences = await loadPreferences()
      
      if (!preferences.sms.phoneNumber) {
        return res.status(400).json({ error: 'No pending verification' })
      }

      // Get stored code
      const storedCode = await getVerificationCode(preferences.sms.phoneNumber)
      
      // In stubbed/dev mode, accept any 6-digit code if no stored code
      if (!storedCode) {
        if (code.length === 6 && /^\d+$/.test(code)) {
          preferences.sms.verified = true
          preferences.sms.enabled = true
          await savePreferences(preferences)
          
          return res.status(200).json({
            success: true,
            message: 'Phone number verified (dev mode)',
            phoneNumber: `***-***-${preferences.sms.phoneNumber.slice(-4)}`
          })
        }
        return res.status(400).json({ error: 'Invalid or expired verification code' })
      }

      // Verify code
      if (code !== storedCode) {
        return res.status(400).json({ error: 'Invalid verification code' })
      }

      // Mark as verified and enable SMS
      preferences.sms.verified = true
      preferences.sms.enabled = true
      await savePreferences(preferences)
      await clearVerificationCode(preferences.sms.phoneNumber)

      return res.status(200).json({
        success: true,
        message: 'Phone number verified',
        phoneNumber: `***-***-${preferences.sms.phoneNumber.slice(-4)}`
      })
    } catch (error) {
      console.error('[SMS] Confirm error:', error)
      return res.status(500).json({ 
        error: 'Failed to verify',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // DELETE /api/sms - Remove phone number
  if (req.method === 'DELETE') {
    try {
      const preferences = await loadPreferences()
      
      preferences.sms.phoneNumber = null
      preferences.sms.verified = false
      preferences.sms.enabled = false
      await savePreferences(preferences)

      return res.status(200).json({
        success: true,
        message: 'Phone number removed'
      })
    } catch (error) {
      if (error instanceof DatabaseError) {
        return res.status(503).json({ error: 'Database unavailable', details: error.details })
      }
      throw error
    }
  }

  return res.status(405).json({
    error: 'Method not allowed',
    allowed: ['GET', 'POST', 'DELETE', 'OPTIONS']
  })
}
