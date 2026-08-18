import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";

import DeleteModal from "../ui/DeleteModal";

function TicketTable({
  search,
  status,
  priority,
  category,
}) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);

  const ticketsPerPage = 5;

  // Default tickets
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

  // Status styling
  const getStatusStyle = (ticketStatus) => {
    switch (ticketStatus) {
      case "Open":
        return "bg-blue-50 text-blue-600";

      case "In Progress":
        return "bg-amber-50 text-amber-600";

      case "Closed":
        return "bg-emerald-50 text-emerald-600";

      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  // Priority styling
  const getPriorityStyle = (ticketPriority) => {
    switch (ticketPriority) {
      case "High":
        return "bg-red-50 text-red-600";

      case "Medium":
        return "bg-amber-50 text-amber-600";

      case "Low":
        return "bg-emerald-50 text-emerald-600";

      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <>
      {/* Ticket Table Card */}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">

        {/* Table */}

        <div className="overflow-x-auto">

          <table className="w-full">

            {/* Table Header */}

            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">

                <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Ticket ID
                </th>

                <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Title
                </th>

                <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Category
                </th>

                <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Priority
                </th>

                <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>

                <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Engineer
                </th>

                <th className="text-center px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>

              </tr>
            </thead>

            {/* Table Body */}

            <tbody>

              {currentTickets.length === 0 ? (

                <tr>
                  <td
                    colSpan="7"
                    className="py-14 text-center"
                  >
                    <div className="flex flex-col items-center">

                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                        <Eye
                          size={22}
                          className="text-slate-400"
                        />
                      </div>

                      <p className="text-sm font-medium text-slate-700">
                        No tickets found
                      </p>

                      <p className="text-xs text-slate-400 mt-1">
                        Try changing your search or filters.
                      </p>

                    </div>
                  </td>
                </tr>

              ) : (

                currentTickets.map((ticket) => (

                  <tr
                    key={ticket.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                  >

                    {/* Ticket ID */}

                    <td className="px-6 py-5">

                      <span className="text-sm font-semibold text-blue-600">
                        {ticket.id}
                      </span>

                    </td>

                    {/* Title */}

                    <td className="px-6 py-5">

                      <p className="text-sm font-medium text-slate-800">
                        {ticket.title}
                      </p>

                      <p className="text-xs text-slate-400 mt-1 max-w-xs truncate">
                        {ticket.description}
                      </p>

                    </td>

                    {/* Category */}

                    <td className="px-6 py-5">

                      <span className="text-sm text-slate-600">
                        {ticket.category}
                      </span>

                    </td>

                    {/* Priority */}

                    <td className="px-6 py-5">

                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getPriorityStyle(
                          ticket.priority
                        )}`}
                      >
                        {ticket.priority}
                      </span>

                    </td>

                    {/* Status */}

                    <td className="px-6 py-5">

                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(
                          ticket.status
                        )}`}
                      >
                        {ticket.status}
                      </span>

                    </td>

                    {/* Engineer */}

                    <td className="px-6 py-5">

                      <div className="flex items-center gap-2">

                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-semibold">
                          {ticket.engineer
                            ? ticket.engineer
                                .charAt(0)
                                .toUpperCase()
                            : "?"}
                        </div>

                        <span className="text-sm text-slate-600">
                          {ticket.engineer}
                        </span>

                      </div>

                    </td>

                    {/* Actions */}

                    <td className="px-6 py-5">

                      <div className="flex justify-center items-center gap-2">

                        {/* View */}

                        <Link
                          to={`/tickets/${ticket.id}`}
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-50 transition"
                          title="View Ticket"
                        >
                          <Eye size={18} />
                        </Link>

                        {/* Edit */}

                        <Link
                          to={`/tickets/edit/${ticket.id}`}
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition"
                          title="Edit Ticket"
                        >
                          <Pencil size={18} />
                        </Link>

                        {/* Delete */}

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTicket(ticket.id);
                            setIsDeleteOpen(true);
                          }}
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition"
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

        </div>

        {/* Pagination */}

        {filteredTickets.length > 0 && (

          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">

            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-medium text-slate-700">
                {indexOfFirstTicket + 1}
              </span>
              {" "}to{" "}
              <span className="font-medium text-slate-700">
                {Math.min(
                  indexOfLastTicket,
                  filteredTickets.length
                )}
              </span>
              {" "}of{" "}
              <span className="font-medium text-slate-700">
                {filteredTickets.length}
              </span>
              {" "}tickets
            </p>

            <div className="flex items-center gap-2">

              <button
                type="button"
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.max(prev - 1, 1)
                  )
                }
                disabled={safeCurrentPage === 1}
                className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>

              <div className="px-3 py-2 text-sm font-medium text-slate-700 bg-slate-50 rounded-lg">
                {safeCurrentPage} / {totalPages}
              </div>

              <button
                type="button"
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(prev + 1, totalPages)
                  )
                }
                disabled={
                  safeCurrentPage === totalPages
                }
                className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next
              </button>

            </div>

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