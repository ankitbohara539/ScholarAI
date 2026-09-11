import type { Notification } from "@/types/notification";

export function upsertNotification(
  current: Notification[],
  incoming: Notification,
): Notification[] {
  const existing = current.find((item) => item.id === incoming.id);
  if (existing?.is_read && !incoming.is_read) return current;
  if (
    existing &&
    existing.is_read === incoming.is_read &&
    existing.read_at === incoming.read_at
  )
    return current;
  return [incoming, ...current.filter((item) => item.id !== incoming.id)];
}
