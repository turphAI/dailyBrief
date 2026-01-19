import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import type { ResearchSession, ResearchQuery, Resource } from '../types'

/**
 * Hook to manage research session with Redis backend
 * Falls back to localStorage if API is unavailable
 */
export function useSession(sessionId: string, defaultSession: ResearchSession) {
  const [session, setSession] = useState<ResearchSession>(defaultSession)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load session from API on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await axios.get(`/api/sessions?sessionId=${sessionId}`)
        setSession(response.data)
        setError(null)
      } catch (err) {
        console.error('Failed to load session from API:', err)
        // Try to load from localStorage as fallback
        const stored = localStorage.getItem(`deepResearch:session`)
        if (stored) {
          try {
            const localSession = JSON.parse(stored)
            // Ensure presentations array exists (migration)
            localSession.presentations = localSession.presentations || []
            setSession(localSession)
          } catch (e) {
            console.error('Failed to parse localStorage session:', e)
            setSession(defaultSession)
          }
        } else {
          setSession(defaultSession)
        }
        setError('Using local storage (API unavailable)')
      } finally {
        setLoading(false)
      }
    }

    loadSession()
  }, [sessionId])

  // Save session to both API and localStorage
  const saveSession = useCallback(async (updatedSession: ResearchSession) => {
    setSession(updatedSession)

    // Save to localStorage immediately
    localStorage.setItem('deepResearch:session', JSON.stringify(updatedSession))

    // Save to API in background
    try {
      await axios.post('/api/sessions', updatedSession)
      setError(null)
    } catch (err) {
      console.error('Failed to save session to API:', err)
      setError('Saved locally only (API unavailable)')
    }
  }, [])

  // Update session (partial update)
  const updateSession = useCallback((updates: Partial<ResearchSession>) => {
    const updatedSession = {
      ...session,
      ...updates,
      updatedAt: new Date().toISOString()
    }
    saveSession(updatedSession)
  }, [session, saveSession])

  // Add query to session
  const addQuery = useCallback(async (query: ResearchQuery) => {
    const updatedSession = {
      ...session,
      queries: [query, ...session.queries],
      updatedAt: new Date().toISOString()
    }
    await saveSession(updatedSession)
  }, [session, saveSession])

  // Add resource to session
  const addResource = useCallback(async (resource: Resource) => {
    const updatedSession = {
      ...session,
      resources: [...session.resources, resource],
      updatedAt: new Date().toISOString()
    }
    await saveSession(updatedSession)
  }, [session, saveSession])

  // Remove resource from session
  const removeResource = useCallback(async (resourceId: string) => {
    const updatedSession = {
      ...session,
      resources: session.resources.filter(r => r.id !== resourceId),
      updatedAt: new Date().toISOString()
    }
    await saveSession(updatedSession)
  }, [session, saveSession])

  // Update resource in session
  const updateResource = useCallback(async (resourceId: string, updates: Partial<Resource>) => {
    const updatedSession = {
      ...session,
      resources: session.resources.map(r =>
        r.id === resourceId ? { ...r, ...updates } : r
      ),
      updatedAt: new Date().toISOString()
    }
    await saveSession(updatedSession)
  }, [session, saveSession])

  return {
    session,
    loading,
    error,
    updateSession,
    addQuery,
    addResource,
    removeResource,
    updateResource
  }
}
