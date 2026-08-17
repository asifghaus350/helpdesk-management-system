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

  const [theme, setTheme] = useState(() => {
    const savedSettings = localStorage.getItem("settings");

    if (savedSettings) {
      return JSON.parse(savedSettings).theme || "light";
    }

    return "light";
  });

  useEffect(() => {
    const handleSettingsChange = () => {
      const savedSettings = localStorage.getItem("settings");

      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);

        setTheme(parsedSettings.theme || "light");
      }
    };

    window.addEventListener(
      "settingsChanged",
      handleSettingsChange
    );

    return () => {
      window.removeEventListener(
        "settingsChanged",
        handleSettingsChange
      );
    };
  }, []);

  const isDark = theme === "dark";

  return (
    <header
      className={`h-[86px] px-8 flex items-center justify-between border-b transition-colors ${
        isDark
          ? "bg-slate-900 border-slate-700"
          : "bg-white border-slate-200"
      }`}
    >
      {/* Page Information */}
      <div>
        <h1
          className={`text-2xl font-bold tracking-tight ${
            isDark ? "text-white" : "text-slate-800"
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
          Welcome back, Admin 👋
        </p>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">

        {/* Search */}
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

        {/* Notifications */}
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition ${
            isDark
              ? "hover:bg-slate-800"
              : "hover:bg-slate-100"
          }`}
        >
          <NotificationDropdown />
        </div>

        {/* Settings */}
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

        {/* Profile */}
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
              Admin
            </p>

            <p
              className={`text-xs mt-0.5 ${
                isDark
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              Administrator
            </p>
          </div>
        </button>

      </div>
    </header>
  );
}

export default Navbar;