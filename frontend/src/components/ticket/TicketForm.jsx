import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { addNotification } from "../../utils/notificationUtils";

function TicketForm({ mode = "create" }) {
  const navigate = useNavigate();
  const { id } = useParams();

  // Get engineers from User Management
  const engineers = (() => {
    const savedUsers =
      JSON.parse(localStorage.getItem("users")) || [];
return savedUsers.filter(
  (user) =>
    user.role === "Engineer" &&
    user.status === "Active"
);
  })();

  // Load existing ticket when Edit mode is active
  const [formData, setFormData] = useState(() => {
    if (mode === "edit" && id) {
      const existingTickets =
        JSON.parse(localStorage.getItem("tickets")) || [];

      const existingTicket = existingTickets.find(
        (ticket) => ticket.id === id
      );

      if (existingTicket) {
        return {
          title: existingTicket.title || "",
          category: existingTicket.category || "",
          priority: existingTicket.priority || "",
          status: existingTicket.status || "Open",
          engineer: existingTicket.engineer || "",
          description: existingTicket.description || "",
        };
      }
    }

    return {
      title: "",
      category: "",
      priority: "",
      status: "Open",
      engineer: "",
      description: "",
    };
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (
      !formData.title ||
      !formData.category ||
      !formData.priority ||
      !formData.engineer ||
      !formData.description
    ) {
      alert("Please fill all required fields.");
      return;
    }

    const existingTickets =
      JSON.parse(localStorage.getItem("tickets")) || [];

    // EDIT
    if (mode === "edit") {
      const ticketExists = existingTickets.some(
        (ticket) => ticket.id === id
      );

      if (!ticketExists) {
        alert("Ticket not found.");
        return;
      }

      const updatedTickets = existingTickets.map((ticket) =>
        ticket.id === id
          ? {
              ...ticket,
              ...formData,
            }
          : ticket
      );

     localStorage.setItem(
  "tickets",
  JSON.stringify(updatedTickets)
);

addNotification(
  `Ticket ${id} has been updated.`
);

alert("Ticket updated successfully!");

navigate("/tickets");
      return;
    }

    // CREATE
    const newTicket = {
      id: `TKT-${1001 + existingTickets.length}`,
      ...formData,
    };

    const updatedTickets = [
      ...existingTickets,
      newTicket,
    ];

    localStorage.setItem(
  "tickets",
  JSON.stringify(updatedTickets)
);

addNotification(
  `New ticket ${newTicket.id} has been created.`
);

alert("Ticket created successfully!");

navigate("/tickets");
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-white rounded-2xl shadow-md p-8">

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
            className="px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
          >
            {mode === "edit"
              ? "Update Ticket"
              : "Create Ticket"}
          </button>

        </div>

      </div>
    </form>
  );
}

export default TicketForm;