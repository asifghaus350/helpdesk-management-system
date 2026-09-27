import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sun,
  Moon,
  Bell,
  Mail,
  Ticket,
  Users,
  LayoutGrid,
  Palette,
  CheckCircle,
  RotateCcw,
  User,
  KeyRound,
  ChevronRight,
} from "lucide-react";

import Layout from "../components/layout/Layout";

const DEFAULT_SETTINGS = {
  emailNotifications: true,
  ticketNotifications: true,
  userNotifications: true,
  compactMode: false,
  theme: "light",
};

const notificationOptions = [
  {
    name: "ticketNotifications",
    title: "Ticket notifications",
    description: "Get notified when tickets are created or updated.",
    icon: Ticket,
    tile: "bg-blue-50 text-blue-600",
  },
  {
    name: "userNotifications",
    title: "User notifications",
    description: "Get notified when users are added, updated or removed.",
    icon: Users,
    tile: "bg-emerald-50 text-emerald-600",
  },
  {
    name: "emailNotifications",
    title: "Email notifications",
    description: "Receive important updates by email.",
    icon: Mail,
    tile: "bg-violet-50 text-violet-600",
    // No email is sent yet; the choice is stored for when it is.
    badge: "Coming soon",
  },
];

const themeOptions = [
  {
    value: "light",
    label: "Light",
    icon: Sun,
    preview: {
      page: "#f7f8fa",
      card: "#ffffff",
      line: "#e2e8f0",
      text: "#cbd5e1",
    },
  },
  {
    value: "dark",
    label: "Dark",
    icon: Moon,
    preview: {
      page: "#0f172a",
      card: "#1e293b",
      line: "#334155",
      text: "#475569",
    },
  },
];

// =========================
// SWITCH
// =========================

function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
        checked ? "bg-blue-600" : "bg-slate-300"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform no-dark ${
          checked ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}

// =========================
// SECTION CARD
// =========================

function SettingsSection({ icon: Icon, title, description, children }) {
  return (
    <section className="bg-white border border-slate-200 rounded-2xl shadow-sm">
      <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-slate-100">
        <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
          <Icon size={18} />
        </div>

        <div>
          <h2 className="text-base font-semibold text-slate-800">
            {title}
          </h2>

          <p className="text-sm text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <div className="px-5 sm:px-6 py-2">{children}</div>
    </section>
  );
}

