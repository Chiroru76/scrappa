import { useState } from 'react'
import './NotificationMenu.css'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'たった今'
  if (min < 60) return `${min}分前`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour}時間前`
  return `${Math.floor(hour / 24)}日前`
}

export default function NotificationMenu({ notifications, unreadCount, onMarkAllRead }) {
  const [open, setOpen] = useState(false)

  const handleOpen = () => {
    setOpen(true)
    if (unreadCount > 0) onMarkAllRead()
  }

  const handleToggle = () => {
    if (open) {
      setOpen(false)
    } else {
      handleOpen()
    }
  }

  return (
    <div className="notif-menu">
      <button className="notif-btn" onClick={handleToggle}>
        🔔
        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </button>

      {open && (
        <>
          <div className="notif-overlay" onClick={() => setOpen(false)} />
          <div className="notif-dropdown">
            <div className="notif-header">通知</div>
            {notifications.length === 0 ? (
              <p className="notif-empty">通知はありません</p>
            ) : (
              <ul className="notif-list">
                {notifications.map(n => (
                  <li key={n.id} className={`notif-item ${n.is_read ? '' : 'unread'}`}>
                    <span className="notif-icon">
                      {n.type === 'like' ? '❤️' : '👥'}
                    </span>
                    <div className="notif-body">
                      <span className="notif-text">
                        <strong>{n.from_user?.display_name || 'ユーザー'}</strong>
                        {n.type === 'like'
                          ? ' があなたのクリップにいいねしました'
                          : ' からフレンド申請が届きました'}
                      </span>
                      <span className="notif-time">{timeAgo(n.created_at)}</span>
                    </div>
                    {n.type === 'like' && n.clip_image_url && (
                      <img src={n.clip_image_url} alt="" className="notif-clip-thumb" />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
