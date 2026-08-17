export const getNotifications = () => {
  return JSON.parse(
    localStorage.getItem("notifications")
  ) || [];
};


export const addNotification = (message) => {
  const notifications = getNotifications();

  const newNotification = {
    id: Date.now(),
    message,
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


export const markNotificationAsRead = (id) => {
  const notifications = getNotifications();

  const updatedNotifications = notifications.map(
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

  return updatedNotifications;
};


export const deleteNotification = (id) => {
  const notifications = getNotifications();

  const updatedNotifications = notifications.filter(
    (notification) => notification.id !== id
  );

  localStorage.setItem(
    "notifications",
    JSON.stringify(updatedNotifications)
  );

  return updatedNotifications;
};


export const markAllNotificationsAsRead = () => {
  const notifications = getNotifications();

  const updatedNotifications = notifications.map(
    (notification) => ({
      ...notification,
      read: true,
    })
  );

  localStorage.setItem(
    "notifications",
    JSON.stringify(updatedNotifications)
  );

  return updatedNotifications;
};