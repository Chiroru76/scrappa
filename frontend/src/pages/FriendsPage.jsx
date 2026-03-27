import { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'
import FriendBookModal from '../components/friends/FriendBookModal'
import './FriendsPage.css'

function Avatar({ user, size = 40 }) {
  const name = user?.display_name || 'ユーザー'
  if (user?.avatar_url) {
    return <img src={user.avatar_url} alt="avatar" className="fp-avatar" style={{ width: size, height: size }} />
  }
  return (
    <span className="fp-avatar fp-avatar-initials" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {name[0]?.toUpperCase()}
    </span>
  )
}

export default function FriendsPage() {
  const [activeSection, setActiveSection] = useState('friends')
  const [viewingFriend, setViewingFriend] = useState(null)

  // 検索
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)

  // 受け取った申請
  const [requests, setRequests] = useState([])

  // フレンド一覧
  const [friends, setFriends] = useState([])

  const fetchRequests = useCallback(() => {
    api.get('/friends/requests').then(res => setRequests(res.data.requests))
  }, [])

  const fetchFriends = useCallback(() => {
    api.get('/friends').then(res => setFriends(res.data.friends))
  }, [])

  useEffect(() => {
    fetchRequests()
    fetchFriends()
  }, [fetchRequests, fetchFriends])

  // ユーザー検索
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    const timer = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await api.get('/users/search', { params: { q: searchQuery } })
        setSearchResults(res.data.users)
      } finally {
        setSearchLoading(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const sendRequest = async (toUserId) => {
    await api.post('/friends/requests', { to_user_id: toUserId })
    setSearchResults(prev => prev.map(u =>
      u.id === toUserId ? { ...u, relation: 'pending' } : u
    ))
  }

  const respondRequest = async (requestId, action) => {
    await api.patch(`/friends/requests/${requestId}`, { action })
    setRequests(prev => prev.filter(r => r.id !== requestId))
    if (action === 'accept') fetchFriends()
  }

  const removeFriend = async (friendId) => {
    if (!window.confirm('フレンドを解除しますか？')) return
    await api.delete(`/friends/${friendId}`)
    setFriends(prev => prev.filter(f => f.id !== friendId))
  }

  const relationLabel = (relation) => {
    if (relation === 'accepted') return <span className="fp-badge fp-badge--friend">フレンド</span>
    if (relation === 'pending') return <span className="fp-badge fp-badge--pending">申請済み</span>
    if (relation === 'pending_received') return <span className="fp-badge fp-badge--received">受信中</span>
    return null
  }

  const requestCount = requests.length

  return (
    <div className="friends-page">
      {/* セクションタブ */}
      <div className="fp-tabs">
        <button
          className={`fp-tab ${activeSection === 'search' ? 'active' : ''}`}
          onClick={() => setActiveSection('search')}
        >
          🔍 ユーザー検索
        </button>
        <button
          className={`fp-tab ${activeSection === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveSection('requests')}
        >
          📬 申請{requestCount > 0 && <span className="fp-badge-count">{requestCount}</span>}
        </button>
        <button
          className={`fp-tab ${activeSection === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveSection('friends')}
        >
          👥 フレンド ({friends.length})
        </button>
      </div>

      {/* セクション本体 */}
      <div className="fp-content">

        {/* ── 検索 ── */}
        {activeSection === 'search' && (
          <div className="fp-section">
            <input
              className="fp-search-input"
              type="text"
              placeholder="ユーザー名で検索..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchLoading && <p className="fp-hint">検索中...</p>}
            {!searchLoading && searchQuery && searchResults.length === 0 && (
              <p className="fp-hint">ユーザーが見つかりません</p>
            )}
            <div className="fp-user-list">
              {searchResults.map(user => (
                <div key={user.id} className="fp-user-row">
                  <Avatar user={user} />
                  <span className="fp-user-name">{user.display_name || 'ユーザー'}</span>
                  <div className="fp-user-actions">
                    {user.relation === 'none' && (
                      <button className="fp-btn fp-btn--primary" onClick={() => sendRequest(user.id)}>
                        申請する
                      </button>
                    )}
                    {relationLabel(user.relation)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 申請 ── */}
        {activeSection === 'requests' && (
          <div className="fp-section">
            {requests.length === 0 ? (
              <p className="fp-hint">受け取った申請はありません</p>
            ) : (
              <div className="fp-user-list">
                {requests.map(req => (
                  <div key={req.id} className="fp-user-row">
                    <Avatar user={req.from_user} />
                    <span className="fp-user-name">{req.from_user.display_name || 'ユーザー'}</span>
                    <div className="fp-user-actions">
                      <button
                        className="fp-btn fp-btn--primary"
                        onClick={() => respondRequest(req.id, 'accept')}
                      >
                        承認
                      </button>
                      <button
                        className="fp-btn fp-btn--ghost"
                        onClick={() => respondRequest(req.id, 'reject')}
                      >
                        拒否
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── フレンド一覧 ── */}
        {activeSection === 'friends' && (
          <div className="fp-section">
            {friends.length === 0 ? (
              <p className="fp-hint">フレンドはいません。ユーザー検索から申請しましょう！</p>
            ) : (
              <div className="fp-user-list">
                {friends.map(friend => (
                  <div
                    key={friend.id}
                    className="fp-user-row fp-user-row--clickable"
                    onClick={() => setViewingFriend(friend)}
                  >
                    <Avatar user={friend} />
                    <span className="fp-user-name">{friend.display_name || 'ユーザー'}</span>
                    <div className="fp-user-actions" onClick={e => e.stopPropagation()}>
                      <span className="fp-hint-sm">クリックでブックを見る</span>
                      <button
                        className="fp-btn fp-btn--ghost fp-btn--sm"
                        onClick={() => removeFriend(friend.id)}
                      >
                        解除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* フレンドのスクラップブックモーダル */}
      {viewingFriend && (
        <FriendBookModal
          friend={viewingFriend}
          onClose={() => setViewingFriend(null)}
        />
      )}
    </div>
  )
}
