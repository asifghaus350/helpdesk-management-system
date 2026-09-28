import { API_URL } from "../config";

// =========================
// SESSION HELPERS
// =========================

export const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("userPhoto");
};

// Merges fields into the stored user and tells the navbar /
// sidebar to re-read it. The profile photo (a base64 string
// that can be several MB) is kept under its own key, so a
// photo too big for localStorage never breaks saving the
// rest of the user.
export const updateStoredUser = (fields = {}) => {
  const { profilePhoto, ...rest } = fields;

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

  if (ticket.engineerId) {
    const assignedId =
      ticket.engineerId._id || ticket.engineerId;

    return String(assignedId) === String(user.id || user._id);
  }

  return (
    !!ticket.engineer &&
    ticket.engineer.trim().toLowerCase() ===
      (user.name || "").trim().toLowerCase()
  );
};

// Admin: any ticket. Engineer: tickets assigned to them.
export const canEditTicket = (ticket, user) =>
  user?.role === "Admin" ||
  (user?.role === "Engineer" && isAssignedToUser(ticket, user));

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
};
