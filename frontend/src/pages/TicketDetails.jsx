import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  UserCheck,
  CircleAlert,
  FileText,
  Tag,
  CalendarDays,
  Clock,
  LoaderCircle,
  SearchX,
} from "lucide-react";

import Layout from "../components/layout/Layout";
import TicketComments from "../components/ticket/TicketComments";
import TicketActivity from "../components/ticket/TicketActivity";

import {
  getStoredUser,
  canEditTicket,
  canAssignToSelf,
} from "../utils/auth";
import { timeAgo, initials } from "../utils/format";
import { API_URL } from "../config";

// =========================
// STYLE MAPS
// =========================

const statusStyles = {
  Open: "bg-blue-50 text-blue-700 ring-blue-100",
  "In Progress": "bg-amber-50 text-amber-700 ring-amber-100",
  Closed: "bg-emerald-50 text-emerald-700 ring-emerald-100",
};

const statusDots = {
  Open: "bg-blue-500",
  "In Progress": "bg-amber-500",
  Closed: "bg-emerald-500",
};

const priorityStyles = {
  High: "bg-red-50 text-red-700 ring-red-100",
  Medium: "bg-amber-50 text-amber-700 ring-amber-100",
  Low: "bg-emerald-50 text-emerald-700 ring-emerald-100",
};

const priorityDots = {
  High: "bg-red-500",
  Medium: "bg-amber-500",
  Low: "bg-emerald-500",
};

const formatDateTime = (date) =>
  date
    ? new Date(date).toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Not available";

