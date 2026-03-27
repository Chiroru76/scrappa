import { useState, useEffect } from 'react'
import api from '../../lib/api'
import './FriendBookModal.css'

export default function FriendBookModal({ friend, onClose }) {
  const [clips, setClips] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/friends/${friend.id}/clips`)
      .then(res => setClips(res.data.clips))
      .finally(() => setLoading(false))
  }, [friend.id])

  const toggleLike = async (clip) => {
    if (clip.liked) {
      await api.delete(`/clips/${clip.id}/likes`)
    } else {
      await api.post(`/clips/${clip.id}/likes`)
    }
    setClips(prev => prev.map(c =>
      c.id === clip.id
        ? { ...c, liked: !c.liked, like_count: c.like_count + (c.liked ? -1 : 1) }
        : c
    ))
  }

  const displayName = friend.display_name || 'ユーザー'

  return (
    <div className="friend-book-overlay" onClick={onClose}>
      <div className="friend-book-modal" onClick={e => e.stopPropagation()}>
        <div className="friend-book-header">
          <div className="friend-book-identity">
            {friend.avatar_url
              ? <img src={friend.avatar_url} alt="avatar" className="friend-book-avatar" />
              : <span className="friend-book-initials">{displayName[0]?.toUpperCase()}</span>
            }
            <span className="friend-book-name">{displayName} のスクラップブック</span>
          </div>
          <button className="friend-book-close" onClick={onClose}>✕</button>
        </div>

        <div className="friend-book-body">
          {loading ? (
            <p className="friend-book-loading">読み込み中...</p>
          ) : clips.length === 0 ? (
            <p className="friend-book-empty">クリップがありません</p>
          ) : (
            <div className="friend-clips-grid">
              {clips.map(clip => (
                <div key={clip.id} className="friend-clip-card">
                  <img src={clip.image_url} alt="" className="friend-clip-img" />
                  <button
                    className={`friend-clip-like ${clip.liked ? 'liked' : ''}`}
                    onClick={() => toggleLike(clip)}
                  >
                    ♥ {clip.like_count}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
