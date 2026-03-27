import { useState } from 'react'
import api from '../lib/api'
import './TagFilter.css'

export default function TagFilter({ tags, selectedTag, onSelect, onTagRenamed, onTagDeleted }) {
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')

  const startEdit = (e, tag) => {
    e.stopPropagation()
    setEditingId(tag.id)
    setEditingName(tag.name)
  }

  const cancelEdit = () => setEditingId(null)

  const handleRenameConfirm = async (tag) => {
    const newName = editingName.trim()
    setEditingId(null)
    if (!newName || newName === tag.name) return
    try {
      await api.patch(`/tags/${tag.id}`, { name: newName })
      onTagRenamed(tag.name, newName)
    } catch {
      // エラー時は変更なし（refetch しないのでUIは元に戻る）
    }
  }

  const handleDelete = async (tag) => {
    if (!window.confirm(`タグ「${tag.name}」を削除しますか？\n（クリップからも削除されます）`)) return
    try {
      await api.delete(`/tags/${tag.id}`)
      onTagDeleted(tag.name)
    } catch {
      // エラー時は何もしない
    }
  }

  return (
    <div className="tag-filter">
      <button
        className={`tag-btn ${selectedTag === null ? 'active' : ''}`}
        onClick={() => onSelect(null)}
      >
        すべて
      </button>
      {tags.map((tag) =>
        editingId === tag.id ? (
          <div key={tag.id} className="tag-edit-row">
            <input
              className="tag-edit-input"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameConfirm(tag)
                if (e.key === 'Escape') cancelEdit()
              }}
              onBlur={() => handleRenameConfirm(tag)}
              autoFocus
            />
            <button className="tag-edit-delete" onClick={() => handleDelete(tag)}>×</button>
          </div>
        ) : (
          <div key={tag.id} className="tag-btn-wrapper">
            <button
              className={`tag-btn ${selectedTag === tag.name ? 'active' : ''}`}
              onClick={() => onSelect(selectedTag === tag.name ? null : tag.name)}
            >
              {tag.name}
              <span className="tag-count">{tag.clip_count}</span>
            </button>
            <button className="tag-edit-icon" onClick={(e) => startEdit(e, tag)}>✏</button>
          </div>
        )
      )}
    </div>
  )
}
