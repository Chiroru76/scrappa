import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTags } from '../../hooks/useTags'
import api from '../../lib/api'
import './UploadModal.css'

export default function UploadModal({ onClose, onUploaded }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedTags, setSelectedTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const { tags: existingTags } = useTags()

  // Escapeキーで閉じる
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const applyFile = (selected) => {
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
  }

  const handleFileSelect = (e) => {
    const selected = e.target.files[0]
    if (selected) applyFile(selected)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && dropped.type.startsWith('image/')) {
      applyFile(dropped)
    }
  }

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      const newTag = tagInput.trim()
      if (!selectedTags.includes(newTag)) {
        setSelectedTags([...selectedTags, newTag])
      }
      // datalistのonChangeが後から発火するためsetTimeoutでクリアを後回しにする
      setTimeout(() => setTagInput(''), 0)
    }
  }

  const removeTag = (tag) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag))
  }

  const handleSubmit = async () => {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('tags', JSON.stringify(selectedTags))
      await api.post('/clips/', formData)
      onUploaded()
      onClose()
    } catch (err) {
      setError('アップロードに失敗しました。再度お試しください。')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">画像をアップロード</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">

          {/* 非表示のファイル入力 */}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />

          {preview ? (
            /* プレビュー表示 */
            <div className="preview-area">
              <img src={preview} alt="プレビュー" className="preview-image" />
              <button
                className="change-file-btn"
                onClick={() => inputRef.current.click()}
              >
                画像を変更
              </button>
            </div>
          ) : (
            /* クリック＋ドラッグ&ドロップでファイル選択 */
            <div
              className={`drop-zone ${isDragging ? 'dragging' : ''}`}
              onClick={() => inputRef.current.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <p className="drop-zone-text">
                クリックまたはドラッグ&ドロップ
              </p>
              <p className="drop-zone-hint">JPEG / PNG / WebP・10MB以下</p>
            </div>
          )}

          {/* タグ選択 */}
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
                list="tag-suggestions"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="タグを入力してEnter"
              />
              <datalist id="tag-suggestions">
                {existingTags
                  .filter((t) => !selectedTags.includes(t.name))
                  .map((t) => (
                    <option key={t.id} value={t.name} />
                  ))}
              </datalist>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          {error && <p className="upload-error">{error}</p>}
          <button className="cancel-btn" onClick={onClose} disabled={uploading}>キャンセル</button>
          <button className="submit-btn" disabled={!file || uploading} onClick={handleSubmit}>
            {uploading ? 'アップロード中...' : 'アップロード'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
