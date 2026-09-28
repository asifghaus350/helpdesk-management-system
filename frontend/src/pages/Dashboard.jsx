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
  Plus,
  CalendarDays,
} from "lucide-react";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { API_URL } from "../config";

function Dashboard() {
  const navigate = useNavigate();

  // Counts + latest tickets from /api/tickets/stats
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================
  // GET CURRENT USER
  // =========================

  const storedUser = localStorage.getItem("user");

  let userRole = "User";
  let userName = "there";

  try {
    const parsedUser = storedUser
      ? JSON.parse(storedUser)
      : null;

    userRole = parsedUser?.role || "User";
    userName = parsedUser?.name?.split(" ")[0] || "there";
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
      label: "My Work Queue",
      description:
        "Tickets assigned to you, plus unassigned tickets you can pick up.",
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
          `${API_URL}/api/tickets/stats?recent=5`,
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

        setStats(data.stats || null);
        setTickets(data.recentTickets || []);
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

  const totalTickets = stats?.total ?? 0;

  const openTickets = stats?.byStatus?.Open ?? 0;

  const inProgressTickets =
    stats?.byStatus?.["In Progress"] ?? 0;

  const closedTickets = stats?.byStatus?.Closed ?? 0;

  const percentOf = (value) =>
    totalTickets
      ? Math.round((value / totalTickets) * 100)
      : 0;

  const resolutionRate = percentOf(closedTickets);

  // Active (not closed) tickets per priority
  const priorityCounts = ["High", "Medium", "Low"].map(
    (level) => ({
      level,
      count: stats?.activeByPriority?.[level] ?? 0,
    })
  );

  // =========================
  // DASHBOARD CARDS
  // =========================

  const cards = [
    {
      title: "Total Tickets",
      count: totalTickets,
      color: "bg-blue-50",
      iconColor: "text-blue-600",
      barColor: "bg-blue-500",
      percent: totalTickets ? 100 : 0,
      hint: "All tickets in view",
      icon: Ticket,
      filter: "",
    },
    {
      title: "Open Tickets",
      count: openTickets,
      color: "bg-red-50",
      iconColor: "text-red-600",
      barColor: "bg-red-500",
      percent: percentOf(openTickets),
      hint: `${percentOf(openTickets)}% awaiting action`,
      icon: CircleAlert,
      filter: "Open",
    },
    {
      title: "In Progress",
      count: inProgressTickets,
      color: "bg-amber-50",
      iconColor: "text-amber-600",
      barColor: "bg-amber-500",
      percent: percentOf(inProgressTickets),
      hint: `${percentOf(inProgressTickets)}% being worked on`,
      icon: LoaderCircle,
      filter: "In Progress",
    },
    {
      title: "Closed",
      count: closedTickets,
      color: "bg-emerald-50",
      iconColor: "text-emerald-600",
      barColor: "bg-emerald-500",
      percent: percentOf(closedTickets),
      hint: `${percentOf(closedTickets)}% resolved`,
      icon: CheckCircle,
      filter: "Closed",
    },
  ];

  const distribution = [
    { name: "Open", value: openTickets, color: "#ef4444" },
    { name: "In Progress", value: inProgressTickets, color: "#f59e0b" },
    { name: "Closed", value: closedTickets, color: "#10b981" },
  ];

  const emptyDistribution = [
    { name: "Empty", value: 1, color: "#e2e8f0" },
  ];

  const chartData = totalTickets
    ? distribution
    : emptyDistribution;

  const priorityStyles = {
    High: "bg-red-50 text-red-600",
    Medium: "bg-amber-50 text-amber-600",
    Low: "bg-emerald-50 text-emerald-600",
  };

  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? "Good morning"
      : hour < 17
      ? "Good afternoon"
      : "Good evening";

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-6">
          <div className="h-40 rounded-2xl bg-slate-200" />

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-36 rounded-2xl bg-slate-200"
              />
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 h-80 rounded-2xl bg-slate-200" />
            <div className="h-80 rounded-2xl bg-slate-200" />
          </div>
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
          HERO BANNER
      ========================= */}

      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 p-6 lg:p-8 mb-6 shadow-sm">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10" />
        <div className="absolute right-40 -bottom-24 w-48 h-48 rounded-full bg-white/10" />

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-blue-100 text-sm">
              <CalendarDays size={16} />
              <span>{today}</span>
              <span className="w-1 h-1 rounded-full bg-blue-200" />
              <span>{roleContent.label}</span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white mt-3">
              {greeting}, {userName} 👋
            </h1>

            <p className="text-blue-100 mt-2 max-w-xl">
              {roleContent.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/15 backdrop-blur rounded-xl px-5 py-3">
              <p className="text-xs text-blue-100">
                {userRole === "Admin"
                  ? "Total system tickets"
                  : "Your tickets"}
              </p>

              <p className="text-2xl font-bold text-white">
                {totalTickets}
              </p>
            </div>

            <div className="bg-white/15 backdrop-blur rounded-xl px-5 py-3">
              <p className="text-xs text-blue-100">
                Resolution rate
              </p>

              <p className="text-2xl font-bold text-white">
                {resolutionRate}%
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/tickets/create")}
              className="no-dark flex items-center gap-2 bg-white/95 text-blue-700 font-semibold rounded-xl px-5 py-3.5 hover:bg-blue-50 shadow-sm transition"
            >
              <Plus size={18} />
              New Ticket
            </button>
          </div>
        </div>
      </div>

      {/* =========================
          STATISTICS CARDS
      ========================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map(({ filter, ...card }) => (
          <DashboardCard
            key={card.title}
            {...card}
            onClick={() =>
              navigate(
                filter
                  ? `/tickets?status=${encodeURIComponent(filter)}`
                  : "/tickets"
              )
            }
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

        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
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
              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
            >
              View all
              <ArrowUpRight size={16} />
            </button>
          </div>

          <RecentTickets tickets={tickets} />
        </div>

        {/* =========================
            TICKET OVERVIEW
        ========================= */}

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="mb-2">
            <h2 className="text-lg font-semibold text-slate-800">
              Ticket Overview
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Current ticket distribution
            </p>
          </div>

          {/* DONUT */}

          <div className="relative h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  innerRadius={62}
                  outerRadius={82}
                  paddingAngle={totalTickets ? 3 : 0}
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                  isAnimationActive
                >
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={entry.color}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-slate-800">
                {resolutionRate}%
              </span>

              <span className="text-xs text-slate-500">
                Resolved
              </span>
            </div>
          </div>

          {/* LEGEND */}

          <div className="space-y-3 mt-2">
            {distribution.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />

                  <span className="text-sm text-slate-600">
                    {item.name}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">
                    {percentOf(item.value)}%
                  </span>

                  <span className="text-sm font-semibold text-slate-800 w-6 text-right">
                    {item.value}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* ACTIVE BY PRIORITY */}

          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
              Active by priority
            </p>

            <div className="grid grid-cols-3 gap-2">
              {priorityCounts.map((item) => (
                <div
                  key={item.level}
                  className={`${priorityStyles[item.level]} rounded-xl px-3 py-2.5 text-center`}
                >
                  <p className="text-lg font-bold">
                    {item.count}
                  </p>

                  <p className="text-xs font-medium">
                    {item.level}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =========================
          QUICK ACTIONS
      ========================= */}

      <div className="mt-6">
        <QuickActions userRole={userRole} />
      </div>
    </Layout>
  );
}

export default Dashboard;
