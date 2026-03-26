import { useState, useEffect } from 'react'
import api from '../lib/api'

export function useClips(tag = null) {
  const [clips, setClips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchClips() {
      try {
        setLoading(true)
        const params = tag ? { tag } : {}
        const response = await api.get('/clips', { params })
        setClips(response.data.clips)
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }
    fetchClips()
  }, [tag])

  return { clips, loading, error }
}
