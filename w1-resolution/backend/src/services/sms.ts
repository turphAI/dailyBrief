/**
 * SMS Service - Amazon SNS Integration (Local Dev)
 * 
 * Handles SMS delivery for resolution nudges.
 * Mirror of api/lib/sms.ts for local development.
 */

import type { Resolution, UserPreferences, NudgeRecord } from '../lib/db.js'

// ============================================================================
// Configuration
// ============================================================================

export interface SMSConfig {
  enabled: boolean
  region: string
  accessKeyId?: string
  secretAccessKey?: string
}

function getSMSConfig(): SMSConfig {
  return {
    enabled: !!process.env.AWS_SNS_ENABLED,
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
}

export function isSMSConfigured(): boolean {
  const config = getSMSConfig()
  return config.enabled && !!config.accessKeyId && !!config.secretAccessKey
}

// ============================================================================
// Message Templates
// ============================================================================

export type SMSTemplateType = 'check_in' | 'encouragement' | 'milestone' | 'streak' | 'gentle_nudge'

interface SMSTemplate {
  type: SMSTemplateType
  templates: string[]
}

const SMS_TEMPLATES: SMSTemplate[] = [
  {
    type: 'check_in',
    templates: [
      'Hey! How\'s "{title}" going? Quick update?',
      'Checking in on "{title}" - how are things progressing?',
      'Hi! Any updates on "{title}"? 📊'
    ]
  },
  {
    type: 'gentle_nudge',
    templates: [
      'It\'s been a bit since we talked about "{title}". Everything okay?',
      'Just thinking about your "{title}" goal. How\'s it coming along?',
      'Hey, wanted to check in on "{title}". Still on track?'
    ]
  },
  {
    type: 'encouragement',
    templates: [
      'Remember, setbacks are part of the journey. How can I help with "{title}"?',
      'Thinking of you and "{title}". Small steps count! How are you doing?',
      'Progress isn\'t always linear. How\'s "{title}" feeling today?'
    ]
  },
  {
    type: 'streak',
    templates: [
      'You\'ve been crushing it with "{title}"! 🔥 Keep the momentum going!',
      'Loving your consistency on "{title}"! How\'s today going?',
      'That streak on "{title}" is impressive! Still going strong? 💪'
    ]
  },
  {
    type: 'milestone',
    templates: [
      'Getting close to a milestone on "{title}"! How\'s progress?',
      'You might be hitting a milestone soon on "{title}"! Update? 🎯',
      'Big things happening with "{title}"? Let me know! ✨'
    ]
  }
]

/**
 * Generate SMS message from template
 */
export function generateSMSMessage(
  type: SMSTemplateType,
  resolution: Resolution
): string {
  const templateGroup = SMS_TEMPLATES.find(t => t.type === type)
  if (!templateGroup) {
    return `How's "${resolution.title}" going?`
  }

  const template = templateGroup.templates[
    Math.floor(Math.random() * templateGroup.templates.length)
  ]

  return template.replace('{title}', resolution.title)
}

// ============================================================================
// Phone Number Validation
// ============================================================================

export function normalizePhoneNumber(phone: string): { valid: boolean; normalized: string | null; error?: string } {
  let cleaned = phone.replace(/[^\d+]/g, '')
  
  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('1') && cleaned.length === 11) {
      cleaned = '+' + cleaned
    } else if (cleaned.length === 10) {
      cleaned = '+1' + cleaned
    } else {
      return { 
        valid: false, 
        normalized: null, 
        error: 'Invalid phone number format. Use 10 digits for US or include country code.' 
      }
    }
  }

  const e164Regex = /^\+[1-9]\d{9,14}$/
  if (!e164Regex.test(cleaned)) {
    return { 
      valid: false, 
      normalized: null, 
      error: 'Phone number must be in E.164 format (e.g., +1234567890)' 
    }
  }

  return { valid: true, normalized: cleaned }
}

// ============================================================================
// Quiet Hours Check
// ============================================================================

export function isQuietHours(preferences: UserPreferences): boolean {
  if (!preferences.sms.quietHours.enabled) {
    return false
  }

  const { start, end, timezone } = preferences.sms.quietHours
  
  try {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
    const currentTime = formatter.format(now)
    
    const [startHour, startMin] = start.split(':').map(Number)
    const [endHour, endMin] = end.split(':').map(Number)
    const [currHour, currMin] = currentTime.split(':').map(Number)
    
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    const currentMinutes = currHour * 60 + currMin
    
    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes < endMinutes
    }
    
    return currentMinutes >= startMinutes && currentMinutes < endMinutes
  } catch (error) {
    console.error('[SMS] Error checking quiet hours:', error)
    return false
  }
}

// ============================================================================
// SMS Sending (Stubbed)
// ============================================================================

export interface SMSResult {
  success: boolean
  messageId?: string
  error?: string
  stubbed?: boolean
}

export async function sendSMS(
  phoneNumber: string,
  message: string
): Promise<SMSResult> {
  const config = getSMSConfig()

  const { valid, normalized, error } = normalizePhoneNumber(phoneNumber)
  if (!valid || !normalized) {
    return { success: false, error: error || 'Invalid phone number' }
  }

  if (!config.enabled || !config.accessKeyId) {
    console.log('[SMS STUB] Would send to', normalized)
    console.log('[SMS STUB] Message:', message)
    
    return {
      success: true,
      messageId: `stub-${Date.now()}`,
      stubbed: true
    }
  }

  // TODO: Implement actual AWS SNS send
  console.log('[SMS] SNS configured but SDK not yet integrated')
  return {
    success: true,
    messageId: `pending-${Date.now()}`,
    stubbed: true
  }
}

export async function sendNudgeSMS(
  nudge: NudgeRecord,
  resolution: Resolution,
  preferences: UserPreferences
): Promise<SMSResult> {
  if (!preferences.sms.enabled) {
    return { success: false, error: 'SMS not enabled' }
  }

  if (!preferences.sms.phoneNumber) {
    return { success: false, error: 'No phone number configured' }
  }

  if (!preferences.sms.verified) {
    return { success: false, error: 'Phone number not verified' }
  }

  if (isQuietHours(preferences)) {
    return { success: false, error: 'Currently in quiet hours' }
  }

  const message = generateSMSMessage(nudge.type, resolution)
  return sendSMS(preferences.sms.phoneNumber, message)
}

export async function sendVerificationCode(phoneNumber: string): Promise<SMSResult> {
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const message = `Your dailyBrief verification code is: ${code}`
  
  const result = await sendSMS(phoneNumber, message)
  
  if (result.success) {
    console.log(`[SMS] Verification code for ${phoneNumber}: ${code}`)
    return { ...result, messageId: code }
  }
  
  return result
}

export function verifyCode(submittedCode: string, expectedCode: string): boolean {
  return submittedCode === expectedCode
}
