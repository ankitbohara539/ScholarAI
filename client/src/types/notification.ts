export type NotificationType = 'profile_submitted' | 'profile_verified' | 'profile_rejected' | 'account_suspended' | 'account_reactivated' | 'recommendation_ready'

export interface Notification {
  id: number
  type: NotificationType
  title: string
  message: string
  is_read: boolean
  created_at: string
  read_at: string | null
}

export interface NotificationPage {
  items: Notification[]
  page: number
  page_size: number
  total: number
  pages: number
  unread_count: number
}
