import { useMemo } from "react";
import Layout from "../components/layout/Layout";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

function Reports() {
 const tickets = useMemo(() => {
  return JSON.parse(localStorage.getItem("tickets")) || [];
}, []);

  const reportData = useMemo(() => {
    const total = tickets.length;

    const open = tickets.filter(
      (ticket) => ticket.status === "Open"
    ).length;

    const inProgress = tickets.filter(
      (ticket) => ticket.status === "In Progress"
    ).length;

    const closed = tickets.filter(
      (ticket) => ticket.status === "Closed"
    ).length;

    const high = tickets.filter(
      (ticket) => ticket.priority === "High"
    ).length;

    const medium = tickets.filter(
      (ticket) => ticket.priority === "Medium"
    ).length;

    const low = tickets.filter(
      (ticket) => ticket.priority === "Low"
    ).length;

    return {
      total,
      open,
      inProgress,
      closed,
      high,
      medium,
      low,
    };
  }, [tickets]);

  const statusData = [
    {
      name: "Open",
      value: reportData.open,
    },
    {
      name: "In Progress",
      value: reportData.inProgress,
    },
    {
      name: "Closed",
      value: reportData.closed,
    },
  ];

  const priorityData = [
    {
      name: "High",
      tickets: reportData.high,
    },
    {
      name: "Medium",
      tickets: reportData.medium,
    },
    {
      name: "Low",
      tickets: reportData.low,
    },
  ];

  const statusColors = [
    "#ef4444",
    "#f59e0b",
    "#22c55e",
  ];

  return (
    <Layout>
      {/* Heading */}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
          Reports
        </h1>

        <p className="text-gray-500 dark:text-gray-300 mt-2">
          Analyze your support ticket performance and statistics.
        </p>
      </div>

      {/* Summary Cards */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

        {/* Total */}

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-6">
          <p className="text-gray-500 dark:text-gray-300">
            Total Tickets
          </p>

          <h2 className="text-3xl font-bold text-slate-800 dark:text-white mt-2">
            {reportData.total}
          </h2>
        </div>

        {/* Open */}

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-6">
          <p className="text-gray-500 dark:text-gray-300">
            Open Tickets
          </p>

          <h2 className="text-3xl font-bold text-red-500 mt-2">
            {reportData.open}
          </h2>
        </div>

        {/* In Progress */}

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-6">
          <p className="text-gray-500 dark:text-gray-300">
            In Progress
          </p>

          <h2 className="text-3xl font-bold text-yellow-500 mt-2">
            {reportData.inProgress}
          </h2>
        </div>

        {/* Closed */}

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-6">
          <p className="text-gray-500 dark:text-gray-300">
            Closed Tickets
          </p>

          <h2 className="text-3xl font-bold text-green-500 mt-2">
            {reportData.closed}
          </h2>
        </div>

      </div>

      {/* Charts */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Status Chart */}

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-6">

          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-6">
            Tickets by Status
          </h2>

          <div className="w-full h-80">

            <ResponsiveContainer width="100%" height="100%">
              <PieChart>

                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label
                >

                  {statusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={statusColors[index]}
                    />
                  ))}

                </Pie>

                <Tooltip />

                <Legend />

              </PieChart>
            </ResponsiveContainer>

          </div>

        </div>

        {/* Priority Chart */}

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-6">

          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-6">
            Tickets by Priority
          </h2>

          <div className="w-full h-80">

            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>

                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="name" />

                <YAxis allowDecimals={false} />

                <Tooltip />

                <Bar
                  dataKey="tickets"
                  fill="#3b82f6"
                  radius={[8, 8, 0, 0]}
                />

              </BarChart>
            </ResponsiveContainer>

          </div>

        </div>

      </div>

    </Layout>
  );
}

export default Reports;