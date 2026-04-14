import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTags } from '../../hooks/useTags'
import api from '../../lib/api'
import * as guestStorage from '../../lib/guestStorage'
import { generateShareImage } from '../../lib/generateShareImage'
import './ClipDetailModal.css'

export default function ClipDetailModal({ clip, isGuest = false, onClose, onUpdated, onDeleted }) {
  const [selectedTags, setSelectedTags] = useState(clip.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [memo, setMemo] = useState(clip.memo ?? '')
  const [isPublic, setIsPublic] = useState(clip.is_public ?? true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [error, setError] = useState(null)

  const { tags: existingTags } = useTags(isGuest)

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
      if (isGuest) {
        guestStorage.updateClip(clip.id, { tags: selectedTags, memo: memo || null, is_public: isPublic })
      } else {
        await api.patch(`/clips/${clip.id}/`, { tags: selectedTags, memo: memo || null, is_public: isPublic })
      }
      onUpdated()
      onClose()
    } catch (err) {
      setError('保存に失敗しました。再度お試しください。')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleShare = async () => {
    setSharing(true)
    try {
      const blob = await generateShareImage(clip)
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)
    } catch (err) {
      console.error(err)
    } finally {
      setSharing(false)
    }
  }

  const handlePreviewClose = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
  }

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = previewUrl
    a.download = `scrappa-${clip.id}.png`
    a.click()
  }

  const handleDelete = async () => {
    if (!window.confirm('このクリップを削除しますか？')) return
    setDeleting(true)
    try {
      if (isGuest) {
        guestStorage.deleteClip(clip.id)
      } else {
        await api.delete(`/clips/${clip.id}/`)
      }
      onDeleted()
    } catch (err) {
      setError('削除に失敗しました。再度お試しください。')
      console.error(err)
      setDeleting(false)
    }
  }

  if (previewUrl) {
    return createPortal(
      <div className="modal-overlay" onClick={handlePreviewClose}>
        <div className="share-preview-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">プレビュー</h2>
            <button className="modal-close" onClick={handlePreviewClose}>×</button>
          </div>
          <div className="share-preview-body">
            <img src={previewUrl} alt="共有画像プレビュー" className="share-preview-image" />
          </div>
          <div className="modal-footer">
            <button className="cancel-btn" onClick={handlePreviewClose}>戻る</button>
            <button className="submit-btn" onClick={handleDownload}>保存</button>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">クリップの詳細</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="detail-image-container">
            <img src={clip.image_url} alt="クリップ" className="detail-image" />
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
          </div>
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
          <div className="visibility-area">
            <label className="visibility-label">公開設定</label>
            <label className="toggle-label">
              <input
                type="checkbox"
                className="toggle-input"
                checked={isPublic}
                onChange={e => setIsPublic(e.target.checked)}
              />
              <span className="toggle-slider" />
              <span className="toggle-text">{isPublic ? '公開' : '非公開'}</span>
            </label>
          </div>
        </div>
        <div className="modal-footer detail-footer">
          <div className="detail-footer-left">
            <button className="delete-btn" onClick={handleDelete} disabled={deleting || saving || sharing}>
              {deleting ? '削除中...' : '削除'}
            </button>
            <button className="share-btn" onClick={handleShare} disabled={sharing || saving || deleting}>
              {sharing ? '生成中...' : '共有'}
            </button>
          </div>
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
