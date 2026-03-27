import { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'
import { supabase } from '../lib/supabase'

export function useNotifications() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications')
      setNotifications(res.data.notifications)
      setUnreadCount(res.data.unread_count)
    } catch {
      // 認証前など取得失敗時は無視
    }
  }, [])

  useEffect(() => {
    fetchNotifications()

    // Supabase Realtime: 新しい通知が届いたら再取得
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      }, () => {
        fetchNotifications()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetchNotifications])

  const markAllRead = useCallback(async () => {
    await api.patch('/notifications/read')
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }, [])

  return { notifications, unreadCount, markAllRead, refetch: fetchNotifications }
}
