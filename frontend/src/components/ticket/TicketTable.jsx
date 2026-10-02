import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  Pencil,
  Trash2,
  Inbox,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
} from "lucide-react";

import DeleteModal from "../ui/DeleteModal";
import {
  getStoredUser,
  canEditTicket,
  canDeleteTicket,
} from "../../utils/auth";
import { timeAgo, initials } from "../../utils/format";
import useDebouncedValue from "../../utils/useDebouncedValue";
import { API_URL } from "../../config";

// =========================
// STYLE MAPS
// =========================

const STATUS_TABS = ["", "Open", "In Progress", "Closed"];

const statusStyles = {
  Open: {
    pill: "bg-blue-50 text-blue-700 ring-blue-100",
    dot: "bg-blue-500",
  },
  "In Progress": {
    pill: "bg-amber-50 text-amber-700 ring-amber-100",
    dot: "bg-amber-500",
  },
  Closed: {
    pill: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    dot: "bg-emerald-500",
  },
};

const priorityStyles = {
  High: "text-red-600 bg-red-500",
  Medium: "text-amber-600 bg-amber-500",
  Low: "text-emerald-600 bg-emerald-500",
};

const avatarColors = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

// Same name always gets the same avatar color
const avatarColor = (name = "") => {
  const hash = [...name].reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0
  );

  return avatarColors[hash % avatarColors.length];
};

