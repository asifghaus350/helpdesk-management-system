import { useNavigate } from "react-router-dom";
import { Inbox } from "lucide-react";

import { timeAgo } from "../../utils/format";


function RecentTickets({ tickets = [] }) {
  const navigate = useNavigate();

  // Backend se Dashboard ko jo tickets mile hain,
  // unmein se latest 5 tickets show karo.
  const recentTickets = tickets.slice(0, 5);

  // =========================
  // STATUS STYLE
  // =========================

  const getStatusStyle = (status) => {
    switch (status) {
      case "Open":
        return "bg-red-50 text-red-600 ring-red-100";

      case "In Progress":
        return "bg-amber-50 text-amber-600 ring-amber-100";

      case "Closed":
        return "bg-emerald-50 text-emerald-600 ring-emerald-100";

      default:
        return "bg-slate-100 text-slate-600 ring-slate-200";
    }
  };

  // =========================
  // PRIORITY STYLE
  // =========================

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case "High":
        return { text: "text-red-600", dot: "bg-red-500" };

      case "Medium":
        return { text: "text-amber-600", dot: "bg-amber-500" };

      case "Low":
        return { text: "text-emerald-600", dot: "bg-emerald-500" };

      default:
        return { text: "text-slate-600", dot: "bg-slate-400" };
    }
  };

  // =========================
  // NO TICKETS
  // =========================

  if (recentTickets.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
          <Inbox size={22} />
        </div>

        <p className="text-sm text-slate-500">
          No recent tickets found.
        </p>

        <p className="text-xs text-slate-400 mt-1">
          Newly created tickets will appear here.
        </p>
      </div>
    );
  }

  // =========================
  // TICKETS TABLE
  // =========================

  return (
    <div className="overflow-x-auto">
      <table className="w-full">

        {/* Table Header */}

        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60">
            {["Ticket", "Status", "Priority", "Updated"].map(
              (heading) => (
                <th
                  key={heading}
                  className="text-left py-3 px-6 text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {heading}
                </th>
              )
            )}
          </tr>
        </thead>

        {/* Table Body */}

        <tbody>
          {recentTickets.map((ticket) => {
            const priority = getPriorityStyle(ticket.priority);

            return (
              <tr
                key={ticket._id || ticket.ticketId}
                onClick={() =>
                  navigate(`/tickets/${ticket.ticketId}`)
                }
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer"
              >

                {/* Ticket */}

                <td className="py-4 px-6">
                  <p className="text-sm font-semibold text-slate-800 truncate max-w-65">
                    {ticket.title}
                  </p>

                  <p className="text-xs text-slate-500 mt-0.5">
                    #{ticket.ticketId}
                    {ticket.category && ` · ${ticket.category}`}
                  </p>
                </td>

                {/* Status */}

                <td className="py-4 px-6">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset whitespace-nowrap ${getStatusStyle(
                      ticket.status
                    )}`}
                  >
                    {ticket.status}
                  </span>
                </td>

                {/* Priority */}

                <td className="py-4 px-6">
                  <span
                    className={`inline-flex items-center gap-2 text-sm font-medium ${priority.text}`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${priority.dot}`}
                    />
                    {ticket.priority}
                  </span>
                </td>

                {/* Updated */}

                <td className="py-4 px-6 text-sm text-slate-500 whitespace-nowrap">
                  {timeAgo(ticket.updatedAt || ticket.createdAt)}
                </td>

              </tr>
            );
          })}
        </tbody>

      </table>
    </div>
  );
}

export default RecentTickets;
