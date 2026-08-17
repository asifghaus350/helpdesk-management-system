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
  // Get tickets from localStorage
  const tickets =
    JSON.parse(localStorage.getItem("tickets")) || [];

  // Calculate ticket counts
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

  return (
    <Layout>

      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">

        <div>
          <p className="text-sm font-medium text-blue-600 mb-2">
            Overview
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-800">
            Dashboard
          </h1>

          <p className="text-slate-500 mt-2">
            Here's what's happening with your support tickets today.
          </p>
        </div>

        <div className="text-sm text-slate-500">
          Total tickets:{" "}
          <span className="font-semibold text-slate-700">
            {totalTickets}
          </span>
        </div>

      </div>

      {/* Statistics Cards */}
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

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">

        {/* Recent Tickets */}
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden">

          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">

            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                Recent Tickets
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Latest support activity
              </p>
            </div>

            <button
              type="button"
              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View all
              <ArrowUpRight size={16} />
            </button>

          </div>

          <div className="p-6">
            <RecentTickets />
          </div>

        </div>

        {/* Ticket Overview */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-800">
              Ticket Overview
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Current ticket distribution
            </p>
          </div>

          {/* Overview */}
          <div className="space-y-5">

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
                        ? (openTickets / totalTickets) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

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
                        ? (inProgressTickets / totalTickets) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

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
                        ? (closedTickets / totalTickets) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

          </div>

          {/* Summary */}
          <div className="mt-8 pt-6 border-t border-slate-100">

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Resolution rate
              </span>

              <span className="text-xl font-bold text-slate-800">
                {totalTickets
                  ? Math.round(
                      (closedTickets / totalTickets) * 100
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

      {/* Quick Actions */}
      <div className="mt-6">
        <QuickActions />
      </div>

    </Layout>
  );
}

export default Dashboard;