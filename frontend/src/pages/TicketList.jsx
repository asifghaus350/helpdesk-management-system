import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";

import Layout from "../components/layout/Layout";
import TicketTable from "../components/ticket/TicketTable";

function TicketList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");

  const [theme, setTheme] = useState(() => {
    const savedSettings = localStorage.getItem("settings");

    if (savedSettings) {
      return JSON.parse(savedSettings).theme || "light";
    }

    return "light";
  });

  useEffect(() => {
    const handleSettingsChange = () => {
      const savedSettings = localStorage.getItem("settings");

      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);

        setTheme(parsedSettings.theme || "light");
      }
    };

    window.addEventListener(
      "settingsChanged",
      handleSettingsChange
    );

    return () => {
      window.removeEventListener(
        "settingsChanged",
        handleSettingsChange
      );
    };
  }, []);

  const isDark = theme === "dark";

  return (
    <Layout>

      {/* Heading */}

      <div className="mb-8">

        <h1
          className={`text-3xl font-bold ${
            isDark
              ? "text-white"
              : "text-slate-800"
          }`}
        >
          Ticket Management
        </h1>

        <p
          className={`mt-2 ${
            isDark
              ? "text-slate-400"
              : "text-gray-500"
          }`}
        >
          View, search and manage all support tickets.
        </p>

      </div>

      {/* Search & Filters */}

      <div
        className={`rounded-2xl shadow-md p-6 mb-8 ${
          isDark
            ? "bg-slate-800"
            : "bg-white"
        }`}
      >

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">

          {/* Search */}

          <div className="relative lg:col-span-2">

            <Search
              size={18}
              className={`absolute left-3 top-3.5 ${
                isDark
                  ? "text-slate-400"
                  : "text-gray-400"
              }`}
            />

            <input
              type="text"
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full border rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 ${
                isDark
                  ? "bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  : "bg-white border-gray-300 text-slate-800"
              }`}
            />

          </div>

          {/* Status */}

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={`border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 ${
              isDark
                ? "bg-slate-700 border-slate-600 text-white"
                : "bg-white border-gray-300 text-slate-800"
            }`}
          >
            <option value="">All Status</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Closed">Closed</option>
          </select>

          {/* Priority */}

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className={`border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 ${
              isDark
                ? "bg-slate-700 border-slate-600 text-white"
                : "bg-white border-gray-300 text-slate-800"
            }`}
          >
            <option value="">All Priority</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Category */}

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 ${
              isDark
                ? "bg-slate-700 border-slate-600 text-white"
                : "bg-white border-gray-300 text-slate-800"
            }`}
          >
            <option value="">All Categories</option>
            <option value="Bug">Bug</option>
            <option value="Support">Support</option>
            <option value="Feature Request">
              Feature Request
            </option>
          </select>

          {/* Create Ticket */}

          <Link
            to="/tickets/create"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center font-semibold transition"
          >
            + Create Ticket
          </Link>

        </div>

      </div>

      {/* Ticket Table */}

      <TicketTable
        search={search}
        status={status}
        priority={priority}
        category={category}
      />

    </Layout>
  );
}

export default TicketList;