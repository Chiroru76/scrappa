import { useState, useEffect } from 'react'
import { RingBinding } from './Book'
import './Book.css'
import './BookCover.css'

const FONT_TABS = [
  {
    label: 'ゴシック',
    fonts: [
      { label: 'ゴシック',        value: '' },
      { label: 'Noto Sans',       value: 'Noto Sans JP' },
      { label: 'BIZ UD',          value: 'BIZ UDGothic' },
      { label: '丸ゴシック',      value: 'Zen Maru Gothic' },
    ],
  },
  {
    label: '明朝',
    fonts: [
      { label: '明朝体',          value: 'Shippori Mincho' },
      { label: 'Noto Serif',      value: 'Noto Serif JP' },
      { label: 'BIZ UD明朝',     value: 'BIZ UDMincho' },
    ],
  },
  {
    label: '手書き',
    fonts: [
      { label: 'クレー体',        value: 'Klee One' },
      { label: '筆記体',          value: 'Yuji Syuku' },
      { label: '紅葉',            value: 'Zen Kurenaido' },
    ],
  },
  {
    label: 'ポップ',
    fonts: [
      { label: '丸ゴシック',      value: 'M PLUS Rounded 1c' },
      { label: 'はちまるポップ',  value: 'Hachi Maru Pop' },
      { label: 'レゲエ',          value: 'Reggae One' },
    ],
  },
]

export default function BookCover({ userName, onOpen, coverTitle, coverFont, onTitleChange, onFontChange, readOnly = false }) {
  const defaultTitle = `${userName}のスクラップブック`
  const displayTitle = coverTitle || defaultTitle

  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState(displayTitle)
  const [activeTab, setActiveTab] = useState(() => {
    if (!coverFont) return 0
    const idx = FONT_TABS.findIndex(tab => tab.fonts.some(f => f.value === coverFont))
    return idx === -1 ? 0 : idx
  })

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
          <div className="font-tabs">
            {FONT_TABS.map((tab, i) => (
              <button
                key={tab.label}
                className={`font-tab ${activeTab === i ? 'active' : ''}`}
                onMouseDown={e => { e.preventDefault(); setActiveTab(i) }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="font-picker">
            {FONT_TABS[activeTab].fonts.map(({ label, value }) => (
              <button
                key={label}
                className={`font-option ${(coverFont || '') === value ? 'selected' : ''}`}
                style={{ fontFamily: value || 'inherit' }}
                onMouseDown={e => { e.preventDefault(); onFontChange(value) }}
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