function TicketTable({
  search,
  status,
  priority,
  category,
  onStatusChange,
  onClearFilters,
}) {
  const navigate = useNavigate();

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Current page of tickets from the server
  const [tickets, setTickets] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [serverStatusCounts, setServerStatusCounts] = useState({});

  const [loading, setLoading] = useState(true);   // first load
  const [fetching, setFetching] = useState(false); // later reloads
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const currentUser = getStoredUser();

  // Wait until typing stops before searching on the server
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  // Page number is remembered per filter combination,
  // so changing any filter goes back to page 1.
  const filterKey = [search, status, priority, category].join("|");

  const [pageState, setPageState] = useState({
    key: filterKey,
    page: 1,
  });

  const currentPage =
    pageState.key === filterKey ? pageState.page : 1;

  const setCurrentPage = (page) =>
    setPageState({ key: filterKey, page });

  const ticketsPerPage = 10;

  // =========================
  // FETCH ONE PAGE OF TICKETS
  // =========================

  useEffect(() => {
    let cancelled = false;

    const fetchTickets = async () => {
      try {
        setFetching(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          setError("Authentication required. Please login.");
          return;
        }

        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(ticketsPerPage),
        });

        if (debouncedSearch) params.set("search", debouncedSearch);
        if (status) params.set("status", status);
        if (priority) params.set("priority", priority);
        if (category) params.set("category", category);

        const response = await fetch(
          `${API_URL}/api/tickets?${params}`,
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
            data.message || "Failed to fetch tickets"
          );
        }

        if (cancelled) return;

        setTickets(data.tickets || []);
        setTotalCount(data.pagination?.total ?? 0);
        setTotalPages(data.pagination?.totalPages ?? 1);
        setServerStatusCounts(data.statusCounts || {});
      } catch (error) {
        console.error("Fetch tickets error:", error);

        if (!cancelled) {
          setError(
            error.message ||
              "Unable to load tickets."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setFetching(false);
        }
      }
    };

    fetchTickets();

    return () => {
      cancelled = true;
    };
  }, [
    currentPage,
    debouncedSearch,
    status,
    priority,
    category,
    reloadKey,
  ]);

  // =========================
  // DELETE TICKET
  // =========================

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError(
          "Authentication required. Please login."
        );
        return;
      }

      const response = await fetch(
        `${API_URL}/api/tickets/${selectedTicket}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete ticket"
        );
      }

      setIsDeleteOpen(false);
      setSelectedTicket(null);

      // Deleted the last row of a page: go back one page.
      // Otherwise reload the same page from the server.
      if (tickets.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        setReloadKey((key) => key + 1);
      }
    } catch (error) {
      console.error("Delete ticket error:", error);

      setError(
        error.message ||
          "Unable to delete ticket."
      );
    }
  };

  // =========================
  // COUNTS + PAGINATION
  // =========================

  const statusCounts = {
    "": serverStatusCounts.all ?? 0,
    Open: serverStatusCounts.Open ?? 0,
    "In Progress": serverStatusCounts["In Progress"] ?? 0,
    Closed: serverStatusCounts.Closed ?? 0,
  };

  const hasFilters = Boolean(
    search || status || priority || category
  );

  const currentTickets = tickets;

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const indexOfFirstTicket =
    (safeCurrentPage - 1) * ticketsPerPage;

  // Up to 5 page buttons around the current page
  const firstPageButton = Math.max(
    1,
    Math.min(safeCurrentPage - 2, totalPages - 4)
  );

  const pageButtons = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => firstPageButton + index
  );

  // =========================
  // STATUS TABS
  // =========================

  const statusTabs = (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-4">
      {STATUS_TABS.map((tab) => {
        const isActive = status === tab;

        return (
          <button
            key={tab || "all"}
            type="button"
            onClick={() => onStatusChange?.(tab)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap border transition ${
              isActive
                ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                : "bg-white border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-600"
            }`}
          >
            {tab && (
              <span
                className={`w-2 h-2 rounded-full ${
                  isActive
                    ? "bg-white"
                    : statusStyles[tab].dot
                }`}
              />
            )}

            {tab || "All Tickets"}

            <span
              className={`min-w-6 px-1.5 py-0.5 rounded-md text-xs font-semibold ${
                isActive
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {loading ? "–" : statusCounts[tab]}
            </span>
          </button>
        );
      })}
    </div>
  );

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <>
        {statusTabs}

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-3 animate-pulse">
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="h-14 rounded-xl bg-slate-100"
            />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      {statusTabs}

      {/* Error Message */}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div
        aria-busy={fetching}
        className={`bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-opacity ${
          fetching ? "opacity-60" : ""
        }`}
      >

        {currentTickets.length === 0 ? (

          /* =========================
              EMPTY STATE
          ========================= */

          <div className="py-16 px-6 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
              <Inbox size={26} />
            </div>

            <p className="text-base font-semibold text-slate-800">
              {hasFilters
                ? "No tickets match your filters"
                : "No tickets yet"}
            </p>

            <p className="text-sm text-slate-500 mt-1 max-w-sm">
              {hasFilters
                ? "Try a different search or clear the filters to see all tickets."
                : "Create your first support ticket to get started."}
            </p>

            {hasFilters ? (
              <button
                type="button"
                onClick={onClearFilters}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <X size={16} />
                Clear filters
              </button>
            ) : (
              <Link
                to="/tickets/create"
                className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
              >
                <Plus size={16} />
                Create Ticket
              </Link>
            )}
          </div>

        ) : (

          <>
          {/* PHONES: one card per ticket */}

          <ul className="sm:hidden divide-y divide-slate-100">
            {currentTickets.map((ticket) => {
              const statusStyle =
                statusStyles[ticket.status] || statusStyles.Open;

              const [priorityText, priorityDot] = (
                priorityStyles[ticket.priority] ||
                "text-slate-600 bg-slate-400"
              ).split(" ");

              return (
                <li key={ticket.ticketId}>
                  <Link
                    to={`/tickets/${ticket.ticketId}`}
                    className="block px-4 py-3.5 active:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-800 line-clamp-2">
                        {ticket.title}
                      </p>

                      <span
                        className={`shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1 ring-inset whitespace-nowrap ${statusStyle.pill}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                        {ticket.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-1">
                      #{ticket.ticketId} · {ticket.category}
                    </p>

                    <div className="flex items-center justify-between gap-3 mt-2.5 text-xs">
                      <span className={`inline-flex items-center gap-1.5 font-medium ${priorityText}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${priorityDot}`} />
                        {ticket.priority}
                      </span>

                      <span className="inline-flex items-center gap-1.5 text-slate-500 min-w-0">
                        <span className="truncate">
                          {ticket.engineer || "Unassigned"}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="whitespace-nowrap">
                          {timeAgo(ticket.updatedAt || ticket.createdAt)}
                        </span>
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* TABLETS AND UP: full table */}

          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full min-w-205">

              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {[
                    "Ticket",
                    "Category",
                    "Priority",
                    "Status",
                    "Engineer",
                    "Updated",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}

                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {currentTickets.map((ticket) => {
                  const statusStyle =
                    statusStyles[ticket.status] ||
                    statusStyles.Open;

                  const [priorityText, priorityDot] = (
                    priorityStyles[ticket.priority] ||
                    "text-slate-600 bg-slate-400"
                  ).split(" ");

                  return (
                    <tr
                      key={ticket.ticketId}
                      onClick={() =>
                        navigate(`/tickets/${ticket.ticketId}`)
                      }
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer"
                    >

                      {/* Ticket */}

                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-800 truncate max-w-70">
                          {ticket.title}
                        </p>

                        <p className="text-xs text-slate-500 mt-0.5">
                          #{ticket.ticketId}
                          {ticket.createdBy?.name &&
                            ` · by ${ticket.createdBy.name}`}
                        </p>
                      </td>

                      {/* Category */}

                      <td className="px-5 py-4">
                        <span className="inline-flex px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium whitespace-nowrap">
                          {ticket.category}
                        </span>
                      </td>

                      {/* Priority */}

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-2 text-sm font-medium ${priorityText}`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${priorityDot}`}
                          />
                          {ticket.priority}
                        </span>
                      </td>

                      {/* Status */}

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset whitespace-nowrap ${statusStyle.pill}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}
                          />
                          {ticket.status}
                        </span>
                      </td>

                      {/* Engineer */}

                      <td className="px-5 py-4">
                        {ticket.engineer ? (
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(
                                ticket.engineer
                              )}`}
                            >
                              {initials(ticket.engineer)}
                            </span>

                            <span className="text-sm text-slate-700 truncate max-w-35">
                              {ticket.engineer}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-2 text-sm text-slate-400">
                            <span className="w-8 h-8 rounded-full border-2 border-dashed border-slate-300" />
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Updated */}

                      <td className="px-5 py-4 text-sm text-slate-500 whitespace-nowrap">
                        {timeAgo(
                          ticket.updatedAt || ticket.createdAt
                        )}
                      </td>

                      {/* Actions */}

                      <td
                        className="px-5 py-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-end gap-1">

                          {/* View */}

                          <Link
                            to={`/tickets/${ticket.ticketId}`}
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition"
                            title="View Ticket"
                            aria-label="View Ticket"
                          >
                            <Eye size={17} />
                          </Link>

                          {/* Edit: Admin, or assigned Engineer */}

                          {canEditTicket(ticket, currentUser) && (
                            <Link
                              to={`/tickets/edit/${ticket.ticketId}`}
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition"
                              title="Edit Ticket"
                              aria-label="Edit Ticket"
                            >
                              <Pencil size={17} />
                            </Link>
                          )}

                          {/* Delete: Admin only */}

                          {canDeleteTicket(currentUser) && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTicket(
                                  ticket.ticketId
                                );

                                setIsDeleteOpen(true);
                              }}
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
                              title="Delete Ticket"
                              aria-label="Delete Ticket"
                            >
                              <Trash2 size={17} />
                            </button>
                          )}

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>
          </>

        )}

        {/* =========================
            PAGINATION
        ========================= */}

        {totalCount > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-slate-100">

            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {indexOfFirstTicket + 1}–
                {indexOfFirstTicket + currentTickets.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700">
                {totalCount}
              </span>{" "}
              tickets
            </p>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage(safeCurrentPage - 1)
                  }
                  disabled={safeCurrentPage === 1}
                  aria-label="Previous page"
                  className="w-9 h-9 rounded-lg flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={17} />
                </button>

                {pageButtons.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                      page === safeCurrentPage
                        ? "bg-blue-600 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage(safeCurrentPage + 1)
                  }
                  disabled={safeCurrentPage === totalPages}
                  aria-label="Next page"
                  className="w-9 h-9 rounded-lg flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            )}

          </div>
        )}

      </div>

      {/* Delete Modal */}

      <DeleteModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedTicket(null);
        }}
        onDelete={handleDelete}
      />

    </>
  );
}

export default TicketTable;
