import { NavLink, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  Ticket,
  Users,
  User,
  FileText,
  LogOut,
} from "lucide-react";

function Sidebar() {
  const navigate = useNavigate();

  const menuItems = [
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

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login", { replace: true });
  };

  return (
    <aside className="w-[250px] min-h-screen bg-white border-r border-slate-200 flex flex-col sticky top-0">

      {/* Logo */}

      <div className="px-6 py-6 border-b border-slate-200">

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

      </div>

      {/* Navigation */}

      <nav className="flex-1 px-4 py-6">

        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-3">
          Menu
        </p>

        {menuItems.map((item) => {

          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
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
  );
}

export default Sidebar;