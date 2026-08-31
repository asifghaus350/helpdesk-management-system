import { useEffect, useState } from "react";

import {
  Search,
  Settings,
  UserCircle,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import NotificationDropdown from "../common/NotificationDropdown";

function Navbar() {
  const navigate = useNavigate();

  // =========================
  // LOGGED-IN USER
  // =========================

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");

      return savedUser
        ? JSON.parse(savedUser)
        : null;
    } catch (error) {
      console.error("Invalid user data:", error);
      return null;
    }
  });

  // =========================
  // THEME
  // =========================

  const [theme, setTheme] = useState(() => {
    try {
      const savedSettings =
        localStorage.getItem("settings");

      if (savedSettings) {
        const parsedSettings =
          JSON.parse(savedSettings);

        return parsedSettings.theme || "light";
      }

      return "light";
    } catch (error) {
      console.error(
        "Invalid settings data:",
        error
      );

      return "light";
    }
  });

  // =========================
  // SETTINGS + USER CHANGE
  // =========================

  useEffect(() => {
    const handleSettingsChange = () => {
      try {
        const savedSettings =
          localStorage.getItem("settings");

        if (savedSettings) {
          const parsedSettings =
            JSON.parse(savedSettings);

          setTheme(
            parsedSettings.theme || "light"
          );
        }
      } catch (error) {
        console.error(
          "Settings update error:",
          error
        );
      }
    };

    const handleUserChange = () => {
      try {
        const savedUser =
          localStorage.getItem("user");

        setUser(
          savedUser
            ? JSON.parse(savedUser)
            : null
        );
      } catch (error) {
        console.error(
          "User update error:",
          error
        );

        setUser(null);
      }
    };

    window.addEventListener(
      "settingsChanged",
      handleSettingsChange
    );

    window.addEventListener(
      "userChanged",
      handleUserChange
    );

    return () => {
      window.removeEventListener(
        "settingsChanged",
        handleSettingsChange
      );

      window.removeEventListener(
        "userChanged",
        handleUserChange
      );
    };
  }, []);

  const isDark = theme === "dark";

  // =========================
  // USER DISPLAY DATA
  // =========================

  const userName = user?.name || "User";
  const userRole = user?.role || "User";

  return (
    <header
      className={`h-21.5 px-8 flex items-center justify-between border-b transition-colors ${
        isDark
          ? "bg-slate-900 border-slate-700"
          : "bg-white border-slate-200"
      }`}
    >
      {/* =========================
          PAGE INFORMATION
      ========================= */}

      <div>
        <h1
          className={`text-2xl font-bold tracking-tight ${
            isDark
              ? "text-white"
              : "text-slate-800"
          }`}
        >
          Dashboard
        </h1>

        <p
          className={`text-sm mt-1 ${
            isDark
              ? "text-slate-400"
              : "text-slate-500"
          }`}
        >
          Welcome back, {userName} 👋
        </p>
      </div>

      {/* =========================
          RIGHT SECTION
      ========================= */}

      <div className="flex items-center gap-4">

        {/* =========================
            SEARCH
        ========================= */}

        <div className="relative">
          <Search
            size={18}
            className={`absolute left-4 top-1/2 -translate-y-1/2 ${
              isDark
                ? "text-slate-400"
                : "text-slate-400"
            }`}
          />

          <input
            type="text"
            placeholder="Search..."
            className={`w-80 h-12 pl-11 pr-4 rounded-xl border outline-none transition ${
              isDark
                ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus:border-blue-500"
                : "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-400"
            }`}
          />
        </div>

        {/* =========================
            NOTIFICATIONS
        ========================= */}

        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition ${
            isDark
              ? "hover:bg-slate-800"
              : "hover:bg-slate-100"
          }`}
        >
          <NotificationDropdown />
        </div>

        {/* =========================
            SETTINGS
        ========================= */}

        <button
          type="button"
          onClick={() => navigate("/settings")}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition ${
            isDark
              ? "text-slate-300 hover:bg-slate-800 hover:text-white"
              : "text-slate-600 hover:bg-slate-100 hover:text-blue-600"
          }`}
        >
          <Settings size={21} />
        </button>

        {/* =========================
            PROFILE
        ========================= */}

        <button
          type="button"
          onClick={() => navigate("/profile")}
          className={`flex items-center gap-3 pl-3 pr-2 py-2 rounded-xl transition ${
            isDark
              ? "hover:bg-slate-800"
              : "hover:bg-slate-50"
          }`}
        >
          <UserCircle
            size={38}
            className="text-blue-600"
          />

          <div className="text-left">
            <p
              className={`font-semibold text-sm ${
                isDark
                  ? "text-white"
                  : "text-slate-800"
              }`}
            >
              {userName}
            </p>

            <p
              className={`text-xs mt-0.5 ${
                isDark
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              {userRole}
            </p>
          </div>
        </button>

      </div>
    </header>
  );
}

export default Navbar;