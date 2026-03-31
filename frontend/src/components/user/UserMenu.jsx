import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import UserProfileModal from './UserProfileModal'
import './UserMenu.css'

export default function UserMenu({ user, onLogout, onUserUpdated }) {
  const [open, setOpen] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const navigate = useNavigate()

  const displayName = user.user_metadata?.display_name
    || user.user_metadata?.full_name
    || user.email
  const avatarUrl = user.user_metadata?.avatar_url

  return (
    <div className="user-menu">
      <button className="user-avatar-btn" onClick={() => setOpen(!open)}>
        {avatarUrl
          ? <img src={avatarUrl} alt="avatar" className="user-avatar" />
          : <span className="user-avatar-initials">{displayName?.[0]?.toUpperCase()}</span>
        }
      </button>

      {open && (
        <>
          <div className="user-menu-overlay" onClick={() => setOpen(false)} />
          <div className="user-menu-dropdown">
            <div className="user-menu-info">
              <p className="user-menu-name">{displayName}</p>
              <p className="user-menu-email">{user.email}</p>
            </div>
            <hr className="user-menu-divider" />
            <button
              className="user-menu-item"
              onClick={() => { setShowProfile(true); setOpen(false) }}
            >
              プロフィールを編集
            </button>
            <hr className="user-menu-divider" />
            <button
              className="user-menu-item"
              onClick={() => { navigate('/terms'); setOpen(false) }}
            >
              利用規約
            </button>
            <button
              className="user-menu-item"
              onClick={() => { navigate('/privacy'); setOpen(false) }}
            >
              プライバシーポリシー
            </button>
            <button
              className="user-menu-item"
              onClick={() => { navigate('/contact'); setOpen(false) }}
            >
              お問い合わせ
            </button>
            <hr className="user-menu-divider" />
            <button className="user-menu-item user-menu-item--logout" onClick={onLogout}>
              ログアウト
            </button>
          </div>
        </>
      )}

      {showProfile && (
        <UserProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onUpdated={onUserUpdated}
        />
      )}
    </div>
  )
}
