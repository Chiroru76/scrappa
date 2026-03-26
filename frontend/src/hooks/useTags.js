import { useState, useEffect } from 'react'
import api from '../lib/api'

export function useTags() {
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchTags() {
      try {
        setLoading(true)
        const response = await api.get('/tags')
        setTags(response.data.tags)
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }
    fetchTags()
  }, [])

  return { tags, loading, error }
}
