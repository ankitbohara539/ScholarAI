import api from '@/api/axios'
import type { Notification, NotificationPage } from '@/types/notification'

export const notificationsApi = {
  async list(): Promise<NotificationPage> { return (await api.get<NotificationPage>('/notifications')).data },
  async markRead(id: number): Promise<Notification> { return (await api.patch<Notification>(`/notifications/${id}/read`)).data },
  async markAllRead(): Promise<void> { await api.patch('/notifications/read-all') },
}
