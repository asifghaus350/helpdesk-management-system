import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { addNotification } from "../../utils/notificationUtils";

function TicketForm({ mode = "create" }) {
  const navigate = useNavigate();
  const { id } = useParams();

  

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    priority: "",
    status: "Open",
    engineer: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [loadingTicket, setLoadingTicket] = useState(
  mode === "edit" && Boolean(id)
);
  const [error, setError] = useState("");

  // =========================
  // FETCH ENGINEERS
  // =========================

 const engineers =
  JSON.parse(localStorage.getItem("users"))?.filter(
    (user) =>
      user.role === "Engineer" &&
      user.status === "Active"
  ) || [];
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
            data.message || "Failed to fetch ticket"
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

    // Validation
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
      // CREATE
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

        addNotification(
          `New ticket ${data.ticket.ticketId} has been created.`
        );

        alert("Ticket created successfully!");

        navigate("/tickets");

        return;
      }

      // =========================
      // UPDATE
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

        addNotification(
          `Ticket ${id} has been updated.`
        );

        alert("Ticket updated successfully!");

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

        {/* Error */}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Form Grid */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Ticket Title */}

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

          {/* Category */}

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

          {/* Priority */}

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

          {/* Status */}

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

          {/* Engineer */}

          <div className="md:col-span-2">

            <label className="block font-medium mb-2">
              Assign Engineer *
            </label>

            <select
              name="engineer"
              value={formData.engineer}
              onChange={handleChange}
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">
                Select Engineer
              </option>

              {engineers.map((engineer) => (
                <option
                  key={engineer.id}
                  value={engineer.name}
                >
                  {engineer.name}
                </option>
              ))}
            </select>

            {engineers.length === 0 && (
              <p className="text-sm text-red-500 mt-2">
                No engineers available. Please add an Engineer
                from User Management.
              </p>
            )}

          </div>

          {/* Description */}

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

        {/* Buttons */}

        <div className="flex justify-end gap-4 mt-8">

          <button
            type="button"
            onClick={() => navigate("/tickets")}
            className="px-6 py-3 rounded-xl border border-gray-300 hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
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