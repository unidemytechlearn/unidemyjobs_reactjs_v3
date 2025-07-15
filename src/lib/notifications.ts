import { supabase } from './supabase';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'job_alert' | 'application_update' | 'profile_view' | 'system' | 'marketing';
  is_read: boolean;
  action_url?: string;
  metadata?: any;
  created_at: string;
}

export interface NotificationPreferences {
  email_notifications: boolean;
  job_alerts: boolean;
  application_updates: boolean;
  marketing_emails: boolean;
}

// Get user notifications
export async function getUserNotifications(userId: string, limit = 50): Promise<Notification[]> {
  try {
    // Check if we have a valid Supabase client
    if (!supabase) {
      console.error('Supabase client not initialized');
      return [];
    }

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('User not authenticated, skipping notifications fetch');
      return [];
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    // Return empty array instead of throwing to prevent UI crashes
    return [];
  }
}

// Get unread notification count
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    // Check if we have a valid Supabase client
    if (!supabase) {
      console.error('Supabase client not initialized');
      return 0;
    }

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('User not authenticated, skipping unread count fetch');
      return 0;
    }

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    // Return 0 instead of throwing to prevent UI crashes
    return 0;
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

// Delete notification
export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
}

// Create notification
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: Notification['type'],
  actionUrl?: string,
  metadata?: any
): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        action_url: actionUrl,
        metadata,
        is_read: false
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

// Subscribe to real-time notifications
export function subscribeToNotifications(
  userId: string,
  onNotification: (notification: Notification) => void
) {
  console.log('Setting up notification subscription for user:', userId);
  
  const subscription = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('Real-time notification received:', payload);
        onNotification(payload.new as Notification);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('Notification updated:', payload);
        // You can handle notification updates here if needed
      }
    )
    .subscribe();

  // Log subscription status
  subscription.on('subscribed', () => {
    console.log('Successfully subscribed to notifications');
  });
  
  subscription.on('error', (error) => {
    console.error('Notification subscription error:', error);
  });

  return subscription;
}

// Notification templates
export const NotificationTemplates = {
  APPLICATION_SUBMITTED: (jobTitle: string, companyName: string) => ({
    title: 'Application Submitted',
    message: `Your application for ${jobTitle} at ${companyName} has been submitted successfully.`,
    type: 'application_update' as const
  }),

  APPLICATION_STATUS_CHANGED: (jobTitle: string, companyName: string, newStatus: string) => ({
    title: 'Application Status Update',
    message: `Your application for ${jobTitle} at ${companyName} is now ${newStatus.replace('_', ' ')}.`,
    type: 'application_update' as const
  }),

  PROFILE_VIEWED: (viewerName?: string) => ({
    title: 'Profile Viewed',
    message: viewerName 
      ? `${viewerName} viewed your profile` 
      : 'Someone viewed your profile',
    type: 'profile_view' as const
  }),

  JOB_ALERT: (jobTitle: string, companyName: string) => ({
    title: 'New Job Match',
    message: `New job opportunity: ${jobTitle} at ${companyName} matches your preferences.`,
    type: 'job_alert' as const
  }),

  INTERVIEW_SCHEDULED: (jobTitle: string, companyName: string, interviewDate: string) => ({
    title: 'Interview Scheduled',
    message: `Interview scheduled for ${jobTitle} at ${companyName} on ${interviewDate}.`,
    type: 'application_update' as const
  }),

  OFFER_RECEIVED: (jobTitle: string, companyName: string) => ({
    title: 'Job Offer Received',
    message: `Congratulations! You've received an offer for ${jobTitle} at ${companyName}.`,
    type: 'application_update' as const
  }),

  WELCOME: () => ({
    title: 'Welcome to Unidemy Jobs!',
    message: 'Complete your profile to get personalized job recommendations and increase your visibility to employers.',
    type: 'system' as const
  }),

  PROFILE_INCOMPLETE: () => ({
    title: 'Complete Your Profile',
    message: 'Add more details to your profile to get better job matches and increase your chances of being discovered by employers.',
    type: 'system' as const
  })
};

// Helper function to get notification icon
export function getNotificationIcon(type: Notification['type']): string {
  const icons = {
    job_alert: '💼',
    application_update: '📋',
    profile_view: '👁️',
    system: '🔔',
    marketing: '📢'
  };
  return icons[type] || '🔔';
}

// Helper function to get notification color
export function getNotificationColor(type: Notification['type']): string {
  const colors = {
    job_alert: 'text-blue-600 bg-blue-50 border-blue-200',
    application_update: 'text-green-600 bg-green-50 border-green-200',
    profile_view: 'text-purple-600 bg-purple-50 border-purple-200',
    system: 'text-gray-600 bg-gray-50 border-gray-200',
    marketing: 'text-orange-600 bg-orange-50 border-orange-200'
  };
  return colors[type] || 'text-gray-600 bg-gray-50 border-gray-200';
}

// Format relative time
export function formatNotificationTime(dateString: string): string {
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
}