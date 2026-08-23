import { useNavigate } from "react-router-dom";

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
        return "bg-red-50 text-red-600";

      case "In Progress":
        return "bg-amber-50 text-amber-600";

      case "Closed":
        return "bg-emerald-50 text-emerald-600";

      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  // =========================
  // PRIORITY STYLE
  // =========================

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case "High":
        return "text-red-600";

      case "Medium":
        return "text-amber-600";

      case "Low":
        return "text-emerald-600";

      default:
        return "text-slate-600";
    }
  };

  // =========================
  // NO TICKETS
  // =========================

  if (recentTickets.length === 0) {
    return (
      <div className="py-12 text-center">
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
          <tr className="border-b border-slate-100">

            <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              ID
            </th>

            <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Title
            </th>

            <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </th>

            <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Priority
            </th>

          </tr>
        </thead>

        {/* Table Body */}

        <tbody>
          {recentTickets.map((ticket) => (
            <tr
              key={ticket._id || ticket.ticketId}
              onClick={() =>
                navigate(`/tickets/${ticket.ticketId}`)
              }
              className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer"
            >

              {/* ID */}

              <td className="py-4 px-3 text-sm font-medium text-slate-700">
                #{ticket.ticketId}
              </td>

              {/* Title */}

              <td className="py-4 px-3">
                <p className="text-sm font-medium text-slate-800">
                  {ticket.title}
                </p>
              </td>

              {/* Status */}

              <td className="py-4 px-3">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                    ticket.status
                  )}`}
                >
                  {ticket.status}
                </span>
              </td>

              {/* Priority */}

              <td
                className={`py-4 px-3 text-sm font-medium ${getPriorityStyle(
                  ticket.priority
                )}`}
              >
                {ticket.priority}
              </td>

            </tr>
          ))}
        </tbody>

      </table>
    </div>
  );
}

export default RecentTickets;