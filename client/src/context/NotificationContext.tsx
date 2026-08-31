import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { API_BASE_URL } from '@/api/axios'
import { notificationsApi } from '@/api/notifications.api'
import { tokenStorage } from '@/api/token'
import { NotificationContext, type NotificationContextValue } from '@/context/notification-context'
import { useAuth } from '@/hooks/useAuth'
import type { Notification } from '@/types/notification'

function websocketUrl(): string {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL
  const url = new URL(API_BASE_URL)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.pathname = '/ws/notifications'
  return url.toString()
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const page = await notificationsApi.list()
      setNotifications(page.items)
      setUnreadCount(page.unread_count)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      return
    }
    void refresh()
  }, [user, refresh])

  useEffect(() => {
    const token = tokenStorage.get()
    if (!user || !token) return
    let socket: WebSocket | null = null
    let retryTimer: number | undefined
    let attempts = 0
    let stopped = false

    const connect = () => {
      if (stopped) return
      socket = new WebSocket(websocketUrl())
      socket.onopen = () => {
        attempts = 0
        socket?.send(JSON.stringify({ token }))
      }
      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as { event?: string; notification?: Notification }
          if (payload.event === 'notification' && payload.notification) {
            const incoming = payload.notification
            setNotifications((current) => [incoming, ...current.filter((item) => item.id !== incoming.id)])
            setUnreadCount((count) => count + (incoming.is_read ? 0 : 1))
          }
        } catch { /* Ignore malformed server messages and keep the connection alive. */ }
      }
      socket.onclose = (event) => {
        if (stopped || event.code === 4401 || event.code === 4403 || attempts >= 5) return
        attempts += 1
        retryTimer = window.setTimeout(connect, Math.min(1000 * 2 ** attempts, 15000))
      }
    }
    connect()
    return () => {
      stopped = true
      if (retryTimer) window.clearTimeout(retryTimer)
      socket?.close()
    }
  }, [user])

  const markRead = useCallback(async (id: number) => {
    const updated = await notificationsApi.markRead(id)
    setNotifications((current) => current.map((item) => item.id === id ? updated : item))
    setUnreadCount((count) => Math.max(0, count - 1))
  }, [])

  const markAllRead = useCallback(async () => {
    await notificationsApi.markAllRead()
    setNotifications((current) => current.map((item) => ({ ...item, is_read: true })))
    setUnreadCount(0)
  }, [])

  const value = useMemo<NotificationContextValue>(() => ({ notifications, unreadCount, isLoading, refresh, markRead, markAllRead }), [notifications, unreadCount, isLoading, refresh, markRead, markAllRead])
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}
