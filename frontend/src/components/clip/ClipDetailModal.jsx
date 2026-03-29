import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTags } from '../../hooks/useTags'
import api from '../../lib/api'
import './ClipDetailModal.css'

export default function ClipDetailModal({ clip, onClose, onUpdated, onDeleted }) {
  const [selectedTags, setSelectedTags] = useState(clip.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [memo, setMemo] = useState(clip.memo ?? '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)

  const { tags: existingTags } = useTags()

  // Escapeキーで閉じる
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      const newTag = tagInput.trim()
      if (!selectedTags.includes(newTag)) {
        setSelectedTags([...selectedTags, newTag])
      }
      setTimeout(() => setTagInput(''), 0)
    }
  }

  const removeTag = (tag) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await api.patch(`/clips/${clip.id}/`, { tags: selectedTags, memo: memo || null })
      onUpdated()
      onClose()
    } catch (err) {
      setError('保存に失敗しました。再度お試しください。')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('このクリップを削除しますか？')) return
    setDeleting(true)
    try {
      await api.delete(`/clips/${clip.id}/`)
      onDeleted()
    } catch (err) {
      setError('削除に失敗しました。再度お試しください。')
      console.error(err)
      setDeleting(false)
    }
  }

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">クリップの詳細</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <img src={clip.image_url} alt="クリップ" className="detail-image" />
          {clip.likes_count > 0 && (
            <p className="clip-likes-count">❤️ {clip.likes_count}</p>
          )}

          <div className="tag-input-area">
            <label className="tag-label">タグ</label>
            <div className="tag-chips">
              {selectedTags.map((tag) => (
                <span key={tag} className="tag-chip">
                  {tag}
                  <button className="tag-chip-remove" onClick={() => removeTag(tag)}>×</button>
                </span>
              ))}
              <input
                className="tag-input"
                type="text"
                list="detail-tag-suggestions"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="タグを入力してEnter"
              />
              <datalist id="detail-tag-suggestions">
                {existingTags
                  .filter((t) => !selectedTags.includes(t.name))
                  .map((t) => (
                    <option key={t.id} value={t.name} />
                  ))}
              </datalist>
            </div>
          </div>
          <div className="memo-area">
            <label className="memo-label">メモ</label>
            <textarea
              className="memo-input"
              value={memo}
              onChange={e => setMemo(e.target.value)}
              rows={1}
              placeholder="メモを追加..."
            />
          </div>
        </div>
        <div className="modal-footer detail-footer">
          <button className="delete-btn" onClick={handleDelete} disabled={deleting || saving}>
            {deleting ? '削除中...' : '削除'}
          </button>
          <div className="detail-footer-right">
            {error && <p className="upload-error">{error}</p>}
            <button className="cancel-btn" onClick={onClose} disabled={saving || deleting}>
              キャンセル
            </button>
            <button className="submit-btn" onClick={handleSave} disabled={saving || deleting}>
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
