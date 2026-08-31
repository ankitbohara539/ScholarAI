import { Bell, CheckCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useNotifications } from '@/hooks/useNotifications'
import { cn } from '@/lib/utils'

export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  return <Popover><PopoverTrigger asChild><Button variant="ghost" size="icon" className="relative"><Bell className="size-5" />{unreadCount > 0 && <span className="absolute right-0 top-0 flex min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}</Button></PopoverTrigger><PopoverContent align="end" className="w-[min(24rem,calc(100vw-2rem))] p-0"><div className="flex items-center justify-between p-4"><div><p className="font-semibold">Notifications</p><p className="text-xs text-muted-foreground">{unreadCount} unread</p></div>{unreadCount > 0 && <Button variant="ghost" size="sm" onClick={() => void markAllRead()}><CheckCheck className="size-4" />Mark all read</Button>}</div><Separator /><ScrollArea className="h-80">{notifications.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">No notifications yet.</div> : notifications.map((notification) => <button key={notification.id} type="button" onClick={() => !notification.is_read && void markRead(notification.id)} className={cn('block w-full border-b p-4 text-left hover:bg-muted/60', !notification.is_read && 'bg-primary/5')}><div className="flex gap-3"><span className={cn('mt-1 size-2 shrink-0 rounded-full', notification.is_read ? 'bg-transparent' : 'bg-primary')} /><div><p className="text-sm font-semibold">{notification.title}</p><p className="mt-1 text-sm leading-5 text-muted-foreground">{notification.message}</p><p className="mt-2 text-xs text-muted-foreground">{new Date(notification.created_at).toLocaleString()}</p></div></div></button>)}</ScrollArea></PopoverContent></Popover>
}