function TicketDetails() {
  const { id } = useParams();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");

  // Bumped after comments / assignment so the activity
  // timeline reloads and shows the new entry.
  const [activityKey, setActivityKey] = useState(0);

  const refreshActivity = () =>
    setActivityKey((key) => key + 1);

  const currentUser = getStoredUser();

  // =========================
  // ASSIGN TO ME (ENGINEER)
  // =========================

  const handleAssignToMe = async () => {
    try {
      setAssigning(true);
      setAssignError("");

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/tickets/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ assignToMe: true }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to assign ticket"
        );
      }

      // Keep populated fields (createdBy) from the first load
      setTicket((prev) => ({
        ...prev,
        engineer: data.ticket.engineer,
        engineerId: data.ticket.engineerId,
        status: data.ticket.status,
        updatedAt: data.ticket.updatedAt,
      }));

      refreshActivity();
    } catch (error) {
      setAssignError(
        error.message || "Unable to assign ticket."
      );
    } finally {
      setAssigning(false);
    }
  };

  // =========================
  // FETCH TICKET
  // =========================

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          setError(
            "Authentication required. Please login."
          );
          return;
        }

        const response = await fetch(
          `${API_URL}/api/tickets/${id}`,
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
            data.message || "Failed to fetch ticket"
          );
        }

        setTicket(data.ticket);
      } catch (error) {
        console.error(
          "Fetch ticket error:",
          error
        );

        setError(
          error.message ||
            "Unable to load ticket."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [id]);

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6 animate-pulse">
          <div className="h-32 rounded-2xl bg-slate-200" />

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6">
            <div className="space-y-6">
              <div className="h-40 rounded-2xl bg-slate-200" />
              <div className="h-72 rounded-2xl bg-slate-200" />
            </div>

            <div className="h-96 rounded-2xl bg-slate-200" />
          </div>
        </div>
      </Layout>
    );
  }

  // =========================
  // ERROR / NOT FOUND
  // =========================

  if (error || !ticket) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto mt-10 bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <SearchX size={26} />
          </div>

          <h1 className="text-xl font-bold text-slate-800 mt-4">
            Ticket not found
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            {error ||
              "The ticket you are looking for does not exist."}
          </p>

          <Link
            to="/tickets"
            className="inline-flex items-center gap-2 mt-6 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700"
          >
            <ArrowLeft size={16} />
            Back to Tickets
          </Link>
        </div>
      </Layout>
    );
  }

  const detailRows = [
    {
      label: "Status",
      value: (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${
            statusStyles[ticket.status] || statusStyles.Open
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              statusDots[ticket.status] || statusDots.Open
            }`}
          />
          {ticket.status}
        </span>
      ),
    },
    {
      label: "Priority",
      value: (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${
            priorityStyles[ticket.priority] || priorityStyles.Medium
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              priorityDots[ticket.priority] || priorityDots.Medium
            }`}
          />
          {ticket.priority}
        </span>
      ),
    },
    {
      label: "Category",
      value: (
        <span className="inline-flex items-center gap-1.5 text-sm text-slate-700">
          <Tag size={14} className="text-slate-400" />
          {ticket.category}
        </span>
      ),
    },
    {
      label: "Assignee",
      value: ticket.engineer ? (
        <span className="inline-flex items-center gap-2 text-sm text-slate-700">
          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
            {initials(ticket.engineer)}
          </span>
          {ticket.engineer}
        </span>
      ) : (
        <span className="text-sm text-slate-400">
          Unassigned
        </span>
      ),
    },
    {
      label: "Reporter",
      value: (
        <span className="inline-flex items-center gap-2 text-sm text-slate-700">
          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold">
            {initials(ticket.createdBy?.name || "?")}
          </span>
          {ticket.createdBy?.name || "Unknown"}
        </span>
      ),
    },
    {
      label: "Created",
      value: (
        <span
          className="inline-flex items-center gap-1.5 text-sm text-slate-700"
          title={formatDateTime(ticket.createdAt)}
        >
          <CalendarDays size={14} className="text-slate-400" />
          {formatDateTime(ticket.createdAt)}
        </span>
      ),
    },
    {
      label: "Updated",
      value: (
        <span
          className="inline-flex items-center gap-1.5 text-sm text-slate-700"
          title={formatDateTime(ticket.updatedAt)}
        >
          <Clock size={14} className="text-slate-400" />
          {timeAgo(ticket.updatedAt || ticket.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <Layout>

      {/* =========================
          HEADER
      ========================= */}

      <Link
        to="/tickets"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-600 transition"
      >
        <ArrowLeft size={16} />
        Back to tickets
      </Link>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mt-3 mb-6">

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold font-mono">
              #{ticket.ticketId}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${
                statusStyles[ticket.status] || statusStyles.Open
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  statusDots[ticket.status] || statusDots.Open
                }`}
              />
              {ticket.status}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${
                priorityStyles[ticket.priority] || priorityStyles.Medium
              }`}
            >
              {ticket.priority} priority
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800 mt-3 wrap-break-word">
            {ticket.title}
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            Opened by{" "}
            <span className="font-medium text-slate-700">
              {ticket.createdBy?.name || "Unknown"}
            </span>{" "}
            · {timeAgo(ticket.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canAssignToSelf(ticket, currentUser) && (
            <button
              type="button"
              onClick={handleAssignToMe}
              disabled={assigning}
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 transition"
            >
              {assigning ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <UserCheck size={17} />
              )}
              {assigning ? "Assigning..." : "Assign to me"}
            </button>
          )}

          {canEditTicket(ticket, currentUser) && (
            <Link
              to={`/tickets/edit/${ticket.ticketId}`}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-sm transition"
            >
              <Pencil size={16} />
              Edit Ticket
            </Link>
          )}
        </div>

      </div>

      {assignError && (
        <div className="mb-6 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
          <CircleAlert size={18} />
          {assignError}
        </div>
      )}

      {/* =========================
          CONTENT
      ========================= */}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">

        {/* MAIN COLUMN */}

        <div className="space-y-6 min-w-0">

          {/* DESCRIPTION */}

          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
              <FileText size={18} className="text-slate-400" />

              <h2 className="text-base font-semibold text-slate-800">
                Description
              </h2>
            </div>

            <p className="px-5 py-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap wrap-break-word">
              {ticket.description}
            </p>
          </section>

          {/* CONVERSATION */}

          <TicketComments
            ticketId={ticket.ticketId}
            onChange={refreshActivity}
          />
        </div>

        {/* SIDEBAR */}

        <aside className="space-y-6 lg:sticky lg:top-6">

          {/* DETAILS */}

          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm">
            <h2 className="px-5 py-4 border-b border-slate-100 text-base font-semibold text-slate-800">
              Details
            </h2>

            <dl className="px-5 py-2 divide-y divide-slate-100">
              {detailRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <dt className="text-sm text-slate-500 shrink-0">
                    {row.label}
                  </dt>

                  <dd className="min-w-0 text-right truncate">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* ACTIVITY */}

          <TicketActivity
            ticketId={ticket.ticketId}
            refreshKey={activityKey}
          />
        </aside>

      </div>

    </Layout>
  );
}

export default TicketDetails;
