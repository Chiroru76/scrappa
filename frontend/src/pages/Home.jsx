import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import headerLogo from '../assets/headerLogo_clear.png'
import { supabase } from '../lib/supabase'
import api from '../lib/api'
import { isGuestMode, exitGuestMode } from '../lib/guestStorage'
import * as guestStorage from '../lib/guestStorage'
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
import GuestBanner from '../components/GuestBanner'
import './Home.css'

export default function Home() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('mybook')
  const [selectedTag, setSelectedTag] = useState(null)
  const [showUpload, setShowUpload] = useState(false)
  const [selectedClip, setSelectedClip] = useState(null)
  const [coverTitle, setCoverTitle] = useState(null)
  const [coverFont, setCoverFont] = useState('')
  const [ready, setReady] = useState(false)
  const navigate = useNavigate()

  const isGuest = isGuestMode()

  const { clips, setClips, loading: clipsLoading, refetch } = useClips(selectedTag, isGuest)
  const { tags, refetch: refetchTags } = useTags(isGuest)
  const { notifications, unreadCount, markAllRead } = useNotifications(isGuest)

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
    if (isGuest) {
      setUser({ guest: true })
      setReady(true)
      return
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/')
      } else {
        setUser(session.user)
        setReady(true)
      }
    })
  }, [navigate, isGuest])

  // ログイン時に profiles テーブルへプロフィールを同期（ユーザー検索に使用）
  useEffect(() => {
    if (!user || isGuest) return
    const displayName = user.user_metadata?.display_name || user.user_metadata?.full_name
    const avatarUrl = user.user_metadata?.avatar_url
    if (displayName) {
      api.patch('/users/me', { display_name: displayName, avatar_url: avatarUrl }).catch(() => {})
    }
  }, [user, isGuest])

  // 表紙カスタマイズ設定を取得
  useEffect(() => {
    if (!user || isGuest) return
    api.get('/users/me').then(({ data }) => {
      if (data?.cover_title) setCoverTitle(data.cover_title)
      if (data?.cover_font) setCoverFont(data.cover_font)
    }).catch(() => {})
  }, [user, isGuest])

  const handleCoverTitleChange = async (title) => {
    setCoverTitle(title)
    if (!isGuest) {
      await api.patch('/users/me', { cover_title: title }).catch(() => {})
    }
  }

  const handleCoverFontChange = async (font) => {
    setCoverFont(font)
    if (!isGuest) {
      await api.patch('/users/me', { cover_font: font }).catch(() => {})
    }
  }

  const handleClipsReorder = async (reordered) => {
    setClips(reordered)
    if (isGuest) {
      guestStorage.reorderClips(reordered)
    } else {
      const updates = reordered.map(c => ({ id: c.id, page: c.page, position: c.position }))
      await api.post('/clips/reorder', updates).catch(() => {})
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const handleExitGuest = () => {
    exitGuestMode()
    navigate('/')
  }

  const refreshUser = async () => {
    const { data: { user: updated } } = await supabase.auth.getUser()
    setUser(updated)
  }

  if (!ready) return null

  const displayName = isGuest
    ? 'ゲスト'
    : (user.user_metadata?.display_name || user.user_metadata?.full_name || user.email)

  return (
    <div className="home">
      <header className="home-header">
        <div className="home-header-left">
          <img
            src={headerLogo}
            alt="Scrappa"
            className="home-logo"
            onClick={() => window.location.reload()}
          />
          <nav className="home-nav">
            <button
              className={`home-nav-btn ${activeTab === 'mybook' ? 'active' : ''}`}
              onClick={() => setActiveTab('mybook')}
            >
              マイブック
            </button>
            {!isGuest && (
              <button
                className={`home-nav-btn ${activeTab === 'friends' ? 'active' : ''}`}
                onClick={() => setActiveTab('friends')}
              >
                フレンド
              </button>
            )}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isGuest ? (
            <button
              onClick={handleExitGuest}
              style={{
                padding: '6px 14px',
                background: 'transparent',
                border: '1px solid rgba(74,55,40,0.4)',
                borderRadius: '6px',
                fontSize: '0.82rem',
                color: '#6b5344',
                cursor: 'pointer',
              }}
            >
              終了する
            </button>
          ) : (
            <>
              <NotificationMenu
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAllRead={markAllRead}
              />
              <UserMenu user={user} onLogout={handleLogout} onUserUpdated={refreshUser} />
            </>
          )}
        </div>
      </header>

      {isGuest && <GuestBanner />}

      {showUpload && (
        <UploadModal isGuest={isGuest} onClose={() => setShowUpload(false)} onUploaded={refetch} />
      )}

      {selectedClip && (
        <ClipDetailModal
          clip={selectedClip}
          isGuest={isGuest}
          onClose={() => setSelectedClip(null)}
          onUpdated={refetch}
          onDeleted={() => { setSelectedClip(null); refetch() }}
        />
      )}

      {activeTab === 'cover' ? (
        <main className="home-main">
          <BookCover
            userName={displayName}
            onOpen={() => setActiveTab('mybook')}
            coverTitle={coverTitle}
            coverFont={coverFont}
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
            isGuest={isGuest}
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
