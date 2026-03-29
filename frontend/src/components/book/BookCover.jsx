import { useState, useEffect } from 'react'
import { RingBinding } from './Book'
import './Book.css'
import './BookCover.css'

const COVER_COLORS = [
  { label: 'クラフト',     value: '#c8a882' },
  { label: 'ベージュ',     value: '#e8dcc8' },
  { label: 'オリーブ',     value: '#8b9d77' },
  { label: 'テラコッタ',   value: '#c47a5a' },
  { label: 'ネイビー',     value: '#3d5a80' },
  { label: 'バーガンディ', value: '#7b2d42' },
  { label: 'チャコール',   value: '#4a4a4a' },
  { label: 'アイボリー',   value: '#f5f0e8' },
]

export default function BookCover({ userName, onOpen, coverColor, coverTitle, onColorChange, onTitleChange }) {
  const defaultTitle = `${userName}のスクラップブック`
  const displayTitle = coverTitle || defaultTitle

  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState(displayTitle)
  const [showColorPicker, setShowColorPicker] = useState(false)

  useEffect(() => {
    setEditTitle(coverTitle || defaultTitle)
  }, [coverTitle, userName])

  function handleTitleSave() {
    setIsEditingTitle(false)
    const trimmed = editTitle.trim()
    if (trimmed && trimmed !== displayTitle) {
      onTitleChange(trimmed)
    } else {
      setEditTitle(displayTitle)
    }
  }

  return (
    <div className="cover-container">
      <div className="cover-spread">
        <RingBinding />
        <div className="cover-page" style={{ background: coverColor || '#c8a882' }}>
          {isEditingTitle ? (
            <input
              className="cover-title-input"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={e => { if (e.key === 'Enter') handleTitleSave() }}
              autoFocus
            />
          ) : (
            <p
              className="cover-title"
              onDoubleClick={() => setIsEditingTitle(true)}
              title="ダブルクリックで編集"
            >
              {displayTitle}
            </p>
          )}
          <button className="cover-open-btn" onClick={onOpen}>開く</button>
        </div>
      </div>

      <div className="cover-actions">
        <button
          className="cover-color-btn"
          onClick={() => setShowColorPicker(v => !v)}
        >
          表紙のカラーを選択
        </button>
        {showColorPicker && (
          <div className="color-picker">
            {COVER_COLORS.map(({ label, value }) => (
              <button
                key={value}
                className={`color-swatch ${(coverColor || '#c8a882') === value ? 'selected' : ''}`}
                style={{ background: value }}
                title={label}
                onClick={() => {
                  onColorChange(value)
                  setShowColorPicker(false)
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
