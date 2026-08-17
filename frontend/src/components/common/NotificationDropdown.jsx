import { useEffect, useState } from "react";
import { Bell, Check, X } from "lucide-react";

import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../../utils/notificationUtils";

function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  const [notifications, setNotifications] = useState(() => {
    return getNotifications();
  });

  // Load notifications from localStorage
  useEffect(() => {
    const loadNotifications = () => {
      setNotifications(getNotifications());
    };

    loadNotifications();

    window.addEventListener(
      "notificationsUpdated",
      loadNotifications
    );

    return () => {
      window.removeEventListener(
        "notificationsUpdated",
        loadNotifications
      );
    };
  }, []);

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  // Mark one notification as read
  const markAsRead = (id) => {
    const updatedNotifications =
      markNotificationAsRead(id);

    setNotifications(updatedNotifications);
  };

  // Mark all as read
  const markAllAsRead = () => {
    const updatedNotifications =
      markAllNotificationsAsRead();

    setNotifications(updatedNotifications);
  };

  // Delete notification
  const handleDeleteNotification = (id) => {
    const updatedNotifications =
      deleteNotification(id);

    setNotifications(updatedNotifications);
  };

  return (
    <div className="relative">

      {/* Notification Button */}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition"
      >
        <Bell
          size={22}
          className="text-slate-700"
        />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}

      {isOpen && (
        <div className="absolute right-0 mt-3 w-96 bg-white rounded-2xl shadow-xl border border-gray-200 z-50">

          {/* Header */}

          <div className="flex items-center justify-between p-4 border-b border-gray-200">

            <div>
              <h2 className="font-semibold text-slate-800">
                Notifications
              </h2>

              <p className="text-sm text-gray-500">
                {unreadCount} unread notification
                {unreadCount !== 1 ? "s" : ""}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-700"
            >
              <X size={18} />
            </button>

          </div>

          {/* Mark All */}

          {unreadCount > 0 && (
            <div className="px-4 py-2 border-b border-gray-200">

              <button
                type="button"
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Mark all as read
              </button>

            </div>
          )}

          {/* Notification List */}

          <div className="max-h-96 overflow-y-auto">

            {notifications.length === 0 ? (

              <div className="p-6 text-center text-gray-500">
                No notifications.
              </div>

            ) : (

              notifications.map((notification) => (

                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-200 hover:bg-slate-50 transition ${
                    !notification.read
                      ? "bg-blue-50"
                      : "bg-white"
                  }`}
                >

                  <div className="flex justify-between gap-3">

                    <div className="flex-1">

                      <p
                        className={`text-sm ${
                          !notification.read
                            ? "font-semibold text-slate-800"
                            : "text-gray-600"
                        }`}
                      >
                        {notification.message}
                      </p>

                      <p className="text-xs text-gray-400 mt-1">
                        {notification.time}
                      </p>

                    </div>

                    <div className="flex gap-2">

                      {/* Mark as Read */}

                      {!notification.read && (
                        <button
                          type="button"
                          onClick={() =>
                            markAsRead(notification.id)
                          }
                          className="text-green-600 hover:text-green-800"
                          title="Mark as read"
                        >
                          <Check size={17} />
                        </button>
                      )}

                      {/* Delete */}

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteNotification(
                            notification.id
                          )
                        }
                        className="text-red-500 hover:text-red-700"
                        title="Delete notification"
                      >
                        <X size={17} />
                      </button>

                    </div>

                  </div>

                </div>

              ))

            )}

          </div>

        </div>
      )}

    </div>
  );
}

export default NotificationDropdown;