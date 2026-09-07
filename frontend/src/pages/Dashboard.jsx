import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../components/layout/Layout";
import DashboardCard from "../components/dashboard/DashboardCard";
import RecentTickets from "../components/dashboard/RecentTickets";
import QuickActions from "../components/dashboard/QuickActions";

import {
  Ticket,
  CircleAlert,
  LoaderCircle,
  CheckCircle,
  ArrowUpRight,
} from "lucide-react";

function Dashboard() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================
  // GET CURRENT USER
  // =========================

 const storedUser = localStorage.getItem("user");

let userRole = "User";

try {
  const parsedUser = storedUser
    ? JSON.parse(storedUser)
    : null;

  userRole = parsedUser?.role || "User";
} catch (error) {
  console.error("User data parse error:", error);
}

  // =========================
  // ROLE BASED CONTENT
  // =========================

  const dashboardContent = {
    Admin: {
      label: "System Overview",
      description:
        "Monitor and manage all support tickets across the system.",
    },

    Engineer: {
      label: "My Assigned Tickets",
      description:
        "Monitor tickets currently assigned to you and track their progress.",
    },

    User: {
      label: "My Tickets",
      description:
        "Track the support tickets you have created and their current status.",
    },
  };

  const roleContent =
    dashboardContent[userRole] ||
    dashboardContent.User;

  // =========================
  // FETCH TICKETS
  // =========================

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch(
          "http://localhost:5000/api/tickets",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to fetch dashboard data"
          );
        }

        setTickets(data.tickets || []);
      } catch (error) {
        console.error(
          "Dashboard tickets error:",
          error
        );

        setError(
          error.message ||
            "Unable to load dashboard data."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [navigate]);

  // =========================
  // TICKET COUNTS
  // =========================

  const totalTickets = tickets.length;

  const openTickets = tickets.filter(
    (ticket) => ticket.status === "Open"
  ).length;

  const inProgressTickets = tickets.filter(
    (ticket) => ticket.status === "In Progress"
  ).length;

  const closedTickets = tickets.filter(
    (ticket) => ticket.status === "Closed"
  ).length;

  // =========================
  // DASHBOARD CARDS
  // =========================

  const cards = [
    {
      title: "Total Tickets",
      count: totalTickets,
      color: "bg-blue-50",
      iconColor: "text-blue-600",
      icon: Ticket,
    },
    {
      title: "Open Tickets",
      count: openTickets,
      color: "bg-red-50",
      iconColor: "text-red-600",
      icon: CircleAlert,
    },
    {
      title: "In Progress",
      count: inProgressTickets,
      color: "bg-amber-50",
      iconColor: "text-amber-600",
      icon: LoaderCircle,
    },
    {
      title: "Closed",
      count: closedTickets,
      color: "bg-emerald-50",
      iconColor: "text-emerald-600",
      icon: CheckCircle,
    },
  ];

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <Layout>
        <div className="bg-white rounded-2xl shadow-md p-10 text-center text-gray-500">
          Loading dashboard...
        </div>
      </Layout>
    );
  }

  // =========================
  // DASHBOARD
  // =========================

  return (
    <Layout>
      {/* =========================
          ERROR
      ========================= */}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* =========================
          DASHBOARD HEADER
      ========================= */}

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <p className="text-sm font-medium text-blue-600 mb-2">
            {roleContent.label}
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-800">
            Dashboard
          </h1>

          <p className="text-slate-500 mt-2">
            {roleContent.description}
          </p>
        </div>

        <div className="text-sm text-slate-500">
          {userRole === "Admin"
            ? "Total system tickets:"
            : "Your tickets:"}{" "}
          <span className="font-semibold text-slate-700">
            {totalTickets}
          </span>
        </div>
      </div>

      {/* =========================
          STATISTICS CARDS
      ========================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map((card, index) => (
          <DashboardCard
            key={index}
            title={card.title}
            count={card.count}
            color={card.color}
            icon={card.icon}
            iconColor={card.iconColor}
          />
        ))}
      </div>

      {/* =========================
          MAIN DASHBOARD CONTENT
      ========================= */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
        {/* =========================
            RECENT TICKETS
        ========================= */}

        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                Recent Tickets
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                {userRole === "Admin"
                  ? "Latest support activity across the system"
                  : "Latest activity from your tickets"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/tickets")}
              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View all
              <ArrowUpRight size={16} />
            </button>
          </div>

          <div className="p-6">
            <RecentTickets tickets={tickets} />
          </div>
        </div>

        {/* =========================
            TICKET OVERVIEW
        ========================= */}

        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-800">
              Ticket Overview
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Current ticket distribution
            </p>
          </div>

          <div className="space-y-5">
            {/* OPEN */}

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">
                  Open
                </span>

                <span className="text-sm font-semibold text-slate-800">
                  {openTickets}
                </span>
              </div>

              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full"
                  style={{
                    width: `${
                      totalTickets
                        ? (openTickets /
                            totalTickets) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* IN PROGRESS */}

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">
                  In Progress
                </span>

                <span className="text-sm font-semibold text-slate-800">
                  {inProgressTickets}
                </span>
              </div>

              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{
                    width: `${
                      totalTickets
                        ? (inProgressTickets /
                            totalTickets) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* CLOSED */}

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">
                  Closed
                </span>

                <span className="text-sm font-semibold text-slate-800">
                  {closedTickets}
                </span>
              </div>

              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: `${
                      totalTickets
                        ? (closedTickets /
                            totalTickets) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* =========================
              RESOLUTION RATE
          ========================= */}

          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Resolution rate
              </span>

              <span className="text-xl font-bold text-slate-800">
                {totalTickets
                  ? Math.round(
                      (closedTickets /
                        totalTickets) *
                        100
                    )
                  : 0}
                %
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              Based on currently available tickets
            </p>
          </div>
        </div>
      </div>

      {/* =========================
          QUICK ACTIONS
      ========================= */}

      <div className="mt-6">
        <QuickActions />
      </div>
    </Layout>
  );
}

export default Dashboard;