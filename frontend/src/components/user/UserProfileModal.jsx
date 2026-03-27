import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import api from '../../lib/api'
import './UserProfileModal.css'

export default function UserProfileModal({ user, onClose, onUpdated }) {
  const [name, setName] = useState(
    user.user_metadata?.display_name || user.user_metadata?.full_name || ''
  )
  const [avatarFile, setAvatarFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(user.user_metadata?.avatar_url || null)
  const [saving, setSaving] = useState(false)

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      let avatarUrl = user.user_metadata?.avatar_url

      if (avatarFile) {
        const formData = new FormData()
        formData.append('file', avatarFile)
        const res = await api.post('/users/me/avatar', formData)
        avatarUrl = res.data.avatar_url
      }

      const trimmedName = name.trim()
      await supabase.auth.updateUser({
        data: { display_name: trimmedName, avatar_url: avatarUrl }
      })

      // profiles テーブルに同期（ユーザー検索に使用）
      await api.patch('/users/me', { display_name: trimmedName, avatar_url: avatarUrl })

      await onUpdated()
      onClose()
    } catch {
      // エラー時は何もしない
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="profile-modal-title">プロフィールを編集</h2>

        <label className="avatar-upload-label">
          {previewUrl
            ? <img src={previewUrl} alt="avatar" className="avatar-preview" />
            : <span className="avatar-placeholder">{name?.[0]?.toUpperCase() || '?'}</span>
          }
          <div className="avatar-upload-hint">変更</div>
          <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
        </label>

        <div className="profile-field">
          <label className="profile-label">ユーザー名</label>
          <input
            className="profile-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="表示名を入力"
          />
        </div>

        <div className="profile-modal-actions">
          <button className="profile-btn-cancel" onClick={onClose}>キャンセル</button>
          <button className="profile-btn-save" onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
