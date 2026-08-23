import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function RecentTickets() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================
  // FETCH RECENT TICKETS
  // =========================

  useEffect(() => {
    const fetchRecentTickets = async () => {
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
              "Failed to fetch recent tickets"
          );
        }

        // Backend already returns newest tickets first.
        // Show only latest 5.
        setTickets(
          (data.tickets || []).slice(0, 5)
        );
      } catch (error) {
        console.error(
          "Recent tickets error:",
          error
        );

        setError(
          error.message ||
            "Unable to load recent tickets."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRecentTickets();
  }, [navigate]);

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
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-slate-500">
          Loading recent tickets...
        </p>
      </div>
    );
  }

  // =========================
  // ERROR
  // =========================

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-red-500">
          {error}
        </p>
      </div>
    );
  }

  return (
    <>
      {tickets.length === 0 ? (
        <div className="py-12 text-center">

          <p className="text-sm text-slate-500">
            No recent tickets found.
          </p>

          <p className="text-xs text-slate-400 mt-1">
            Newly created tickets will appear here.
          </p>

        </div>
      ) : (
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

              {tickets.map((ticket) => (

                <tr
                  key={ticket.ticketId}
                  onClick={() =>
                    navigate(
                      `/tickets/${ticket.ticketId}`
                    )
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
      )}
    </>
  );
}

export default RecentTickets;