import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Cropper from 'react-easy-crop'
import { useTags } from '../../hooks/useTags'
import api from '../../lib/api'
import { getCroppedBlob } from '../../lib/cropImage'
import './UploadModal.css'

export default function UploadModal({ onClose, onUploaded }) {
  // フェーズ管理: 'select' → 'crop' → 'preview'
  const [phase, setPhase] = useState('select')
  const [imageSrc, setImageSrc] = useState(null)  // 元画像のblob URL（クロップUI用）
  const [file, setFile] = useState(null)           // クロップ済みファイル（送信用）
  const [preview, setPreview] = useState(null)     // クロップ済みプレビューURL
  const [isDragging, setIsDragging] = useState(false)

  // react-easy-crop の状態
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

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

  // ファイル選択後 → クロップフェーズへ
  const applyFile = (selected) => {
    setImageSrc(URL.createObjectURL(selected))
    setPhase('crop')
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
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

  // クロップ完了時に座標を保存
  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels)
  }, [])

  // 「確定」ボタン → Canvas APIでクロップ済みblobを生成してプレビューへ
  const handleCropConfirm = async () => {
    const blob = await getCroppedBlob(imageSrc, croppedAreaPixels, rotation)
    const croppedFile = new File([blob], 'cropped.jpg', { type: 'image/jpeg' })
    setFile(croppedFile)
    setPreview(URL.createObjectURL(blob))
    setPhase('preview')
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

          {/* フェーズ1: ファイル選択 */}
          {phase === 'select' && (
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

          {/* フェーズ2: クロップUI */}
          {phase === 'crop' && (
            <div>
              <div className="crop-container">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                  onCropComplete={onCropComplete}
                />
              </div>
              <div className="crop-controls">
                <div className="crop-control-row">
                  <span className="crop-control-label">拡大</span>
                  <input
                    className="zoom-slider"
                    type="range"
                    min={1}
                    max={10}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                  />
                </div>
                <div className="crop-control-row">
                  <span className="crop-control-label">傾き</span>
                  <input
                    className="zoom-slider"
                    type="range"
                    min={-45}
                    max={45}
                    step={1}
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                  />
                  <span className="crop-control-value">{rotation}°</span>
                </div>
                <button className="crop-confirm-btn" onClick={handleCropConfirm}>
                  確定
                </button>
              </div>
            </div>
          )}

          {/* フェーズ3: プレビュー */}
          {phase === 'preview' && (
            <div className="preview-area">
              <img src={preview} alt="プレビュー" className="preview-image" />
              <button
                className="change-file-btn"
                onClick={() => setPhase('select')}
              >
                画像を変更
              </button>
            </div>
          )}

          {/* タグ選択（フェーズ3のみ表示） */}
          {phase === 'preview' && (
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
          )}
        </div>
        <div className="modal-footer">
          {error && <p className="upload-error">{error}</p>}
          <button className="cancel-btn" onClick={onClose} disabled={uploading}>キャンセル</button>
          <button
            className="submit-btn"
            disabled={phase !== 'preview' || uploading}
            onClick={handleSubmit}
          >
            {uploading ? 'アップロード中...' : 'アップロード'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
