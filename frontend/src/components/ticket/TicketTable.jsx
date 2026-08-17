import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Pencil, Trash2 } from "lucide-react";
import DeleteModal from "../ui/DeleteModal";

function TicketTable({ search, status, priority, category }) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);

  const ticketsPerPage = 2;

  // Default tickets - only used when localStorage has never been initialized
  const defaultTickets = [
    {
      id: "TKT-1001",
      title: "Login Issue",
      description: "User unable to login into portal.",
      category: "Bug",
      priority: "High",
      status: "Open",
      engineer: "Rahul Sharma",
    },
    {
      id: "TKT-1002",
      title: "Payment Failed",
      description: "Payment gateway timeout.",
      category: "Support",
      priority: "Medium",
      status: "In Progress",
      engineer: "Aman Khan",
    },
    {
      id: "TKT-1003",
      title: "Email Not Working",
      description: "Email notification feature request.",
      category: "Feature Request",
      priority: "Low",
      status: "Closed",
      engineer: "Priya Singh",
    },
  ];

  // Load tickets from localStorage
  const [tickets, setTickets] = useState(() => {
    const savedTickets = localStorage.getItem("tickets");

    if (savedTickets !== null) {
      return JSON.parse(savedTickets);
    }

    localStorage.setItem(
      "tickets",
      JSON.stringify(defaultTickets)
    );

    return defaultTickets;
  });

  // Delete ticket
  const handleDelete = () => {
    const updatedTickets = tickets.filter(
      (ticket) => ticket.id !== selectedTicket
    );

    setTickets(updatedTickets);

    localStorage.setItem(
      "tickets",
      JSON.stringify(updatedTickets)
    );

    setIsDeleteOpen(false);
    setSelectedTicket(null);

    const totalPages = Math.ceil(
      updatedTickets.length / ticketsPerPage
    );

    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }

    if (updatedTickets.length === 0) {
      setCurrentPage(1);
    }
  };

  // Search + Filters
  const filteredTickets = tickets.filter((ticket) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      ticket.id.toLowerCase().includes(searchText) ||
      ticket.title.toLowerCase().includes(searchText) ||
      ticket.description.toLowerCase().includes(searchText) ||
      ticket.engineer.toLowerCase().includes(searchText);

    const matchesStatus =
      status === "" || ticket.status === status;

    const matchesPriority =
      priority === "" || ticket.priority === priority;

    const matchesCategory =
      category === "" || ticket.category === category;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPriority &&
      matchesCategory
    );
  });

  // Pagination
  const totalPages = Math.ceil(
    filteredTickets.length / ticketsPerPage
  );

  const safeCurrentPage =
    totalPages > 0
      ? Math.min(currentPage, totalPages)
      : 1;

  const indexOfLastTicket =
    safeCurrentPage * ticketsPerPage;

  const indexOfFirstTicket =
    indexOfLastTicket - ticketsPerPage;

  const currentTickets = filteredTickets.slice(
    indexOfFirstTicket,
    indexOfLastTicket
  );

  return (
    <>
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
              currentTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="border-t hover:bg-slate-50 transition"
                >

                  {/* Ticket ID */}
                  <td className="p-4 font-medium">
                    {ticket.id}
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
                        ticket.priority === "High"
                          ? "bg-red-100 text-red-600"
                          : ticket.priority === "Medium"
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
                        ticket.status === "Open"
                          ? "bg-blue-100 text-blue-700"
                          : ticket.status === "In Progress"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </td>

                  {/* Engineer */}
                  <td className="p-4">
                    {ticket.engineer}
                  </td>

                  {/* Actions */}
                  <td className="p-4">
                    <div className="flex justify-center gap-4">

                      {/* View */}
                      <Link
                        to={`/tickets/${ticket.id}`}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Ticket"
                      >
                        <Eye size={18} />
                      </Link>

                      {/* Edit */}
                      <Link
                        to={`/tickets/edit/${ticket.id}`}
                        className="text-green-600 hover:text-green-800"
                        title="Edit Ticket"
                      >
                        <Pencil size={18} />
                      </Link>

                      {/* Delete */}
                      <button
                        onClick={() => {
                          setSelectedTicket(ticket.id);
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
              ))
            )}

          </tbody>
        </table>

        {/* Pagination */}
        {filteredTickets.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">

            <button
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.max(prev - 1, 1)
                )
              }
              disabled={safeCurrentPage === 1}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              Previous
            </button>

            <span className="text-sm font-medium">
              Page {safeCurrentPage} of {totalPages}
            </span>

            <button
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(prev + 1, totalPages)
                )
              }
              disabled={safeCurrentPage === totalPages}
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