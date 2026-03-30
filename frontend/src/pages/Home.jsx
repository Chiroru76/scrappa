import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import headerLogo from '../assets/headerlogo.png'
import { supabase } from '../lib/supabase'
import api from '../lib/api'
import { useClips } from '../hooks/useClips'
import { useTags } from '../hooks/useTags'
import { useNotifications } from '../hooks/useNotifications'
import Book from '../components/book/Book'
import LoadingScreen from '../components/LoadingScreen'
import BookCover from '../components/book/BookCover'
import TagFilter from '../components/TagFilter'
import UploadModal from '../components/upload/UploadModal'
import ClipDetailModal from '../components/clip/ClipDetailModal'
import UserMenu from '../components/user/UserMenu'
import NotificationMenu from '../components/notification/NotificationMenu'
import FriendsPage from './FriendsPage'
import './Home.css'

export default function Home() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('mybook')
  const [selectedTag, setSelectedTag] = useState(null)
  const [showUpload, setShowUpload] = useState(false)
  const [selectedClip, setSelectedClip] = useState(null)
  const [coverColor, setCoverColor] = useState('#c8a882')
  const [coverTitle, setCoverTitle] = useState(null)
  const [coverFont, setCoverFont] = useState('')
  const navigate = useNavigate()

  const { clips, setClips, loading: clipsLoading, refetch } = useClips(selectedTag)
  const { tags, refetch: refetchTags } = useTags()
  const { notifications, unreadCount, markAllRead } = useNotifications()

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
        navigate('/')
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

  // 表紙カスタマイズ設定を取得
  useEffect(() => {
    if (!user) return
    api.get('/users/me').then(({ data }) => {
      if (data?.cover_color) setCoverColor(data.cover_color)
      if (data?.cover_title) setCoverTitle(data.cover_title)
      if (data?.cover_font) setCoverFont(data.cover_font)
    }).catch(() => {})
  }, [user])

  const handleCoverColorChange = async (color) => {
    setCoverColor(color)
    await api.patch('/users/me', { cover_color: color }).catch(() => {})
  }

  const handleCoverTitleChange = async (title) => {
    setCoverTitle(title)
    await api.patch('/users/me', { cover_title: title }).catch(() => {})
  }

  const handleCoverFontChange = async (font) => {
    setCoverFont(font)
    await api.patch('/users/me', { cover_font: font }).catch(() => {})
  }

  const handleClipsReorder = async (reordered) => {
    // 楽観的更新
    setClips(reordered)
    // バックグラウンドで保存（タグフィルター中は並び替え不可なので selectedTag がない場合のみ）
    const updates = reordered.map(c => ({ id: c.id, page: c.page, position: c.position }))
    await api.post('/clips/reorder', updates).catch(() => {})
  }

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
          <img
            src={headerLogo}
            alt="Scrappa"
            className="home-logo"
            onClick={() => setActiveTab('mybook')}
          />
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
          <NotificationMenu
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAllRead={markAllRead}
          />
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

      {activeTab === 'cover' ? (
        <main className="home-main">
          <BookCover
            userName={user.user_metadata?.display_name || user.user_metadata?.full_name || user.email}
            onOpen={() => setActiveTab('mybook')}
            coverColor={coverColor}
            coverTitle={coverTitle}
            coverFont={coverFont}
            onColorChange={handleCoverColorChange}
            onTitleChange={handleCoverTitleChange}
            onFontChange={handleCoverFontChange}
          />
        </main>
      ) : activeTab === 'mybook' ? (
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
              <LoadingScreen />
            ) : (
              <Book clips={clips} onClipClick={setSelectedClip} onEmptyClick={() => setShowUpload(true)} onShowCover={() => setActiveTab('cover')} onClipsReorder={handleClipsReorder} />
            )}
          </main>
        </>
      ) : (
        <FriendsPage />
      )}
    </div>
  )
}
