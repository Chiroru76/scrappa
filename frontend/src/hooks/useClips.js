import { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'
import * as guestStorage from '../lib/guestStorage'

export function useClips(tag = null, isGuest = false) {
  const [clips, setClips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [revision, setRevision] = useState(0)

  const refetch = useCallback(() => setRevision((r) => r + 1), [])

  useEffect(() => {
    async function fetchClips() {
      try {
        setLoading(true)
        if (isGuest) {
          setClips(guestStorage.getClips(tag))
        } else {
          const params = tag ? { tag } : {}
          const response = await api.get('/clips/', { params })
          setClips(response.data.clips)
        }
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }
    fetchClips()
  }, [tag, revision, isGuest])

  return { clips, setClips, loading, error, refetch }
}
