import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  title: string;
  body: string | null;
  program: string | null;
  read: boolean;
  created_at: string;
  type: 'resource' | 'course' | 'task';
}

export interface NotificationCounts {
  newCourses: number;
  newResources: number;
  total: number;
}

export function useNotifications(program?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [counts, setCounts] = useState<NotificationCounts>({
    newCourses: 0,
    newResources: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      const { getNotifications } = await import('@/lib/localStorage');
      const all = getNotifications();
      // Normalize to hook Notification type
      const normalized: Notification[] = (all as any[]).map((n: any) => ({
        id: n.id,
        title: n.title,
        body: n.body ?? null,
        program: n.program ?? null,
        read: !!n.read,
        created_at: n.created_at ?? n.createdAt ?? new Date().toISOString(),
        type: (n.type as 'resource' | 'course' | 'task') ?? 'resource',
      }));

      // Filter notifications
      let filtered = normalized.filter(n => !n.read);
      if (program) filtered = filtered.filter(n => n.program === program);

      // Sort by creation date (newest first)
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(filtered);

      // Calculate counts
      const newCourses = filtered.filter(n => n.type === 'course' || n.type === 'task').length;
      const newResources = filtered.filter(n => n.type === 'resource').length;

      setCounts({ newCourses, newResources, total: filtered.length });
    } catch (error) {
      console.error('Error in loadNotifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { markNotificationAsRead } = await import('@/lib/localStorage');
      const result = markNotificationAsRead(notificationId);

      if (!result) {
        toast({
          title: "Error",
          description: "Failed to mark notification as read",
          variant: "destructive"
        });
        return;
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );

      // Recalculate counts from local state
      const updated = notifications.map(n => n.id === notificationId ? { ...n, read: true } : n);
      const newCourses = updated.filter(n => !n.read && (n.type === 'course' || n.type === 'task')).length;
      const newResources = updated.filter(n => !n.read && n.type === 'resource').length;
      setCounts({ newCourses, newResources, total: updated.filter(n => !n.read).length });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { markAllNotificationsAsRead } = await import('@/lib/localStorage');
      markAllNotificationsAsRead();

      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );

      setCounts({
        newCourses: 0,
        newResources: 0,
        total: 0
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  useEffect(() => {
    loadNotifications();

    // Set up real-time subscription using localStorage events
    const setupStorageListener = async () => {
      const { storageEvents } = await import('@/lib/localStorage');
      const handleStorageUpdate = () => {
        loadNotifications();
      };

      storageEvents.on('notifications_updated', handleStorageUpdate);

      return () => {
        storageEvents.off('notifications_updated', handleStorageUpdate);
      };
    };

    let cleanup: (() => void) | undefined;
    setupStorageListener().then(cleanupFn => {
      cleanup = cleanupFn;
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [program]);

  return {
    notifications,
    counts,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: loadNotifications
  };
}