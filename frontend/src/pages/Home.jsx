import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import api from '../lib/api'
import { useClips } from '../hooks/useClips'
import { useTags } from '../hooks/useTags'
import Book from '../components/book/Book'
import TagFilter from '../components/TagFilter'
import UploadModal from '../components/upload/UploadModal'
import ClipDetailModal from '../components/clip/ClipDetailModal'
import UserMenu from '../components/user/UserMenu'
import FriendsPage from './FriendsPage'
import './Home.css'

export default function Home() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('mybook')
  const [selectedTag, setSelectedTag] = useState(null)
  const [showUpload, setShowUpload] = useState(false)
  const [selectedClip, setSelectedClip] = useState(null)
  const navigate = useNavigate()

  const { clips, loading: clipsLoading, refetch } = useClips(selectedTag)
  const { tags, refetch: refetchTags } = useTags()

  const handleTagRenamed = (oldName, newName) => {
    refetchTags()
    refetch()
    if (selectedTag === oldName) setSelectedTag(newName)
  }

  const handleTagDeleted = (name) => {
    refetchTags()
    refetch()
    if (selectedTag === name) setSelectedTag(null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/login')
      } else {
        setUser(session.user)
      }
    })
  }, [navigate])

  // ログイン時に profiles テーブルへプロフィールを同期（ユーザー検索に使用）
  useEffect(() => {
    if (!user) return
    const displayName = user.user_metadata?.display_name || user.user_metadata?.full_name
    const avatarUrl = user.user_metadata?.avatar_url
    if (displayName) {
      api.patch('/users/me', { display_name: displayName, avatar_url: avatarUrl }).catch(() => {})
    }
  }, [user])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const refreshUser = async () => {
    const { data: { user: updated } } = await supabase.auth.getUser()
    setUser(updated)
  }

  if (!user) return null

  return (
    <div className="home">
      <header className="home-header">
        <div className="home-header-left">
          <h1 className="home-title">Scrappa</h1>
          <nav className="home-nav">
            <button
              className={`home-nav-btn ${activeTab === 'mybook' ? 'active' : ''}`}
              onClick={() => setActiveTab('mybook')}
            >
              マイブック
            </button>
            <button
              className={`home-nav-btn ${activeTab === 'friends' ? 'active' : ''}`}
              onClick={() => setActiveTab('friends')}
            >
              フレンド
            </button>
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {activeTab === 'mybook' && (
            <button className="upload-btn" onClick={() => setShowUpload(true)}>+ アップロード</button>
          )}
          <UserMenu user={user} onLogout={handleLogout} onUserUpdated={refreshUser} />
        </div>
      </header>

      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onUploaded={refetch} />
      )}

      {selectedClip && (
        <ClipDetailModal
          clip={selectedClip}
          onClose={() => setSelectedClip(null)}
          onUpdated={refetch}
          onDeleted={() => { setSelectedClip(null); refetch() }}
        />
      )}

      {activeTab === 'mybook' ? (
        <>
          <TagFilter
            tags={tags}
            selectedTag={selectedTag}
            onSelect={setSelectedTag}
            onTagRenamed={handleTagRenamed}
            onTagDeleted={handleTagDeleted}
          />
          <main className="home-main">
            {clipsLoading ? (
              <p className="loading-text">読み込み中...</p>
            ) : (
              <Book clips={clips} onClipClick={setSelectedClip} onEmptyClick={() => setShowUpload(true)} />
            )}
          </main>
        </>
      ) : (
        <FriendsPage />
      )}
    </div>
  )
}