function Settings() {
  const navigate = useNavigate();

  const [settings, setSettings] = useState(() => {
    try {
      const savedSettings = JSON.parse(
        localStorage.getItem("settings")
      );

      if (savedSettings) {
        return { ...DEFAULT_SETTINGS, ...savedSettings };
      }
    } catch {
      // Fall through to defaults
    }

    localStorage.setItem(
      "settings",
      JSON.stringify(DEFAULT_SETTINGS)
    );

    return DEFAULT_SETTINGS;
  });

  const [showSaved, setShowSaved] = useState(false);
  const savedTimer = useRef(null);

  // Apply saved theme when Settings page opens
  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      settings.theme === "dark"
    );
  }, [settings.theme]);

  useEffect(
    () => () => clearTimeout(savedTimer.current),
    []
  );

  // =========================
  // SAVE (every change saves immediately)
  // =========================

  const saveSettings = (updatedSettings) => {
    setSettings(updatedSettings);

    localStorage.setItem(
      "settings",
      JSON.stringify(updatedSettings)
    );

    document.documentElement.classList.toggle(
      "dark",
      updatedSettings.theme === "dark"
    );

    window.dispatchEvent(new Event("settingsChanged"));

    // Brief "Saved" confirmation
    setShowSaved(true);
    clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setShowSaved(false), 2000);
  };

  const updateSetting = (name, value) =>
    saveSettings({ ...settings, [name]: value });

  const isDefault = Object.keys(DEFAULT_SETTINGS).every(
    (key) => settings[key] === DEFAULT_SETTINGS[key]
  );

  return (
    <Layout>

      {/* =========================
          HEADER
      ========================= */}

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">
            Settings
          </h1>

          <p className="text-slate-500 mt-2">
            Manage your appearance and notification preferences.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            aria-live="polite"
            className={`inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 transition-opacity ${
              showSaved ? "opacity-100" : "opacity-0"
            }`}
          >
            <CheckCircle size={16} />
            Saved
          </span>

          <button
            type="button"
            onClick={() => saveSettings(DEFAULT_SETTINGS)}
            disabled={isDefault}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <RotateCcw size={16} />
            Reset to defaults
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">

        <div className="space-y-6 min-w-0">

          {/* =========================
              APPEARANCE
          ========================= */}

          <SettingsSection
            icon={Palette}
            title="Appearance"
            description="Choose how HelpDesk looks for you."
          >
            <div className="py-4">
              <p className="text-sm font-semibold text-slate-700 mb-3">
                Theme
              </p>

              <div
                role="radiogroup"
                aria-label="Theme"
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = settings.theme === option.value;
                  const colors = option.preview;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => updateSetting("theme", option.value)}
                      className={`text-left rounded-xl border-2 p-3 transition ${
                        isSelected
                          ? "border-blue-500 ring-4 ring-blue-100"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {/* Mini preview of the app in this theme */}

                      <div
                        className="no-dark rounded-lg p-2.5 flex gap-2 h-24 overflow-hidden"
                        style={{ backgroundColor: colors.page }}
                        aria-hidden="true"
                      >
                        <div
                          className="w-1/4 rounded-md p-1.5 space-y-1.5"
                          style={{ backgroundColor: colors.card }}
                        >
                          <div className="h-1.5 rounded-full bg-blue-500 w-3/4" />
                          <div className="h-1.5 rounded-full" style={{ backgroundColor: colors.line }} />
                          <div className="h-1.5 rounded-full" style={{ backgroundColor: colors.line }} />
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="h-8 rounded-md bg-linear-to-r from-blue-600 to-indigo-600" />

                          <div className="grid grid-cols-3 gap-1.5">
                            {[1, 2, 3].map((item) => (
                              <div
                                key={item}
                                className="h-7 rounded-md p-1.5"
                                style={{ backgroundColor: colors.card }}
                              >
                                <div className="h-1.5 w-2/3 rounded-full" style={{ backgroundColor: colors.text }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                          <Icon size={16} />
                          {option.label}
                        </span>

                        <span
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? "border-blue-600 bg-blue-600"
                              : "border-slate-300"
                          }`}
                        >
                          {isSelected && (
                            <span className="no-dark w-2 h-2 rounded-full bg-white" />
                          )}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 py-4 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <LayoutGrid size={18} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Compact mode
                  </p>

                  <p className="text-sm text-slate-500">
                    Less padding around pages, so more fits on screen.
                  </p>
                </div>
              </div>

              <Switch
                checked={settings.compactMode}
                onChange={(value) => updateSetting("compactMode", value)}
                label="Compact mode"
              />
            </div>
          </SettingsSection>

          {/* =========================
              NOTIFICATIONS
          ========================= */}

          <SettingsSection
            icon={Bell}
            title="Notifications"
            description="Decide what you want to hear about."
          >
            <ul className="divide-y divide-slate-100">
              {notificationOptions.map((option) => {
                const Icon = option.icon;

                return (
                  <li
                    key={option.name}
                    className="flex items-center justify-between gap-4 py-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${option.tile}`}
                      >
                        <Icon size={18} />
                      </div>

                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-800">
                          {option.title}

                          {option.badge && (
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold uppercase">
                              {option.badge}
                            </span>
                          )}
                        </p>

                        <p className="text-sm text-slate-500">
                          {option.description}
                        </p>
                      </div>
                    </div>

                    <Switch
                      checked={Boolean(settings[option.name])}
                      onChange={(value) => updateSetting(option.name, value)}
                      label={option.title}
                    />
                  </li>
                );
              })}
            </ul>
          </SettingsSection>
        </div>

        {/* =========================
            SIDE PANEL
        ========================= */}

        <aside className="space-y-6 xl:sticky xl:top-6">
          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-2">
            <p className="px-3 pt-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Account
            </p>

            {[
              {
                label: "Edit profile",
                description: "Name, email and photo",
                icon: User,
              },
              {
                label: "Change password",
                description: "Keep your account secure",
                icon: KeyRound,
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate("/profile")}
                  className="group w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-slate-50 transition"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <Icon size={17} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {item.label}
                    </p>

                    <p className="text-xs text-slate-500">
                      {item.description}
                    </p>
                  </div>

                  <ChevronRight
                    size={17}
                    className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition"
                  />
                </button>
              );
            })}
          </section>

          <p className="px-1 text-xs text-slate-500 leading-relaxed">
            Settings are saved on this device as soon as you change them.
          </p>
        </aside>

      </div>

    </Layout>
  );
}

export default Settings;
