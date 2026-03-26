import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useClips } from '../hooks/useClips'
import { useTags } from '../hooks/useTags'
import Book from '../components/book/Book'
import TagFilter from '../components/TagFilter'
import './Home.css'

export default function Home() {
  const [user, setUser] = useState(null)
  const [selectedTag, setSelectedTag] = useState(null)
  const navigate = useNavigate()

  const { clips, loading: clipsLoading } = useClips(selectedTag)
  const { tags } = useTags()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/login')
      } else {
        setUser(session.user)
      }
    })
  }, [navigate])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (!user) return null

  return (
    <div className="home">
      <header className="home-header">
        <h1 className="home-title">Scrappa</h1>
        <button className="logout-btn" onClick={handleLogout}>ログアウト</button>
      </header>

      <TagFilter
        tags={tags}
        selectedTag={selectedTag}
        onSelect={setSelectedTag}
      />

      <main className="home-main">
        {clipsLoading ? (
          <p className="loading-text">読み込み中...</p>
        ) : (
          <Book clips={clips} />
        )}
      </main>
    </div>
  )
}
