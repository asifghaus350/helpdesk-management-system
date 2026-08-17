import {
  Plus,
  Users,
  FileText,
  Settings,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      title: "Create Ticket",
      icon: <Plus size={22} />,
      color: "bg-blue-500",
      path: "/tickets/create",
    },
    {
      title: "Manage Users",
      icon: <Users size={22} />,
      color: "bg-green-500",
      path: "/users",
    },
    {
      title: "Reports",
      icon: <FileText size={22} />,
      color: "bg-yellow-500",
      path: "/reports",
    },
    {
      title: "Settings",
      icon: <Settings size={22} />,
      color: "bg-purple-500",
      path: "/settings",
    },
  ];

  return (
    <div>
      {/* Heading */}

      <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-6">
        Quick Actions
      </h2>

      {/* Actions */}

      <div className="grid grid-cols-2 gap-4">
        {actions.map((item, index) => (
          <button
            key={index}
            onClick={() => navigate(item.path)}
            className={`${item.color} text-white rounded-xl p-5 flex items-center gap-3 hover:scale-105 transition`}
          >
            {item.icon}

            <span>{item.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default QuickActions;