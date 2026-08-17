import { useEffect, useState } from "react";
import Layout from "../components/layout/Layout";

function Settings() {
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem("settings");

    if (savedSettings) {
      return JSON.parse(savedSettings);
    }

    const defaultSettings = {
      emailNotifications: true,
      ticketNotifications: true,
      userNotifications: true,
      compactMode: false,
      theme: "light",
    };

    localStorage.setItem(
      "settings",
      JSON.stringify(defaultSettings)
    );

    return defaultSettings;
  });

  // Apply saved theme when Settings page opens
  useEffect(() => {
    const theme = settings.theme || "light";

    document.documentElement.classList.toggle(
      "dark",
      theme === "dark"
    );
  }, [settings.theme]);

  // Handle checkbox changes
  const handleChange = (e) => {
    const { name, checked } = e.target;

    const updatedSettings = {
      ...settings,
      [name]: checked,
    };

    setSettings(updatedSettings);

    localStorage.setItem(
      "settings",
      JSON.stringify(updatedSettings)
    );

    window.dispatchEvent(
      new Event("settingsChanged")
    );
  };

  // Handle theme change
  const handleThemeChange = (e) => {
    const newTheme = e.target.value;

    const updatedSettings = {
      ...settings,
      theme: newTheme,
    };

    setSettings(updatedSettings);

    localStorage.setItem(
      "settings",
      JSON.stringify(updatedSettings)
    );

    document.documentElement.classList.toggle(
      "dark",
      newTheme === "dark"
    );

    window.dispatchEvent(
      new Event("settingsChanged")
    );
  };

  return (
    <Layout>

      {/* Heading */}

      <div className="mb-8">

        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
          Settings
        </h1>

        <p className="text-gray-500 dark:text-slate-400 mt-2">
          Manage your application preferences.
        </p>

      </div>

      {/* Settings Card */}

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-8">

        <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-6">
          Notification Settings
        </h2>

        <div className="space-y-6">

          {/* Email Notifications */}

          <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-600 pb-5">

            <div>

              <h3 className="font-medium text-slate-800 dark:text-white">
                Email Notifications
              </h3>

              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Receive important notifications through email.
              </p>

            </div>

            <input
              type="checkbox"
              name="emailNotifications"
              checked={settings.emailNotifications}
              onChange={handleChange}
              className="w-5 h-5 accent-blue-600"
            />

          </div>

          {/* Ticket Notifications */}

          <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-600 pb-5">

            <div>

              <h3 className="font-medium text-slate-800 dark:text-white">
                Ticket Notifications
              </h3>

              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Get notified when tickets are created or updated.
              </p>

            </div>

            <input
              type="checkbox"
              name="ticketNotifications"
              checked={settings.ticketNotifications}
              onChange={handleChange}
              className="w-5 h-5 accent-blue-600"
            />

          </div>

          {/* User Notifications */}

          <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-600 pb-5">

            <div>

              <h3 className="font-medium text-slate-800 dark:text-white">
                User Notifications
              </h3>

              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Get notified when users are added or updated.
              </p>

            </div>

            <input
              type="checkbox"
              name="userNotifications"
              checked={settings.userNotifications}
              onChange={handleChange}
              className="w-5 h-5 accent-blue-600"
            />

          </div>

          {/* Compact Mode */}

          <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-600 pb-5">

            <div>

              <h3 className="font-medium text-slate-800 dark:text-white">
                Compact Mode
              </h3>

              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Use a more compact interface layout.
              </p>

            </div>

            <input
              type="checkbox"
              name="compactMode"
              checked={settings.compactMode}
              onChange={handleChange}
              className="w-5 h-5 accent-blue-600"
            />

          </div>

        </div>

        {/* Appearance */}

        <div className="mt-10">

          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-6">
            Appearance
          </h2>

          {/* Theme */}

          <div className="flex items-center justify-between">

            <div>

              <h3 className="font-medium text-slate-800 dark:text-white">
                Theme
              </h3>

              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Choose how the application should appear.
              </p>

            </div>

            <select
              value={settings.theme || "light"}
              onChange={handleThemeChange}
              className="border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            >

              <option value="light">
                Light
              </option>

              <option value="dark">
                Dark
              </option>

            </select>

          </div>

        </div>

      </div>

    </Layout>
  );
}

export default Settings;