import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Layout from "../components/layout/Layout";
import TicketComments from "../components/ticket/TicketComments";

import TicketActivity from "../components/ticket/TicketActivity";

function TicketDetails() {
  const { id } = useParams();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          `http://localhost:5000/api/tickets/${id}`,
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
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-10 text-center text-gray-500 dark:text-slate-400">
          Loading ticket...
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

        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
          Ticket Not Found
        </h1>

        <p className="text-gray-500 dark:text-slate-400 mt-2">
          {error ||
            "The ticket you are looking for does not exist."}
        </p>

        <Link
          to="/tickets"
          className="inline-block mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700"
        >
          Back to Tickets
        </Link>

      </Layout>
    );
  }

  return (
    <Layout>

      {/* =========================
          HEADING
      ========================= */}

      <div className="flex justify-between items-start mb-8">

        <div>

          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
            Ticket Details
          </h1>

          <p className="text-gray-500 dark:text-slate-400 mt-2">
            View complete ticket information.
          </p>

        </div>

        <Link
          to={`/tickets/edit/${ticket.ticketId}`}
          className="bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700"
        >
          Edit Ticket
        </Link>

      </div>

      {/* =========================
          TICKET CARD
      ========================= */}

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-8 space-y-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Ticket ID */}

          <div>

            <p className="text-gray-500 dark:text-slate-400 text-sm">
              Ticket ID
            </p>

            <h3 className="font-semibold text-slate-800 dark:text-white mt-1">
              {ticket.ticketId}
            </h3>

          </div>

          {/* Title */}

          <div>

            <p className="text-gray-500 dark:text-slate-400 text-sm">
              Title
            </p>

            <h3 className="font-semibold text-slate-800 dark:text-white mt-1">
              {ticket.title}
            </h3>

          </div>

          {/* Category */}

          <div>

            <p className="text-gray-500 dark:text-slate-400 text-sm">
              Category
            </p>

            <h3 className="text-slate-800 dark:text-white mt-1">
              {ticket.category}
            </h3>

          </div>

          {/* Engineer */}

          <div>

            <p className="text-gray-500 dark:text-slate-400 text-sm">
              Assigned Engineer
            </p>

            <h3 className="text-slate-800 dark:text-white mt-1">
              {ticket.engineer || "Unassigned"}
            </h3>

          </div>

          {/* Priority */}

          <div>

            <p className="text-gray-500 dark:text-slate-400 text-sm mb-2">
              Priority
            </p>

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

          </div>

          {/* Status */}

          <div>

            <p className="text-gray-500 dark:text-slate-400 text-sm mb-2">
              Status
            </p>

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

          </div>

          {/* Description */}

          <div className="md:col-span-2">

            <p className="text-gray-500 dark:text-slate-400 text-sm mb-2">
              Description
            </p>

            <div className="border border-gray-200 dark:border-slate-600 rounded-xl p-4 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
              {ticket.description}
            </div>

          </div>

          {/* Created On */}

          <div>

            <p className="text-gray-500 dark:text-slate-400 text-sm">
              Created On
            </p>

            <h3 className="text-slate-800 dark:text-white mt-1">
              {ticket.createdAt
                ? new Date(
                    ticket.createdAt
                  ).toLocaleString()
                : "Not available"}
            </h3>

          </div>

        </div>

        {/* =========================
            BUTTONS
        ========================= */}

        <div className="flex justify-end gap-4 pt-4">

          <Link
            to="/tickets"
            className="border border-gray-300 dark:border-slate-600 text-slate-800 dark:text-white px-6 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            Back
          </Link>

          <Link
            to={`/tickets/edit/${ticket.ticketId}`}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700"
          >
            Edit Ticket
          </Link>

        </div>

      </div>

     {/* =========================
    TICKET COMMENTS
========================= */}

<TicketComments
  ticketId={ticket.ticketId}
/>

{/* =========================
    TICKET ACTIVITY
========================= */}

<TicketActivity
  ticketId={ticket.ticketId}
/>

    </Layout>
  );
}

export default TicketDetails;