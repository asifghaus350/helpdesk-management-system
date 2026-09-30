import { useEffect, useState } from "react";

import {
  Search,
  Settings,
  UserCircle,
  Menu,
  X,
} from "lucide-react";

import { useLocation, useNavigate } from "react-router-dom";

import NotificationDropdown from "../common/NotificationDropdown";
import { getStoredUser, refreshStoredUser } from "../../utils/auth";

// =========================
// PAGE TITLES
// =========================

const pageTitles = [
  ["/dashboard", "Dashboard"],
  ["/tickets/create", "Create Ticket"],
  ["/tickets/edit", "Edit Ticket"],
  ["/tickets/", "Ticket Details"],
  ["/tickets", "Tickets"],
  ["/users", "Users"],
  ["/reports", "Reports"],
  ["/profile", "Profile"],
  ["/settings", "Settings"],
];

const getPageTitle = (pathname) =>
  pageTitles.find(([path]) => pathname.startsWith(path))?.[1] ||
  "HelpDesk";

function Navbar({ isMenuOpen = false, onMenuClick = () => {} }) {
  const navigate = useNavigate();
  const location = useLocation();

  const pageTitle = getPageTitle(location.pathname);

  // =========================
  // GLOBAL SEARCH
  // =========================

  const [searchText, setSearchText] = useState("");

  // Phones: search opens as a full-width row under the header
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();

    setMobileSearchOpen(false);

    const query = searchText.trim();

    navigate(
      query
        ? `/tickets?search=${encodeURIComponent(query)}`
        : "/tickets"
    );
  };

  // =========================
  // LOGGED-IN USER
  // =========================

  const [user, setUser] = useState(getStoredUser);

  // Pick up role / name changes made by an admin
  useEffect(() => {
    refreshStoredUser();
  }, []);

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
      setUser(getStoredUser());
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
      className={`sticky top-0 z-30 border-b transition-colors ${
        isDark
          ? "bg-slate-900 border-slate-700"
          : "bg-white border-slate-200"
      }`}
    >
    <div className="h-16 lg:h-21.5 px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-3">

      {/* =========================
          MENU BUTTON (mobile)
      ========================= */}

      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        aria-controls="app-sidebar"
        aria-expanded={isMenuOpen}
        className={`lg:hidden w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition ${
          isDark
            ? "text-slate-300 hover:bg-slate-800"
            : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        <Menu size={22} />
      </button>

      {/* =========================
          PAGE INFORMATION
      ========================= */}

      <div className="min-w-0 flex-1">
        <h1
          className={`text-lg sm:text-xl lg:text-2xl font-bold tracking-tight truncate ${
            isDark
              ? "text-white"
              : "text-slate-800"
          }`}
        >
          {pageTitle}
        </h1>

        <p
          className={`hidden sm:block text-sm mt-1 truncate ${
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

      <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 shrink-0">

        {/* =========================
            SEARCH
        ========================= */}

        <form
          onSubmit={handleSearch}
          className="relative hidden md:block"
          role="search"
        >
          <Search
            size={18}
            className={`absolute left-4 top-1/2 -translate-y-1/2 ${
              isDark
                ? "text-slate-400"
                : "text-slate-400"
            }`}
          />

          <input
            type="search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search tickets..."
            aria-label="Search tickets"
            className={`w-56 lg:w-72 xl:w-80 h-11 lg:h-12 pl-11 pr-4 rounded-xl border outline-none transition ${
              isDark
                ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus:border-blue-500"
                : "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-400"
            }`}
          />
        </form>

        {/* Search button (phones) */}

        <button
          type="button"
          onClick={() => setMobileSearchOpen((open) => !open)}
          aria-label={mobileSearchOpen ? "Close search" : "Search tickets"}
          aria-expanded={mobileSearchOpen}
          className={`md:hidden w-10 h-10 rounded-xl flex items-center justify-center transition ${
            isDark
              ? "text-slate-300 hover:bg-slate-800"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {mobileSearchOpen ? <X size={20} /> : <Search size={20} />}
        </button>

        {/* =========================
            NOTIFICATIONS
        ========================= */}

        <div
          className={`w-10 h-10 lg:w-11 lg:h-11 rounded-xl flex items-center justify-center transition ${
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
          aria-label="Settings"
          className={`hidden sm:flex w-10 h-10 lg:w-11 lg:h-11 rounded-xl items-center justify-center transition ${
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
          aria-label="Open profile"
          className={`flex items-center gap-3 p-1 sm:pl-3 sm:pr-2 sm:py-2 rounded-xl transition ${
            isDark
              ? "hover:bg-slate-800"
              : "hover:bg-slate-50"
          }`}
        >
          {user?.profilePhoto ? (
  <img
    src={user.profilePhoto}
    referrerPolicy="no-referrer"
    alt="Profile"
    className="w-9 h-9 lg:w-10 lg:h-10 rounded-full object-cover border-2 border-blue-100"
  />
) : (
  <UserCircle
    size={38}
    className="text-blue-600"
  />
)}

          <div className="hidden lg:block text-left">
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
    </div>

      {/* =========================
          MOBILE SEARCH ROW
      ========================= */}

      {mobileSearchOpen && (
        <form
          onSubmit={handleSearch}
          role="search"
          className="md:hidden px-3 sm:px-6 pb-3"
        >
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search tickets..."
              aria-label="Search tickets"
              autoFocus
              className={`w-full h-11 pl-10 pr-4 rounded-xl border outline-none transition ${
                isDark
                  ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus:border-blue-500"
                  : "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-400"
              }`}
            />
          </div>
        </form>
      )}
    </header>
  );
}

export default Navbar;