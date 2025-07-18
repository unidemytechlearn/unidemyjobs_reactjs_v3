import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, Settings, Eye, Briefcase, User, AlertCircle, Calendar, FileText } from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import {
  getEmployerNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  subscribeToEmployerNotifications,
  getNotificationIcon,
  getNotificationColor,
  formatNotificationTime,
  type EmployerNotification
} from '../lib/employerNotifications';

interface EmployerNotificationDropdownProps {
  onNavigate?: (page: string, data?: any) => void;
}

const EmployerNotificationDropdown = ({ onNavigate }: EmployerNotificationDropdownProps) => {
  const { user, isAuthenticated, profile } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<EmployerNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load notifications
  const loadNotifications = async () => {
    if (!user || !isAuthenticated || profile?.role !== 'employer') {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    
    try {
      setLoading(true);
      const [notificationsData, unreadCountData] = await Promise.all([
        getEmployerNotifications(user.id, { limit: 20 }),
        getUnreadNotificationCount(user.id)
      ]);
      
      setNotifications(notificationsData);
      setUnreadCount(unreadCountData);
    } catch (error) {
      console.error('Error loading employer notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Load notifications on mount and when user changes
  useEffect(() => {
    if (isAuthenticated && user && profile?.role === 'employer') {
      loadNotifications();
    }
  }, [isAuthenticated, user, profile?.role, isOpen]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user || !isAuthenticated || profile?.role !== 'employer') return;

    const subscription = subscribeToEmployerNotifications(user.id, (newNotification) => {
      console.log('New employer notification received:', newNotification);
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(newNotification.title, {
          body: newNotification.message,
          icon: '/favicon.ico'
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user, isAuthenticated, profile?.role]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Request notification permission
  useEffect(() => {
    if (isAuthenticated && profile?.role === 'employer' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [isAuthenticated, profile?.role]);

  const handleNotificationClick = async (notification: EmployerNotification) => {
    try {
      // Optimistically update UI
      if (!notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        );
        
        // Then update database
        await markNotificationAsRead(notification.id);
      }

      // Navigate based on notification type and data
      if (notification.data) {
        switch (notification.type) {
          case 'new_application':
            if (notification.data.job_id) {
              onNavigate?.('job-applications', { jobId: notification.data.job_id });
            }
            break;
          case 'interview_reminder':
            if (notification.data.interview_id) {
              onNavigate?.('interviews', { interviewId: notification.data.interview_id });
            }
            break;
          case 'status_change':
            if (notification.data.application_id) {
              onNavigate?.('application-details', { applicationId: notification.data.application_id });
            }
            break;
          default:
            onNavigate?.('employer-dashboard');
        }
      }
      
      setIsOpen(false);
    } catch (error) {
      console.error('Error handling notification click:', error);
      loadNotifications();
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    
    try {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      
      await markAllNotificationsAsRead(user.id);
    } catch (error) {
      console.error('Error marking all as read:', error);
      loadNotifications();
    }
  };

  const handleDeleteNotification = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      await deleteNotification(notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
      loadNotifications();
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  if (!isAuthenticated || profile?.role !== 'employer') return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filter === 'unread'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>
              
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                >
                  <CheckCheck className="h-4 w-4" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-600 text-sm">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h4 className="font-medium text-gray-900 mb-1">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
                </h4>
                <p className="text-gray-500 text-sm">
                  {filter === 'unread' 
                    ? 'All caught up! Check back later for updates.'
                    : 'We\'ll notify you when something important happens.'
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors relative group ${
                      !notification.is_read ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm mb-1">
                              {notification.title}
                            </p>
                            <p className="text-gray-600 text-sm leading-relaxed">
                              {notification.message}
                            </p>
                            <p className="text-gray-400 text-xs mt-2">
                              {formatNotificationTime(notification.created_at)}
                            </p>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center space-x-1 ml-2">
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                            <button
                              onClick={(e) => handleDeleteNotification(notification.id, e)}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  onNavigate?.('notifications');
                  setIsOpen(false);
                }}
                className="w-full text-center text-blue-600 hover:text-blue-700 text-sm font-medium py-2 hover:bg-blue-50 rounded-lg transition-colors"
              >
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmployerNotificationDropdown;