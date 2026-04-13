import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import '../clip/ClipDetailModal.css'

export default function FriendClipDetailModal({ clip, onClose, onToggleLike }) {
  const [liked, setLiked] = useState(clip.liked)
  const [likeCount, setLikeCount] = useState(clip.like_count)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleLike = async () => {
    const newLiked = !liked
    setLiked(newLiked)
    setLikeCount(c => c + (newLiked ? 1 : -1))
    await onToggleLike(clip)
  }

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ justifyContent: 'flex-end' }}>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="detail-image-wrap">
            <img src={clip.image_url} alt="クリップ" className="detail-image" />
            <button
              className={`detail-like-btn ${liked ? 'liked' : ''}`}
              onClick={e => { e.stopPropagation(); handleLike() }}
            >
              <span className="detail-like-heart">♥</span> {likeCount}
            </button>
          </div>
          {clip.created_at && (
            <span className="detail-created-at">
              {(() => {
                const d = new Date(clip.created_at)
                const y = d.getFullYear()
                const m = String(d.getMonth() + 1).padStart(2, '0')
                const day = String(d.getDate()).padStart(2, '0')
                return `${y}.${m}.${day}`
              })()}
            </span>
          )}
          {clip.memo && (
            <p className="clip-memo-readonly">{clip.memo}</p>
          )}
          {clip.tags?.length > 0 && (
            <div className="tag-input-area">
              <span className="tag-label">タグ</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {clip.tags.map((tag) => (
                  <span key={tag} className="tag-chip">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
