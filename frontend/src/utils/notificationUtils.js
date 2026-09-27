// Notifications are stored per logged-in user so people
// sharing a browser don't see each other's notifications.

const storageKey = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return `notifications:${user?.id || "guest"}`;
  } catch {
    return "notifications:guest";
  }
};

const saveNotifications = (notifications) => {
  localStorage.setItem(
    storageKey(),
    JSON.stringify(notifications)
  );

  window.dispatchEvent(
    new Event("notificationsUpdated")
  );

  return notifications;
};

export const getNotifications = () => {
  try {
    return (
      JSON.parse(localStorage.getItem(storageKey())) || []
    );
  } catch {
    return [];
  }
};

// =========================
// DISPLAY TIME
// =========================

export const formatNotificationTime = (notification) => {
  // Older notifications only had a fixed "Just now" label
  if (!notification.createdAt) {
    return notification.time || "";
  }

  const seconds = Math.floor(
    (Date.now() - new Date(notification.createdAt).getTime()) /
      1000
  );

  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(notification.createdAt).toLocaleDateString();
};

// =========================
// ADD NOTIFICATION
// =========================

export const addNotification = (
  message,
  type = "general"
) => {

  // Get saved application settings
  let settings;

  try {
    settings =
      JSON.parse(localStorage.getItem("settings")) || {};
  } catch {
    settings = {};
  }

  // =========================
  // CHECK NOTIFICATION SETTINGS
  // =========================

  if (
    type === "ticket" &&
    settings.ticketNotifications === false
  ) {
    return null;
  }

  if (
    type === "user" &&
    settings.userNotifications === false
  ) {
    return null;
  }

  // =========================
  // CREATE NOTIFICATION
  // =========================

  const newNotification = {
    id: Date.now(),
    message,
    type,
    createdAt: new Date().toISOString(),
    read: false,
  };

  // Keep the list bounded
  saveNotifications(
    [newNotification, ...getNotifications()].slice(0, 50)
  );

  return newNotification;
};

// =========================
// MARK ONE AS READ
// =========================

export const markNotificationAsRead = (id) =>
  saveNotifications(
    getNotifications().map((notification) =>
      notification.id === id
        ? { ...notification, read: true }
        : notification
    )
  );

// =========================
// DELETE NOTIFICATION
// =========================

export const deleteNotification = (id) =>
  saveNotifications(
    getNotifications().filter(
      (notification) => notification.id !== id
    )
  );

// =========================
// MARK ALL AS READ
// =========================

export const markAllNotificationsAsRead = () =>
  saveNotifications(
    getNotifications().map((notification) => ({
      ...notification,
      read: true,
    }))
  );
