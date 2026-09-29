import { useEffect, useState } from "react";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

function Layout({ children }) {
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem("settings");

    if (savedSettings) {
      return JSON.parse(savedSettings);
    }

    return {
      compactMode: false,
      theme: "light",
    };
  });

  useEffect(() => {
    const handleSettingsChange = () => {
      const savedSettings = localStorage.getItem("settings");

      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
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

  const isDark = settings.theme === "dark";

  // =========================
  // MOBILE SIDEBAR DRAWER
  // =========================

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!sidebarOpen) return undefined;

    // Esc closes the drawer
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };

    // Growing to desktop width closes it (sidebar is always shown there)
    const desktop = window.matchMedia("(min-width: 1024px)");
    const handleResize = (e) => {
      if (e.matches) setSidebarOpen(false);
    };

    // Stop the page behind the drawer from scrolling
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", handleKeyDown);
    desktop.addEventListener("change", handleResize);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      desktop.removeEventListener("change", handleResize);
    };
  }, [sidebarOpen]);

  return (
    <div
      className={`min-h-screen flex ${
        isDark
          ? "bg-slate-900 text-white"
          : "bg-[#f7f8fa] text-slate-800"
      }`}
    >
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Application Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Navbar */}
        <Navbar
          isMenuOpen={sidebarOpen}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Page Content */}
        <main
          className={`flex-1 min-w-0 transition-all duration-300 ${
            isDark
              ? "bg-slate-900 text-white"
              : "bg-[#f7f8fa] text-slate-800"
          } ${
            settings.compactMode
              ? "p-3 sm:p-4"
              : "p-4 sm:p-6 lg:p-8"
          }`}
        >
          <div className="w-full max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;