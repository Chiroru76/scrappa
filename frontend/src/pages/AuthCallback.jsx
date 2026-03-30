import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import LoadingScreen from '../components/LoadingScreen'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/home')
      }
    })
  }, [navigate])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <LoadingScreen />
    </div>
  )
}
