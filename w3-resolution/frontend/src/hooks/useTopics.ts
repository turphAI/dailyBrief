import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import type { ResearchSession } from '../types'

interface UseTopicsReturn {
  topics: ResearchSession[]
  loading: boolean
  error: string | null
  createTopic: (topic: Omit<ResearchSession, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>
  deleteTopic: (topicId: string) => Promise<void>
  updateTopicMetadata: (topicId: string, updates: Partial<Pick<ResearchSession, 'topic' | 'description'>>) => Promise<void>
  refreshTopics: () => Promise<void>
}

export function useTopics(): UseTopicsReturn {
  const [topics, setTopics] = useState<ResearchSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load all topics from API
  const loadAllTopics = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await axios.get('/api/w3?action=sessions')

      // Response is an array of sessions
      const sessionsList = Array.isArray(response.data) ? response.data : []

      // Ensure arrays exist for all sessions (migration safety)
      const normalizedSessions = sessionsList.map((s: ResearchSession) => ({
        ...s,
        presentations: s.presentations || [],
        threads: s.threads || [],
        messages: s.messages || []
      }))

      // Sort by most recent first
      const sortedSessions = normalizedSessions.sort((a: ResearchSession, b: ResearchSession) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )

      setTopics(sortedSessions)

      // Cache all sessions in localStorage for offline viewing (read-only)
      sortedSessions.forEach(session => {
        localStorage.setItem(`deepResearch:session:${session.id}`, JSON.stringify(session))
      })

      setError(null)
    } catch (err) {
      console.error('[useTopics] Failed to load topics from database:', err)

      // Show cached data if available, but warn user
      const localTopics = loadTopicsFromLocalStorage()
      if (localTopics.length > 0) {
        setTopics(localTopics)
        setError('⚠️ Database unavailable - viewing cached topics (changes will not be saved)')
      } else {
        setTopics([])
        setError('⚠️ Database unavailable - cannot load topics')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Load topics from localStorage as fallback
  const loadTopicsFromLocalStorage = (): ResearchSession[] => {
    const sessions: ResearchSession[] = []

    // Scan all localStorage keys for session pattern
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('deepResearch:session:')) {
        try {
          const sessionData = localStorage.getItem(key)
          if (sessionData) {
            const session = JSON.parse(sessionData)
            sessions.push(session)
          }
        } catch (e) {
          console.error(`[useTopics] Failed to parse session from ${key}:`, e)
        }
      }
    }

    // Sort by most recent
    return sessions.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  }

  // Create new topic
  const createTopic = useCallback(async (
    topicData: Omit<ResearchSession, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    // Generate unique ID
    const newId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()
    const now = new Date().toISOString()

    const newSession: ResearchSession = {
      ...topicData,
      id: newId,
      createdAt: now,
      updatedAt: now,
      queries: topicData.queries || [],
      resources: topicData.resources || [],
      presentations: topicData.presentations || [],
      threads: topicData.threads || [],
      messages: topicData.messages || []
    }

    try {
      // Save to database first (source of truth)
      await axios.post('/api/w3?action=session', newSession)

      // Only cache in localStorage after successful database save
      localStorage.setItem(`deepResearch:session:${newId}`, JSON.stringify(newSession))

      // Update local state
      setTopics(prev => [newSession, ...prev])

      return newId
    } catch (err) {
      console.error('[useTopics] Failed to create topic in database:', err)
      throw new Error('Failed to create topic - database unavailable')
    }
  }, [])

  // Delete topic
  const deleteTopic = useCallback(async (topicId: string) => {
    try {
      // Delete from database first (source of truth)
      await axios.delete(`/api/w3?action=session&sessionId=${topicId}`)

      // Only remove from cache after successful database deletion
      localStorage.removeItem(`deepResearch:session:${topicId}`)

      // Update local state
      setTopics(prev => prev.filter(t => t.id !== topicId))
    } catch (err) {
      console.error('[useTopics] Failed to delete topic from database:', err)
      throw new Error('Failed to delete topic - database unavailable')
    }
  }, [])

  // Update topic metadata (title, description)
  const updateTopicMetadata = useCallback(async (
    topicId: string,
    updates: Partial<Pick<ResearchSession, 'topic' | 'description'>>
  ) => {
    try {
      // Find existing topic
      const existingTopic = topics.find(t => t.id === topicId)
      if (!existingTopic) {
        throw new Error('Topic not found')
      }

      // Create updated session
      const updatedSession: ResearchSession = {
        ...existingTopic,
        ...updates,
        updatedAt: new Date().toISOString()
      }

      // Save to database first (source of truth)
      await axios.post('/api/w3?action=session', updatedSession)

      // Only cache after successful database save
      localStorage.setItem(`deepResearch:session:${topicId}`, JSON.stringify(updatedSession))

      // Update local state
      setTopics(prev =>
        prev.map(t => (t.id === topicId ? updatedSession : t))
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      )
    } catch (err) {
      console.error('[useTopics] Failed to update topic metadata in database:', err)
      throw new Error('Failed to update topic - database unavailable')
    }
  }, [topics])

  // Load topics on mount
  useEffect(() => {
    loadAllTopics()
  }, [loadAllTopics])

  return {
    topics,
    loading,
    error,
    createTopic,
    deleteTopic,
    updateTopicMetadata,
    refreshTopics: loadAllTopics
  }
}
