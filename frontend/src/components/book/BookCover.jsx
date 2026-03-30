import { useState, useEffect } from 'react'
import { RingBinding } from './Book'
import './Book.css'
import './BookCover.css'

const COVER_FONTS = [
  { label: 'ゴシック',   value: '' },
  { label: '明朝体',     value: 'Shippori Mincho' },
  { label: '丸ゴシック', value: 'M PLUS Rounded 1c' },
  { label: 'クレー体',   value: 'Klee One' },
  { label: '筆記体',     value: 'Yuji Syuku' },
]

export default function BookCover({ userName, onOpen, coverTitle, coverFont, onTitleChange, onFontChange, readOnly = false }) {
  const defaultTitle = `${userName}のスクラップブック`
  const displayTitle = coverTitle || defaultTitle

  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState(displayTitle)

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
        <div className="cover-page">
          {!readOnly && isEditingTitle ? (
            <input
              className="cover-title-input"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={e => { if (e.key === 'Enter') handleTitleSave() }}
              style={{ fontFamily: coverFont || 'inherit' }}
              autoFocus
            />
          ) : (
            <p
              className="cover-title"
              onDoubleClick={readOnly ? undefined : () => setIsEditingTitle(true)}
              title={readOnly ? undefined : 'ダブルクリックで編集'}
              style={{ fontFamily: coverFont || 'inherit' }}
            >
              {displayTitle}
            </p>
          )}
          <button className="cover-open-btn" onClick={onOpen}>open</button>
        </div>
      </div>

      {!readOnly && isEditingTitle && (
        <div className="cover-actions">
          <div className="font-picker">
            {COVER_FONTS.map(({ label, value }) => (
              <button
                key={label}
                className={`font-option ${(coverFont || '') === value ? 'selected' : ''}`}
                style={{ fontFamily: value || 'inherit' }}
                onClick={() => onFontChange(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
