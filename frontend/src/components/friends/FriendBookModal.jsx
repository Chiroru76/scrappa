import { useState, useEffect, useCallback } from 'react'
import api from '../../lib/api'
import Book from '../book/Book'
import FriendClipDetailModal from './FriendClipDetailModal'
import './FriendBookModal.css'

export default function FriendBookModal({ friend, onClose }) {
  const [clips, setClips] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTag, setSelectedTag] = useState(null)
  const [selectedClip, setSelectedClip] = useState(null)

  useEffect(() => {
    api.get(`/friends/${friend.id}/clips`)
      .then(res => setClips(res.data.clips))
      .finally(() => setLoading(false))
  }, [friend.id])

  const toggleLike = useCallback(async (clip) => {
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
  }, [])

  const getLikeData = useCallback((clip) => ({
    liked: clip.liked,
    like_count: clip.like_count,
    onToggle: toggleLike,
  }), [toggleLike])

  // クリップから重複なくタグ一覧を生成
  const friendTags = [...new Set(clips.flatMap(c => c.tags))]

  // 選択タグでフィルタリング
  const filteredClips = selectedTag
    ? clips.filter(c => c.tags.includes(selectedTag))
    : clips

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

        {friendTags.length > 0 && (
          <div className="friend-tag-filter">
            <button
              className={`friend-tag-btn ${selectedTag === null ? 'active' : ''}`}
              onClick={() => setSelectedTag(null)}
            >
              すべて
            </button>
            {friendTags.map(tag => (
              <button
                key={tag}
                className={`friend-tag-btn ${selectedTag === tag ? 'active' : ''}`}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        <div className="friend-book-body">
          {loading ? (
            <p className="friend-book-loading">読み込み中...</p>
          ) : clips.length === 0 ? (
            <p className="friend-book-empty">クリップがありません</p>
          ) : (
            <Book
              key={selectedTag}
              clips={filteredClips}
              getLikeData={getLikeData}
              onClipClick={setSelectedClip}
            />
          )}
        </div>
      </div>

      {selectedClip && (
        <FriendClipDetailModal
          clip={selectedClip}
          onClose={() => setSelectedClip(null)}
        />
      )}
    </div>
  )
}
