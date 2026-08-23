import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Pencil, Trash2 } from "lucide-react";
import DeleteModal from "../ui/DeleteModal";

function TicketTable({
  search,
  status,
  priority,
  category,
}) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const ticketsPerPage = 2;

  // =========================
  // FETCH TICKETS
  // =========================

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication required. Please login.");
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
          data.message || "Failed to fetch tickets"
        );
      }

      setTickets(data.tickets || []);
    } catch (error) {
      console.error("Fetch tickets error:", error);

      setError(
        error.message ||
          "Unable to load tickets."
      );
    } finally {
      setLoading(false);
    }
  };

 useEffect(() => {
  const loadTickets = async () => {
    await fetchTickets();
  };

  loadTickets();
}, []);

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
        `http://localhost:5000/api/tickets/${selectedTicket}`,
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

      // Remove deleted ticket from UI
      const updatedTickets = tickets.filter(
        (ticket) =>
          ticket.ticketId !== selectedTicket
      );

      setTickets(updatedTickets);

      setIsDeleteOpen(false);
      setSelectedTicket(null);

      // Fix pagination after deletion
      const totalPages = Math.ceil(
        updatedTickets.length / ticketsPerPage
      );

      if (
        currentPage > totalPages &&
        totalPages > 0
      ) {
        setCurrentPage(totalPages);
      }

      if (updatedTickets.length === 0) {
        setCurrentPage(1);
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
  // SEARCH + FILTER
  // =========================

  const filteredTickets = tickets.filter(
    (ticket) => {
      const searchText =
        search.toLowerCase();

      const matchesSearch =
        ticket.ticketId
          ?.toLowerCase()
          .includes(searchText) ||
        ticket.title
          ?.toLowerCase()
          .includes(searchText) ||
        ticket.description
          ?.toLowerCase()
          .includes(searchText) ||
        ticket.engineer
          ?.toLowerCase()
          .includes(searchText);

      const matchesStatus =
        status === "" ||
        ticket.status === status;

      const matchesPriority =
        priority === "" ||
        ticket.priority === priority;

      const matchesCategory =
        category === "" ||
        ticket.category === category;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesCategory
      );
    }
  );

  // =========================
  // PAGINATION
  // =========================

  const totalPages = Math.ceil(
    filteredTickets.length /
      ticketsPerPage
  );

  const safeCurrentPage =
    totalPages > 0
      ? Math.min(currentPage, totalPages)
      : 1;

  const indexOfLastTicket =
    safeCurrentPage * ticketsPerPage;

  const indexOfFirstTicket =
    indexOfLastTicket -
    ticketsPerPage;

  const currentTickets =
    filteredTickets.slice(
      indexOfFirstTicket,
      indexOfLastTicket
    );

  // =========================
  // RESET PAGE WHEN FILTER CHANGES
  // =========================


  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-10 text-center text-gray-500">
        Loading tickets...
      </div>
    );
  }

  return (
    <>
      {/* Error Message */}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-md overflow-hidden">

        {/* Table */}

        <table className="w-full">

          <thead className="bg-slate-100">

            <tr>

              <th className="text-left p-4">
                Ticket ID
              </th>

              <th className="text-left p-4">
                Title
              </th>

              <th className="text-left p-4">
                Category
              </th>

              <th className="text-left p-4">
                Priority
              </th>

              <th className="text-left p-4">
                Status
              </th>

              <th className="text-left p-4">
                Engineer
              </th>

              <th className="text-center p-4">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {currentTickets.length === 0 ? (

              <tr>

                <td
                  colSpan="7"
                  className="text-center py-10 text-gray-500"
                >
                  No tickets found.
                </td>

              </tr>

            ) : (

              currentTickets.map(
                (ticket) => (

                  <tr
                    key={ticket.ticketId}
                    className="border-t hover:bg-slate-50 transition"
                  >

                    {/* Ticket ID */}

                    <td className="p-4 font-medium">
                      {ticket.ticketId}
                    </td>

                    {/* Title */}

                    <td className="p-4">
                      {ticket.title}
                    </td>

                    {/* Category */}

                    <td className="p-4">
                      {ticket.category}
                    </td>

                    {/* Priority */}

                    <td className="p-4">

                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          ticket.priority ===
                          "High"
                            ? "bg-red-100 text-red-600"
                            : ticket.priority ===
                              "Medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-600"
                        }`}
                      >
                        {ticket.priority}
                      </span>

                    </td>

                    {/* Status */}

                    <td className="p-4">

                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          ticket.status ===
                          "Open"
                            ? "bg-blue-100 text-blue-700"
                            : ticket.status ===
                              "In Progress"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {ticket.status}
                      </span>

                    </td>

                    {/* Engineer */}

                    <td className="p-4">
                      {ticket.engineer ||
                        "Unassigned"}
                    </td>

                    {/* Actions */}

                    <td className="p-4">

                      <div className="flex justify-center gap-4">

                        {/* View */}

                        <Link
                          to={`/tickets/${ticket.ticketId}`}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Ticket"
                        >
                          <Eye size={18} />
                        </Link>

                        {/* Edit */}

                        <Link
                          to={`/tickets/edit/${ticket.ticketId}`}
                          className="text-green-600 hover:text-green-800"
                          title="Edit Ticket"
                        >
                          <Pencil size={18} />
                        </Link>

                        {/* Delete */}

                        <button
                          onClick={() => {
                            setSelectedTicket(
                              ticket.ticketId
                            );

                            setIsDeleteOpen(true);
                          }}
                          className="text-red-600 hover:text-red-800"
                          title="Delete Ticket"
                        >
                          <Trash2 size={18} />
                        </button>

                      </div>

                    </td>

                  </tr>

                )
              )

            )}

          </tbody>

        </table>

        {/* Pagination */}

        {filteredTickets.length > 0 && (

          <div className="flex items-center justify-between px-6 py-4 border-t">

            <button
              onClick={() =>
                setCurrentPage(
                  (prev) =>
                    Math.max(
                      prev - 1,
                      1
                    )
                )
              }
              disabled={
                safeCurrentPage === 1
              }
              className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              Previous
            </button>

            <span className="text-sm font-medium">
              Page {safeCurrentPage} of{" "}
              {totalPages}
            </span>

            <button
              onClick={() =>
                setCurrentPage(
                  (prev) =>
                    Math.min(
                      prev + 1,
                      totalPages
                    )
                )
              }
              disabled={
                safeCurrentPage ===
                totalPages
              }
              className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              Next
            </button>

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