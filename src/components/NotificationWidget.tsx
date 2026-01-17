import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Trash2, Settings } from 'lucide-react';
import {
  Notification,
  NotificationType,
  getNotificationIcon,
  getNotificationColor,
} from '../api/notificationsApi';

interface NotificationWidgetProps {
  notifications: Notification[];
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
  onDelete?: (id: number) => void;
  loading?: boolean;
}

type NotificationTab = 'all' | 'order' | 'negotiation' | 'inventory' | 'loyalty' | 'delivery' | 'payment' | 'system';

const NotificationWidget: React.FC<NotificationWidgetProps> = ({
  notifications,
  isOpen,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  loading = false,
}) => {
  const [activeTab, setActiveTab] = useState<NotificationTab>('all');
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const tabs: { id: NotificationTab; label: string; icon: string; count: number }[] = [
    {
      id: 'all',
      label: 'All',
      icon: '🔔',
      count: notifications.length,
    },
    {
      id: 'order',
      label: 'Orders',
      icon: '📦',
      count: notifications.filter(n => n.type === 'order').length,
    },
    {
      id: 'negotiation',
      label: 'Negotiations',
      icon: '🤝',
      count: notifications.filter(n => n.type === 'negotiation').length,
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: '📊',
      count: notifications.filter(n => n.type === 'inventory').length,
    },
    {
      id: 'loyalty',
      label: 'Loyalty',
      icon: '⭐',
      count: notifications.filter(n => n.type === 'loyalty').length,
    },
    {
      id: 'delivery',
      label: 'Delivery',
      icon: '🚚',
      count: notifications.filter(n => n.type === 'delivery').length,
    },
  ];

  const filteredNotifications =
    activeTab === 'all'
      ? notifications
      : notifications.filter(n => n.type === activeTab);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleNotificationClick = (notif: Notification) => {
    console.log('Notification clicked:', notif);
    if (!notif.is_read) {
      console.log('Calling onMarkAsRead for notification:', notif.id);
      onMarkAsRead(notif.id);
    }
    if (notif.data?.action_url) {
      console.log('Navigating to:', notif.data.action_url);
      window.location.href = notif.data.action_url;
    }
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    console.log('Delete clicked for notification:', id);
    e.stopPropagation();
    if (onDelete) {
      console.log('Calling onDelete');
      onDelete(id);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />

      <div className="fixed top-12 right-4 sm:right-6 md:right-8 w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-white to-gray-50">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-orange-600" />
            <div>
              <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close notifications"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="border-b border-gray-100 px-4 py-3 overflow-x-auto">
          <div className="flex gap-2 whitespace-nowrap">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl font-medium transition-all text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-orange-100 text-orange-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                      activeTab === tab.id
                        ? 'bg-orange-200 text-orange-800'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {tab.count > 9 ? '9+' : tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {unreadCount > 0 && (
          <div className="px-6 py-3 border-b border-gray-100 bg-orange-50 flex justify-between items-center">
            <p className="text-sm text-orange-700 font-medium">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
            <button
              onClick={onMarkAllAsRead}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 bg-orange-100 px-4 py-1.5 rounded-full transition-colors hover:bg-orange-200"
            >
              <Check className="h-3.5 w-3.5 inline mr-1" />
              Mark all read
            </button>
          </div>
        )}

        <div className="max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-3">
              <div className="w-8 h-8 border-4 border-orange-100 border-t-orange-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
                <span className="text-2xl">{tabs.find(t => t.id === activeTab)?.icon}</span>
              </div>
              <p className="text-sm font-medium text-gray-900">No notifications</p>
              <p className="text-xs text-gray-500 mt-1">
                {activeTab === 'all' ? 'You\'re all caught up!' : `No ${activeTab} notifications yet`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map(notif => {
                const colors = getNotificationColor(notif.severity);
                const isHovered = hoveredId === notif.id;

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    onMouseEnter={() => setHoveredId(notif.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={`p-4 cursor-pointer transition-all duration-200 ${
                      notif.is_read
                        ? 'hover:bg-gray-50'
                        : `${colors.bg} hover:brightness-95`
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        {!notif.is_read && (
                          <span className="w-2.5 h-2.5 bg-orange-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.6)] flex-shrink-0 mt-2" />
                        )}
                        {notif.is_read && (
                          <span className="w-2.5 h-2.5 bg-transparent" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p
                              className={`text-sm leading-relaxed ${
                                !notif.is_read
                                  ? 'text-gray-900 font-semibold'
                                  : 'text-gray-700 font-normal'
                              }`}
                            >
                              {notif.message}
                            </p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <span
                                className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${colors.badge}`}
                              >
                                <span>{getNotificationIcon(notif.type)}</span>
                                <span className="capitalize text-orange-600">{notif.type}</span>
                              </span>
                              <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                                {new Date(notif.created_at).toLocaleDateString()}
                              </span>
                              <span className="text-gray-300">•</span>
                              <span className="text-[11px] text-gray-400">
                                {new Date(notif.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {isHovered && (
                        <div className="flex gap-1 flex-shrink-0">
                          {!notif.is_read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onMarkAsRead(notif.id);
                              }}
                              className="p-2 hover:bg-white rounded-lg transition-colors text-gray-500 hover:text-green-600"
                              title="Mark as read"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={(e) => handleDelete(e, notif.id)}
                              className="p-2 hover:bg-white rounded-lg transition-colors text-gray-500 hover:text-red-600"
                              title="Delete notification"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationWidget;
