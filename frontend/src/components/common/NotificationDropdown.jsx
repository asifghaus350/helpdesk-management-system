import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  X,
  Ticket,
  UserCheck,
  RefreshCw,
  MessageSquare,
  UserPlus,
  UserMinus,
  LoaderCircle,
} from "lucide-react";

import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
} from "../../utils/notificationUtils";
import { timeAgo } from "../../utils/format";

// How often the bell checks for new notifications
const POLL_MS = 30000;

const typeStyles = {
  ticket_created: { icon: Ticket, tile: "bg-blue-50 text-blue-600" },
  ticket_assigned: { icon: UserCheck, tile: "bg-violet-50 text-violet-600" },
  ticket_status: { icon: RefreshCw, tile: "bg-amber-50 text-amber-600" },
  comment_added: { icon: MessageSquare, tile: "bg-emerald-50 text-emerald-600" },
  user_created: { icon: UserPlus, tile: "bg-cyan-50 text-cyan-600" },
  user_deleted: { icon: UserMinus, tile: "bg-red-50 text-red-600" },
};

function NotificationDropdown() {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================
  // BADGE: poll the unread count
  // =========================

  const refreshCount = useCallback(async () => {
    if (!localStorage.getItem("token")) return;

    try {
      setUnreadCount(await fetchUnreadCount());
    } catch {
      // Keep the last known count if the server is unreachable
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      if (!localStorage.getItem("token")) return;

      try {
        const count = await fetchUnreadCount();
        if (!cancelled) setUnreadCount(count);
      } catch {
        // Keep the last known count if the server is unreachable
      }
    };

    poll();

    const timer = setInterval(poll, POLL_MS);
    window.addEventListener("focus", poll);

    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener("focus", poll);
    };
  }, []);

  // =========================
  // LIST: load when opened
  // =========================

  useEffect(() => {
    if (!isOpen) return undefined;

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await fetchNotifications(20);

        if (!cancelled) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        if (!cancelled) {
          setError(error.message || "Unable to load notifications.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    // Close on outside click or Esc
    const handleClick = (e) => {
      if (!containerRef.current?.contains(e.target)) setIsOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);

    return () => {
      cancelled = true;
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  // =========================
  // ACTIONS
  // =========================

  const markLocalRead = (id) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, read: true } : item
      )
    );
  };

  const handleMarkRead = async (notification) => {
    if (notification.read) return;

    markLocalRead(notification._id);
    setUnreadCount((count) => Math.max(0, count - 1));

    try {
      await markNotificationAsRead(notification._id);
    } catch {
      refreshCount();
    }
  };

  const handleOpen = (notification) => {
    handleMarkRead(notification);
    setIsOpen(false);

    if (notification.link) navigate(notification.link);
  };

  const handleMarkAll = async () => {
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, read: true }))
    );
    setUnreadCount(0);

    try {
      await markAllNotificationsAsRead();
    } catch {
      refreshCount();
    }
  };

  const handleDelete = async (notification) => {
    setNotifications((prev) =>
      prev.filter((item) => item._id !== notification._id)
    );

    if (!notification.read) {
      setUnreadCount((count) => Math.max(0, count - 1));
    }

    try {
      await deleteNotification(notification._id);
    } catch {
      refreshCount();
    }
  };

  const handleClearAll = async () => {
    setNotifications([]);
    setUnreadCount(0);

    try {
      await clearAllNotifications();
    } catch {
      refreshCount();
    }
  };

  const badge = unreadCount > 9 ? "9+" : unreadCount;

  return (
    <div className="relative" ref={containerRef}>

      {/* Bell */}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={
          unreadCount
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-expanded={isOpen}
        className="relative p-2 rounded-full hover:bg-gray-100 transition"
      >
        <Bell size={22} className="text-slate-700" />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
            {badge}
          </span>
        )}
      </button>

      {/* Panel */}

      {isOpen && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="fixed inset-x-3 top-18 sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-3 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden"
        >

          {/* Header */}

          <div className="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-slate-100">
            <div>
              <h2 className="font-semibold text-slate-800">
                Notifications
              </h2>

              <p className="text-xs text-slate-500">
                {unreadCount
                  ? `${unreadCount} unread`
                  : "You're all caught up"}
              </p>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAll}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-blue-600 hover:bg-blue-50"
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close notifications"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* List */}

          <div className="max-h-[min(24rem,70vh)] overflow-y-auto">

            {loading && notifications.length === 0 ? (
              <div className="py-10 flex justify-center text-slate-400">
                <LoaderCircle size={22} className="animate-spin" />
              </div>
            ) : error ? (
              <p className="p-6 text-center text-sm text-red-600">
                {error}
              </p>
            ) : notifications.length === 0 ? (
              <div className="py-10 px-6 text-center">
                <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <BellOff size={20} />
                </div>

                <p className="text-sm font-medium text-slate-700 mt-3">
                  No notifications yet
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  Assignments, status changes and new comments show up here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {notifications.map((notification) => {
                  const style =
                    typeStyles[notification.type] || typeStyles.ticket_created;
                  const Icon = style.icon;

                  return (
                    <li
                      key={notification._id}
                      className={`group relative flex gap-3 px-4 py-3 transition hover:bg-slate-50 ${
                        notification.read ? "" : "bg-blue-50/40"
                      }`}
                    >
                      <span
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${style.tile}`}
                      >
                        <Icon size={17} />
                      </span>

                      <button
                        type="button"
                        onClick={() => handleOpen(notification)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <p
                          className={`text-sm leading-snug ${
                            notification.read
                              ? "text-slate-600"
                              : "font-semibold text-slate-800"
                          }`}
                        >
                          {notification.title}
                        </p>

                        {notification.message && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                        )}

                        <p className="text-[11px] text-slate-400 mt-1">
                          {notification.actor?.name &&
                            `${notification.actor.name} · `}
                          {timeAgo(notification.createdAt)}
                        </p>
                      </button>

                      <div className="flex flex-col items-center gap-1 shrink-0">
                        {!notification.read && (
                          <span
                            className="w-2 h-2 rounded-full bg-blue-500 mt-1 group-hover:hidden"
                            aria-hidden="true"
                          />
                        )}

                        <div className="hidden group-hover:flex group-focus-within:flex flex-col gap-1">
                          {!notification.read && (
                            <button
                              type="button"
                              onClick={() => handleMarkRead(notification)}
                              title="Mark as read"
                              aria-label="Mark as read"
                              className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                            >
                              <Check size={15} />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDelete(notification)}
                            title="Delete"
                            aria-label="Delete notification"
                            className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs font-medium text-slate-500 hover:text-red-600"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default NotificationDropdown;
