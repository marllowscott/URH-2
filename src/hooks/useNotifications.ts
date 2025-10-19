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
      const allNotifications = getNotifications();
      
      // Filter notifications
      let filteredNotifications = allNotifications.filter(n => !n.read);
      
      if (program) {
        filteredNotifications = filteredNotifications.filter(n => n.program === program);
      }

      // Sort by creation date (newest first)
      filteredNotifications.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setNotifications(filteredNotifications);

      // Calculate counts
      const newCourses = filteredNotifications.filter(n => 
        n.type === 'course'
      ).length;
      
      const newResources = filteredNotifications.filter(n => 
        n.type === 'resource'
      ).length;

      setCounts({
        newCourses,
        newResources,
        total: filteredNotifications.length
      });
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

      // Recalculate counts
      const updatedNotifications = notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      
      const newCourses = updatedNotifications.filter(n => 
        !n.read && n.type === 'course'
      ).length;
      
      const newResources = updatedNotifications.filter(n => 
        !n.read && n.type === 'resource'
      ).length;

      setCounts({
        newCourses,
        newResources,
        total: updatedNotifications.filter(n => !n.read).length
      });
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