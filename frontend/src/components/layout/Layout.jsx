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

  return (
    <div
      className={`min-h-screen flex ${
        isDark
          ? "bg-slate-900 text-white"
          : "bg-[#f7f8fa] text-slate-800"
      }`}
    >
      {/* Sidebar */}
      <Sidebar />

      {/* Main Application Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Navbar */}
        <Navbar />

        {/* Page Content */}
        <main
          className={`flex-1 min-w-0 transition-all duration-300 ${
            isDark
              ? "bg-slate-900 text-white"
              : "bg-[#f7f8fa] text-slate-800"
          } ${
            settings.compactMode
              ? "p-4"
              : "p-6 lg:p-8"
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