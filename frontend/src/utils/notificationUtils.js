export const getNotifications = () => {
  return (
    JSON.parse(
      localStorage.getItem("notifications")
    ) || []
  );
};


// =========================
// ADD NOTIFICATION
// =========================

export const addNotification = (
  message,
  type = "general"
) => {

  // Get saved application settings
  const savedSettings =
    localStorage.getItem("settings");

  const settings = savedSettings
    ? JSON.parse(savedSettings)
    : {
        emailNotifications: true,
        ticketNotifications: true,
        userNotifications: true,
        compactMode: false,
        theme: "light",
      };


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

  const notifications = getNotifications();

  const newNotification = {
    id: Date.now(),
    message,
    type,
    time: "Just now",
    read: false,
  };

  const updatedNotifications = [
    newNotification,
    ...notifications,
  ];

  localStorage.setItem(
    "notifications",
    JSON.stringify(updatedNotifications)
  );

  window.dispatchEvent(
    new Event("notificationsUpdated")
  );

  return newNotification;
};


// =========================
// MARK ONE AS READ
// =========================

export const markNotificationAsRead = (id) => {

  const notifications = getNotifications();

  const updatedNotifications =
    notifications.map(
      (notification) =>
        notification.id === id
          ? {
              ...notification,
              read: true,
            }
          : notification
    );

  localStorage.setItem(
    "notifications",
    JSON.stringify(updatedNotifications)
  );

  window.dispatchEvent(
    new Event("notificationsUpdated")
  );

  return updatedNotifications;
};


// =========================
// DELETE NOTIFICATION
// =========================

export const deleteNotification = (id) => {

  const notifications = getNotifications();

  const updatedNotifications =
    notifications.filter(
      (notification) =>
        notification.id !== id
    );

  localStorage.setItem(
    "notifications",
    JSON.stringify(updatedNotifications)
  );

  window.dispatchEvent(
    new Event("notificationsUpdated")
  );

  return updatedNotifications;
};


// =========================
// MARK ALL AS READ
// =========================

export const markAllNotificationsAsRead = () => {

  const notifications = getNotifications();

  const updatedNotifications =
    notifications.map(
      (notification) => ({
        ...notification,
        read: true,
      })
    );

  localStorage.setItem(
    "notifications",
    JSON.stringify(updatedNotifications)
  );

  window.dispatchEvent(
    new Event("notificationsUpdated")
  );

  return updatedNotifications;
};