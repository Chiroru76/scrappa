import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import '../clip/ClipDetailModal.css'

export default function FriendClipDetailModal({ clip, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">クリップ</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <img src={clip.image_url} alt="クリップ" className="detail-image" />
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
