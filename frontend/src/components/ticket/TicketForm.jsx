import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { addNotification } from "../../utils/notificationUtils";

function TicketForm({ mode = "create" }) {
  const navigate = useNavigate();
  const { id } = useParams();

  // =========================
  // FORM DATA
  // =========================

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    priority: "",
    status: "Open",
    engineer: "",
    description: "",
  });

  // =========================
  // ENGINEERS
  // =========================

  const [engineers, setEngineers] = useState([]);
  const [loadingEngineers, setLoadingEngineers] =
    useState(true);

  // =========================
  // LOADING / ERROR
  // =========================

  const [loading, setLoading] = useState(false);

  const [loadingTicket, setLoadingTicket] = useState(
    mode === "edit" && Boolean(id)
  );

  const [error, setError] = useState("");

  // =========================
  // FETCH ACTIVE ENGINEERS
  // =========================

  useEffect(() => {
    const fetchEngineers = async () => {
      try {
        setLoadingEngineers(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch(
          "http://localhost:5000/api/users",
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
              "Failed to fetch engineers"
          );
        }

        const activeEngineers = (
          data.users || []
        ).filter(
          (user) =>
            user.role === "Engineer" &&
            user.status === "Active"
        );

        setEngineers(activeEngineers);
      } catch (error) {
        console.error(
          "Fetch engineers error:",
          error
        );

        setError(
          error.message ||
            "Unable to load engineers."
        );
      } finally {
        setLoadingEngineers(false);
      }
    };

    fetchEngineers();
  }, [navigate]);

  // =========================
  // FETCH TICKET FOR EDIT
  // =========================

  useEffect(() => {
    if (mode !== "edit" || !id) {
      return;
    }

    const fetchTicket = async () => {
      try {
        setLoadingTicket(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login");
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
            data.message ||
              "Failed to fetch ticket"
          );
        }

        const ticket = data.ticket;

        setFormData({
          title: ticket.title || "",
          category: ticket.category || "",
          priority: ticket.priority || "",
          status: ticket.status || "Open",
          engineer: ticket.engineer || "",
          description: ticket.description || "",
        });
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
        setLoadingTicket(false);
      }
    };

    fetchTicket();
  }, [mode, id, navigate]);

  // =========================
  // HANDLE INPUT CHANGE
  // =========================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================
  // HANDLE SUBMIT
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // =========================
    // VALIDATION
    // =========================

    if (
      !formData.title ||
      !formData.category ||
      !formData.priority ||
      !formData.engineer ||
      !formData.description
    ) {
      setError(
        "Please fill all required fields."
      );

      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      // =========================
      // CREATE TICKET
      // =========================

      if (mode === "create") {
        const response = await fetch(
          "http://localhost:5000/api/tickets",
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },

            body: JSON.stringify({
              title: formData.title,
              description: formData.description,
              category: formData.category,
              priority: formData.priority,
              status: formData.status,
              engineer: formData.engineer,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to create ticket"
          );
        }

        // Notification respects ticketNotifications setting
        addNotification(
          `New ticket ${data.ticket.ticketId} has been created.`,
          "ticket"
        );

        alert(
          "Ticket created successfully!"
        );

        navigate("/tickets");

        return;
      }

      // =========================
      // UPDATE TICKET
      // =========================

      if (mode === "edit") {
        const response = await fetch(
          `http://localhost:5000/api/tickets/${id}`,
          {
            method: "PUT",

            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },

            body: JSON.stringify({
              title: formData.title,
              description: formData.description,
              category: formData.category,
              priority: formData.priority,
              status: formData.status,
              engineer: formData.engineer,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to update ticket"
          );
        }

        // Notification respects ticketNotifications setting
        addNotification(
          `Ticket ${id} has been updated.`,
          "ticket"
        );

        alert(
          "Ticket updated successfully!"
        );

        navigate("/tickets");
      }
    } catch (error) {
      console.error(
        "Ticket submit error:",
        error
      );

      setError(
        error.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOADING EDIT TICKET
  // =========================

  if (loadingTicket) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-10 text-center text-gray-500">
        Loading ticket...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>

      <div className="bg-white rounded-2xl shadow-md p-8">

        {/* =========================
            ERROR
        ========================= */}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* =========================
            FORM GRID
        ========================= */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* =========================
              TICKET TITLE
          ========================= */}

          <div>

            <label className="block font-medium mb-2">
              Ticket Title *
            </label>

            <input
              type="text"
              name="title"
              placeholder="Enter ticket title"
              value={formData.title}
              onChange={handleChange}
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />

          </div>

          {/* =========================
              CATEGORY
          ========================= */}

          <div>

            <label className="block font-medium mb-2">
              Category *
            </label>

            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            >

              <option value="">
                Select Category
              </option>

              <option value="Bug">
                Bug
              </option>

              <option value="Feature Request">
                Feature Request
              </option>

              <option value="Support">
                Support
              </option>

            </select>

          </div>

          {/* =========================
              PRIORITY
          ========================= */}

          <div>

            <label className="block font-medium mb-2">
              Priority *
            </label>

            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            >

              <option value="">
                Select Priority
              </option>

              <option value="High">
                High
              </option>

              <option value="Medium">
                Medium
              </option>

              <option value="Low">
                Low
              </option>

            </select>

          </div>

          {/* =========================
              STATUS
          ========================= */}

          <div>

            <label className="block font-medium mb-2">
              Status *
            </label>

            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            >

              <option value="Open">
                Open
              </option>

              <option value="In Progress">
                In Progress
              </option>

              <option value="Closed">
                Closed
              </option>

            </select>

          </div>

          {/* =========================
              ENGINEER
          ========================= */}

          <div className="md:col-span-2">

            <label className="block font-medium mb-2">
              Assign Engineer *
            </label>

            <select
              name="engineer"
              value={formData.engineer}
              onChange={handleChange}
              disabled={loadingEngineers}
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            >

              <option value="">
                {loadingEngineers
                  ? "Loading Engineers..."
                  : "Select Engineer"}
              </option>

              {engineers.map(
                (engineer) => (
                  <option
                    key={
                      engineer._id ||
                      engineer.id
                    }
                    value={engineer.name}
                  >
                    {engineer.name}
                  </option>
                )
              )}

            </select>

            {!loadingEngineers &&
              engineers.length === 0 && (
                <p className="text-sm text-red-500 mt-2">
                  No active engineers available.
                  Please add an active Engineer
                  from User Management.
                </p>
              )}

          </div>

          {/* =========================
              DESCRIPTION
          ========================= */}

          <div className="md:col-span-2">

            <label className="block font-medium mb-2">
              Description *
            </label>

            <textarea
              name="description"
              rows={6}
              placeholder="Describe the issue..."
              value={formData.description}
              onChange={handleChange}
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />

          </div>

        </div>

        {/* =========================
            BUTTONS
        ========================= */}

        <div className="flex justify-end gap-4 mt-8">

          <button
            type="button"
            onClick={() =>
              navigate("/tickets")
            }
            className="px-6 py-3 rounded-xl border border-gray-300 hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              loading ||
              loadingEngineers
            }
            className="px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
          >

            {loading
              ? mode === "edit"
                ? "Updating..."
                : "Creating..."
              : mode === "edit"
              ? "Update Ticket"
              : "Create Ticket"}

          </button>

        </div>

      </div>

    </form>
  );
}

export default TicketForm;