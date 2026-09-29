import { API_URL } from "../config";

// =========================
// NOTIFICATIONS API
// =========================
// Notifications are created by the backend (ticket assigned,
// status changed, new comment, …) and stored per user, so they
// follow the account across browsers and devices.

const request = async (path, options = {}) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/notifications${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Notification request failed");
  }

  return data;
};

// { notifications, unreadCount }
export const fetchNotifications = (limit = 20) =>
  request(`?limit=${limit}`);

export const fetchUnreadCount = async () =>
  (await request("/unread-count")).unreadCount;

export const markNotificationAsRead = (id) =>
  request(`/${id}/read`, { method: "PATCH" });

export const markAllNotificationsAsRead = () =>
  request("/read-all", { method: "PATCH" });

export const deleteNotification = (id) =>
  request(`/${id}`, { method: "DELETE" });

export const clearAllNotifications = () =>
  request("", { method: "DELETE" });
