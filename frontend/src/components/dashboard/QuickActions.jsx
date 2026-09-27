import {
  Plus,
  Users,
  FileText,
  Settings,
  List,
  ChevronRight,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

function QuickActions({ userRole = "User" }) {
  const navigate = useNavigate();

  const actions = [
    {
      title: "Create Ticket",
      description: "Raise a new support request",
      icon: Plus,
      color: "bg-blue-50 text-blue-600",
      path: "/tickets/create",
    },
    {
      title: "All Tickets",
      description: "Browse and filter tickets",
      icon: List,
      color: "bg-indigo-50 text-indigo-600",
      path: "/tickets",
    },
    {
      title: "Manage Users",
      description: "Roles, access and accounts",
      icon: Users,
      color: "bg-emerald-50 text-emerald-600",
      path: "/users",
      roles: ["Admin"],
    },
    {
      title: "Reports",
      description: "Insights and ticket trends",
      icon: FileText,
      color: "bg-amber-50 text-amber-600",
      path: "/reports",
    },
    {
      title: "Settings",
      description: "Theme and preferences",
      icon: Settings,
      color: "bg-purple-50 text-purple-600",
      path: "/settings",
    },
  ].filter(
    (action) =>
      !action.roles ||
      action.roles.includes(userRole)
  );

  return (
    <div>
      {/* Heading */}

      <h2 className="text-lg font-semibold text-slate-800 mb-4">
        Quick Actions
      </h2>

      {/* Actions */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {actions.slice(0, 4).map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className="group bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 text-left shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200"
            >
              <div
                className={`${item.color} w-11 h-11 rounded-xl flex items-center justify-center shrink-0`}
              >
                <Icon size={20} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">
                  {item.title}
                </p>

                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {item.description}
                </p>
              </div>

              <ChevronRight
                size={18}
                className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default QuickActions;
