import { API_URL } from "../config";

// =========================
// SESSION HELPERS
// =========================

// Written only for a real logout / password change. Plain re-login
// clears the same keys but must not kick other tabs off their pages.
export const LOGOUT_SIGNAL_KEY = "hd_logout_signal";

export const clearSession = ({ broadcast = true } = {}) => {
  const hadToken = Boolean(localStorage.getItem("token"));

  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("userPhoto");

  if (broadcast && hadToken) {
    localStorage.setItem(LOGOUT_SIGNAL_KEY, String(Date.now()));
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("userChanged"));
  }
};

// Merges fields into the stored user and tells the navbar /
// sidebar to re-read it. The profile photo (a base64 string
// that can be several MB) is kept under its own key, so a
// photo too big for localStorage never breaks saving the
// rest of the user.
// =========================
// SETTINGS (theme, compact mode, notification switches)
// =========================
// Saved on the account (server) and cached in localStorage so the
// layout can apply the theme instantly on the next page load.

const SETTING_KEYS = [
  "theme",
  "compactMode",
  "ticketNotifications",
  "userNotifications",
  "emailNotifications",
];

export const applySettingsLocally = (settings) => {
  let current;

  try {
    current = JSON.parse(localStorage.getItem("settings")) || {};
  } catch {
    current = {};
  }

  const next = { ...current };

  SETTING_KEYS.forEach((key) => {
    if (settings[key] !== undefined) next[key] = settings[key];
  });

  localStorage.setItem("settings", JSON.stringify(next));

  document.documentElement.classList.toggle(
    "dark",
    next.theme === "dark"
  );

  window.dispatchEvent(new Event("settingsChanged"));

  return next;
};

// Saves settings to the account. Returns the saved preferences.
// Only the keys passed in are sent. A failed toggle then leaves the
// other switches untouched on the server too, not just on screen.
export const saveSettingsToServer = async (changes) => {
  const body = {};

  SETTING_KEYS.forEach((key) => {
    if (changes[key] !== undefined) body[key] = changes[key];
  });

  const response = await fetch(
    `${API_URL}/api/users/profile/preferences`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(body),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Could not save settings");
  }

  return data.preferences;
};

export const updateStoredUser = (fields = {}) => {
  const { profilePhoto, ...rest } = fields;

  // Account settings from the server win over this browser's cache
  if (rest.preferences) {
    applySettingsLocally(rest.preferences);
  }

  let current;

  try {
    current = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    current = {};
  }

  delete current.profilePhoto;

  localStorage.setItem(
    "user",
    JSON.stringify({ ...current, ...rest })
  );

  if (profilePhoto !== undefined) {
    try {
      if (profilePhoto) {
        localStorage.setItem("userPhoto", profilePhoto);
      } else {
        localStorage.removeItem("userPhoto");
      }
    } catch {
      // Too large for localStorage — the photo is still saved
      // on the server; the navbar just shows the default icon.
      localStorage.removeItem("userPhoto");
    }
  }

  window.dispatchEvent(new Event("userChanged"));
};

// Reads the "exp" claim of a JWT without verifying it.
// Verification is the backend's job — this only lets the
// client notice an expired token before calling the API.
export const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(
      atob(
        token
          .split(".")[1]
          .replace(/-/g, "+")
          .replace(/_/g, "/")
      )
    );

    return !payload.exp || payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

// =========================
// CURRENT USER + PERMISSIONS
// =========================
// Mirrors the backend rules so the UI only offers actions
// the API will accept. The backend still enforces them.

export const getStoredUser = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (!user) return null;

    return {
      ...user,
      profilePhoto:
        localStorage.getItem("userPhoto") ||
        user.profilePhoto ||
        "",
    };
  } catch {
    return null;
  }
};

// Re-reads the account from the API so role / name changes
// made by an admin show up without logging in again.
export const refreshStoredUser = async () => {
  const token = localStorage.getItem("token");

  if (!token) return;

  try {
    const response = await fetch(
      `${API_URL}/api/auth/me`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.ok) return;

    const data = await response.json();

    if (data.user) {
      updateStoredUser(data.user);
    }
  } catch {
    // Offline or server down — keep the cached user
  }
};

export const isUnassignedTicket = (ticket) =>
  !ticket?.engineerId && !ticket?.engineer;

export const isAssignedToUser = (ticket, user) => {
  if (!ticket || !user) return false;

  // By id only, matching the backend
  if (!ticket.engineerId) return false;

  const assignedId =
    ticket.engineerId._id || ticket.engineerId;

  return String(assignedId) === String(user.id || user._id);
};

// Admin: any ticket. Engineer: tickets assigned to them.
export const canEditTicket = (ticket, user) =>
  user?.role === "Admin" ||
  (user?.role === "Engineer" && isAssignedToUser(ticket, user));

// Gate for the Edit Ticket page. Called as soon as the ticket loads so
// a User (or an Engineer with someone else's ticket) is sent back to
// the ticket page before the form can be filled in and saved.
export const canOpenEditPage = (ticket, user) =>
  Boolean(ticket) && canEditTicket(ticket, user);

export const canDeleteTicket = (user) =>
  user?.role === "Admin";

// Engineers can pick up tickets nobody is working on
export const canAssignToSelf = (ticket, user) =>
  user?.role === "Engineer" && isUnassignedTicket(ticket);

// =========================
// GLOBAL 401 HANDLER
// =========================
// Every page uses fetch() directly, so wrap it once:
// when an authenticated API call returns 401, the token
// is expired or invalid — clear it and go to login.

export const installAuthInterceptor = () => {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const response = await originalFetch(input, init);

    const url =
      typeof input === "string" ? input : input?.url || "";

    const isAuthEndpoint =
      url.includes("/api/auth/login") ||
      url.includes("/api/auth/google");

    if (
      response.status === 401 &&
      !isAuthEndpoint &&
      localStorage.getItem("token")
    ) {
      clearSession();

      if (window.location.pathname !== "/login") {
        window.location.replace("/login?expired=1");
      }
    }

    return response;
  };

  // localStorage is shared by every tab, but React state is not.
  // The "storage" event is how the other tabs hear about a logout,
  // a login as a different user, or a settings change.
  window.addEventListener("storage", (event) => {
    if (event.key === "token") {
      // Another tab logged in, logged out or refreshed its token.
      window.dispatchEvent(new Event("userChanged"));
    }

    if (event.key === LOGOUT_SIGNAL_KEY && event.newValue) {
      // Real logout / password change: let ProtectedRoute send
      // protected pages to /login after the reload.
      window.location.reload();
    }

    if (event.key === "user") {
      window.dispatchEvent(new Event("userChanged"));
    }

    if (event.key === "settings") {
      window.dispatchEvent(new Event("settingsChanged"));

      // The dark class lives on <html>, outside React. Apply it here
      // too, so a theme change in another tab is visible immediately.
      try {
        const saved = JSON.parse(event.newValue || "{}");
        document.documentElement.classList.toggle(
          "dark",
          saved.theme === "dark"
        );
      } catch {
        // Ignore unreadable settings
      }
    }
  });
};
