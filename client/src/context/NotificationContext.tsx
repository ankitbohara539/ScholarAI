import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { API_BASE_URL, getApiError } from "@/api/axios";
import { notificationsApi } from "@/api/notifications.api";
import { tokenStorage } from "@/api/token";
import {
  NotificationContext,
  type NotificationContextValue,
} from "@/context/notification-context";
import { useAuth } from "@/hooks/useAuth";
import { upsertNotification } from "@/lib/notifications";
import type { Notification } from "@/types/notification";

function websocketUrl(): string {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  const url = new URL(API_BASE_URL);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws/notifications";
  return url.toString();
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const page = await notificationsApi.list();
      setNotifications(page.items);
      setError("");
    } catch (requestError) {
      setError(
        getApiError(requestError, "Notifications could not be synchronized."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setError("");
      return;
    }
    void refresh();
  }, [userId, refresh]);

  useEffect(() => {
    const token = tokenStorage.get();
    if (!userId || !token) return;
    let socket: WebSocket | null = null;
    let retryTimer: number | undefined;
    let attempts = 0;
    let stopped = false;

    const connect = () => {
      if (stopped) return;
      socket = new WebSocket(websocketUrl());
      socket.onopen = () => {
        attempts = 0;
        setError("");
        socket?.send(JSON.stringify({ token }));
        void refresh();
      };
      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as {
            event?: string;
            notification?: Notification;
          };
          if (payload.event === "notification" && payload.notification) {
            setNotifications((current) =>
              upsertNotification(current, payload.notification!),
            );
          }
        } catch {
          setError("A malformed real-time notification was ignored.");
        }
      };
      socket.onerror = () =>
        setError(
          "Real-time notifications are reconnecting; saved notifications remain available.",
        );
      socket.onclose = (event) => {
        if (
          stopped ||
          event.code === 4401 ||
          event.code === 4403 ||
          attempts >= 5
        )
          return;
        attempts += 1;
        retryTimer = window.setTimeout(
          connect,
          Math.min(1000 * 2 ** attempts, 15000),
        );
      };
    };

    connect();
    return () => {
      stopped = true;
      if (retryTimer) window.clearTimeout(retryTimer);
      socket?.close();
    };
  }, [userId, refresh]);

  const markRead = useCallback(async (id: number) => {
    try {
      const updated = await notificationsApi.markRead(id);
      setNotifications((current) => upsertNotification(current, updated));
      setError("");
    } catch (requestError) {
      setError(
        getApiError(requestError, "Notification could not be marked as read."),
      );
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((current) =>
        current.map((item) => ({ ...item, is_read: true })),
      );
      setError("");
    } catch (requestError) {
      setError(
        getApiError(requestError, "Notifications could not be marked as read."),
      );
    }
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications],
  );
  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      error,
      refresh,
      markRead,
      markAllRead,
    }),
    [
      notifications,
      unreadCount,
      isLoading,
      error,
      refresh,
      markRead,
      markAllRead,
    ],
  );
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
