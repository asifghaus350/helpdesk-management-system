import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Plus, X, SlidersHorizontal } from "lucide-react";

import Layout from "../components/layout/Layout";
import TicketTable from "../components/ticket/TicketTable";
import { getStoredUser } from "../utils/auth";

const pageDescriptions = {
  Admin: "View, search and manage all support tickets.",
  Engineer:
    "Tickets assigned to you, plus unassigned tickets you can pick up.",
  User: "Track the support tickets you have raised.",
};

function TicketList() {
  // =========================
  // URL SEARCH PARAMETERS
  // =========================

  const [searchParams, setSearchParams] =
    useSearchParams();

  // =========================
  // FILTER STATES
  // =========================

  const [search, setSearch] = useState(
    searchParams.get("search") || ""
  );

  const [status, setStatus] = useState(
    searchParams.get("status") || ""
  );

  const [priority, setPriority] = useState(
    searchParams.get("priority") || ""
  );

  const [category, setCategory] = useState(
    searchParams.get("category") || ""
  );

  const userRole = getStoredUser()?.role || "User";

  // =========================
  // SYNC FILTERS WITH URL
  // =========================
  // When the URL changes from outside this page (navbar
  // search, dashboard cards) while it is already open,
  // copy the new values into the filter inputs.

  const urlKey = searchParams.toString();
  const [syncedUrlKey, setSyncedUrlKey] = useState(urlKey);

  if (urlKey !== syncedUrlKey) {
    setSyncedUrlKey(urlKey);
    setSearch(searchParams.get("search") || "");
    setStatus(searchParams.get("status") || "");
    setPriority(searchParams.get("priority") || "");
    setCategory(searchParams.get("category") || "");
  }

  // =========================
  // UPDATE URL FILTER
  // =========================

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(
      searchParams
    );

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    setSearchParams(params);
  };

  const filterSetters = {
    search: setSearch,
    status: setStatus,
    priority: setPriority,
    category: setCategory,
  };

  const changeFilter = (key, value) => {
    filterSetters[key](value);
    updateFilter(key, value);
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setPriority("");
    setCategory("");
    setSearchParams(new URLSearchParams());
  };

  const activeFilterCount = [
    search,
    priority,
    category,
  ].filter(Boolean).length;

  const selectClass = (value) =>
    `h-11 border rounded-xl px-3.5 pr-9 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition cursor-pointer ${
      value
        ? "border-blue-300 bg-blue-50 text-blue-700 font-medium"
        : "border-slate-200 bg-white text-slate-700"
    }`;

  // =========================
  // PAGE
  // =========================

  return (
    <Layout>

      {/* =========================
          HEADING
      ========================= */}

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">
            Ticket Management
          </h1>

          <p className="mt-2 text-slate-500">
            {pageDescriptions[userRole] ||
              pageDescriptions.User}
          </p>
        </div>

        <Link
          to="/tickets/create"
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-sm transition shrink-0"
        >
          <Plus size={18} />
          Create Ticket
        </Link>

      </div>

      {/* =========================
          SEARCH & FILTERS
      ========================= */}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 mb-5">

        <div className="flex flex-col lg:flex-row gap-3">

          {/* SEARCH */}

          <div className="relative flex-1">

            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              placeholder="Search by ID, title, description or engineer..."
              value={search}
              onChange={(e) =>
                changeFilter("search", e.target.value)
              }
              aria-label="Search tickets"
              className="w-full h-11 border border-slate-200 rounded-xl pl-10 pr-4 text-sm text-slate-800 bg-slate-50 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
            />

          </div>

          <div className="flex flex-wrap items-center gap-3">

            <span className="hidden sm:inline-flex items-center gap-1.5 text-sm text-slate-500">
              <SlidersHorizontal size={16} />
              Filters
            </span>

            {/* PRIORITY */}

            <select
              value={priority}
              onChange={(e) =>
                changeFilter("priority", e.target.value)
              }
              aria-label="Filter by priority"
              className={selectClass(priority)}
            >
              <option value="">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {/* CATEGORY */}

            <select
              value={category}
              onChange={(e) =>
                changeFilter("category", e.target.value)
              }
              aria-label="Filter by category"
              className={selectClass(category)}
            >
              <option value="">All Categories</option>
              <option value="Bug">Bug</option>
              <option value="Support">Support</option>
              <option value="Feature Request">
                Feature Request
              </option>
            </select>

            {/* CLEAR */}

            {(activeFilterCount > 0 || status) && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 h-11 px-3.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
              >
                <X size={16} />
                Clear
              </button>
            )}

          </div>

        </div>

      </div>

      {/* =========================
          STATUS TABS + TICKET TABLE
      ========================= */}

      <TicketTable
        search={search}
        status={status}
        priority={priority}
        category={category}
        onStatusChange={(value) =>
          changeFilter("status", value)
        }
        onClearFilters={clearFilters}
      />

    </Layout>
  );
}

export default TicketList;
