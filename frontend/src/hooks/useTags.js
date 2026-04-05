import { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'
import * as guestStorage from '../lib/guestStorage'

export function useTags(isGuest = false) {
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [revision, setRevision] = useState(0)

  const refetch = useCallback(() => setRevision((r) => r + 1), [])

  useEffect(() => {
    async function fetchTags() {
      try {
        setLoading(true)
        if (isGuest) {
          setTags(guestStorage.getTags())
        } else {
          const response = await api.get('/tags/')
          setTags(response.data.tags)
        }
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }
    fetchTags()
  }, [revision, isGuest])

  return { tags, loading, error, refetch }
}
