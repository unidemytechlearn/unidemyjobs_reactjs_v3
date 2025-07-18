import { supabase } from './supabase';

export interface EmployerNotification {
  id: string;
  employer_id: string;
  type: 'new_application' | 'interview_reminder' | 'status_change' | 'system_update';
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  is_email_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  id?: string;
  employer_id: string;
  new_applications: boolean;
  interview_reminders: boolean;
  status_changes: boolean;
  system_updates: boolean;
  email_notifications: boolean;
}

// Get employer notifications
export const getEmployerNotifications = async (
  employerId: string,
  filters?: {
    type?: string;
    is_read?: boolean;
    limit?: number;
    offset?: number;
  }
): Promise<EmployerNotification[]> => {
  try {
    let query = supabase
      .from('employer_notifications')
      .select('*')
      .eq('employer_id', employerId)
      .order('created_at', { ascending: false });

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.is_read !== undefined) {
      query = query.eq('is_read', filters.is_read);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching employer notifications:', error);
    throw error;
  }
};

// Get unread notification count
export const getUnreadNotificationCount = async (employerId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('employer_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('employer_id', employerId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('employer_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (employerId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('employer_notifications')
      .update({ is_read: true })
      .eq('employer_id', employerId)
      .eq('is_read', false);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Delete notification
export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('employer_notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Create manual notification
export const createEmployerNotification = async (
  employerId: string,
  type: EmployerNotification['type'],
  title: string,
  message: string,
  data?: any
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('employer_notifications')
      .insert({
        employer_id: employerId,
        type,
        title,
        message,
        data: data || {},
        is_read: false,
        is_email_sent: false
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Get notification preferences
export const getNotificationPreferences = async (employerId: string): Promise<NotificationPreferences | null> => {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('employer_id', employerId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    throw error;
  }
};

// Update notification preferences
export const updateNotificationPreferences = async (
  employerId: string,
  preferences: Partial<NotificationPreferences>
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        employer_id: employerId,
        ...preferences
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
};

// Subscribe to real-time notifications
export const subscribeToEmployerNotifications = (
  employerId: string,
  onNotification: (notification: EmployerNotification) => void
) => {
  const subscription = supabase
    .channel(`employer_notifications:${employerId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'employer_notifications',
        filter: `employer_id=eq.${employerId}`
      },
      (payload) => {
        onNotification(payload.new as EmployerNotification);
      }
    )
    .subscribe();

  return subscription;
};

// Notification type helpers
export const getNotificationIcon = (type: EmployerNotification['type']): string => {
  const icons = {
    new_application: '📋',
    interview_reminder: '📅',
    status_change: '🔄',
    system_update: '🔔'
  };
  return icons[type] || '🔔';
};

export const getNotificationColor = (type: EmployerNotification['type']): string => {
  const colors = {
    new_application: 'text-blue-600 bg-blue-50 border-blue-200',
    interview_reminder: 'text-purple-600 bg-purple-50 border-purple-200',
    status_change: 'text-green-600 bg-green-50 border-green-200',
    system_update: 'text-gray-600 bg-gray-50 border-gray-200'
  };
  return colors[type] || 'text-gray-600 bg-gray-50 border-gray-200';
};

// Format relative time
export const formatNotificationTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  } else {
    return date.toLocaleDateString();
  }
};