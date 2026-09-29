import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";

import { auth } from "../../firebase";
import { clearSession, getStoredUser } from "../../utils/auth";

import {
  LayoutDashboard,
  Ticket,
  Users,
  User,
  FileText,
  LogOut,
  X,
} from "lucide-react";

// Desktop (lg+): always visible, sticky column.
// Mobile: off-canvas drawer controlled by Layout (isOpen / onClose).
function Sidebar({ isOpen = false, onClose = () => {} }) {
  const navigate = useNavigate();

  const [user, setUser] = useState(getStoredUser);

  useEffect(() => {
    const handleUserChange = () => setUser(getStoredUser());

    window.addEventListener("userChanged", handleUserChange);

    return () =>
      window.removeEventListener(
        "userChanged",
        handleUserChange
      );
  }, []);

  const allMenuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Tickets",
      path: "/tickets",
      icon: Ticket,
    },
    {
      name: "Users",
      path: "/users",
      icon: Users,
      roles: ["Admin"],
    },
    {
      name: "Reports",
      path: "/reports",
      icon: FileText,
    },
    {
      name: "Profile",
      path: "/profile",
      icon: User,
    },
  ];

  // Hide items the current role cannot open
  const menuItems = allMenuItems.filter(
    (item) =>
      !item.roles || item.roles.includes(user?.role)
  );

  // Logout
  const handleLogout = async () => {
    clearSession();

    // End the Google session too, so the next Google
    // login asks which account to use.
    try {
      if (auth) await signOut(auth);
    } catch (error) {
      console.error("Firebase sign out error:", error);
    }

    navigate("/login", { replace: true });
  };

  return (
    <>
    {/* Backdrop (mobile only) */}

    <div
      aria-hidden="true"
      onClick={onClose}
      className={`fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${
        isOpen
          ? "opacity-100"
          : "opacity-0 pointer-events-none"
      }`}
    />

    <aside
      id="app-sidebar"
      aria-label="Main navigation"
      className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] h-dvh bg-white border-r border-slate-200 flex flex-col shadow-2xl transition-transform duration-300 lg:sticky lg:top-0 lg:z-auto lg:w-62.5 lg:max-w-none lg:h-screen lg:shadow-none lg:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >

      {/* Logo */}

      <div className="px-6 py-6 border-b border-slate-200 flex items-center justify-between gap-3">

        <div className="flex items-center gap-3">

          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">

            <Ticket
              size={22}
              className="text-blue-600"
            />

          </div>

          <div>

            <h1 className="text-xl font-bold text-slate-800">
              HelpDesk
            </h1>

            <p className="text-xs text-slate-500 mt-1">
              Ticket Management
            </p>

          </div>

        </div>

        {/* Close (mobile only) */}

        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          <X size={20} />
        </button>

      </div>

      {/* Navigation */}

      <nav className="flex-1 overflow-y-auto px-4 py-6">

        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-3">
          Menu
        </p>

        {menuItems.map((item) => {

          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all duration-200 ${
                  isActive
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                }`
              }
            >

              <Icon size={20} />

              <span>
                {item.name}
              </span>

            </NavLink>
          );

        })}

      </nav>

      {/* Logout */}

      <div className="p-4 border-t border-slate-200">

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-500 transition"
        >

          <LogOut size={20} />

          <span>
            Logout
          </span>

        </button>

      </div>

    </aside>
    </>
  );
}

export default Sidebar;