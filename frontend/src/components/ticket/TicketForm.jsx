import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Bug,
  LifeBuoy,
  Lightbulb,
  UserCog,
  CircleAlert,
  CheckCircle,
  LoaderCircle,
  Save,
  Send,
} from "lucide-react";

import { addNotification } from "../../utils/notificationUtils";
import { initials } from "../../utils/format";

function TicketForm({ mode = "create" }) {
  const navigate = useNavigate();
  const { id } = useParams();

  // =========================
  // CURRENT USER / ROLE
  // =========================

  const storedUser = localStorage.getItem("user");

  let currentUser = null;

  try {
    currentUser = storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("User parse error:", error);
  }

  const userRole = currentUser?.role || "";

  const isAdmin = userRole === "Admin";
  const isEngineer = userRole === "Engineer";


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

  // Display name of the engineer currently on the ticket
  // (formData.engineer holds their id)
  const [assignedEngineerName, setAssignedEngineerName] =
    useState("");
  const [loadingEngineers, setLoadingEngineers] = useState(false);

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
  // ADMIN ONLY
  // =========================

 useEffect(() => {
  if (!isAdmin) {
    return;
  }

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
          "http://localhost:5000/api/users?role=Engineer&status=Active",
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
            data.message || "Failed to fetch engineers"
          );
        }

        const activeEngineers = (data.users || []).filter(
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
  }, [isAdmin, navigate]);

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

        setAssignedEngineerName(ticket.engineer || "");

        setFormData({
          title: ticket.title || "",
          category: ticket.category || "",
          priority: ticket.priority || "",
          status: ticket.status || "Open",
          // Select holds the engineer's user id
          engineer:
            ticket.engineerId?._id ||
            ticket.engineerId ||
            "",
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
      !formData.description
    ) {
      setError(
        "Please fill all required fields."
      );

      return;
    }

    // Engineer assignment is required only for Admin
    if (isAdmin && !formData.engineer) {
      setError(
        "Please assign an Engineer to this ticket."
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
        const createBody = {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          priority: formData.priority,
          status: formData.status,
        };

        // Only Admin can assign an engineer
        if (isAdmin) {
          createBody.engineer = formData.engineer;
        }

        const response = await fetch(
          "http://localhost:5000/api/tickets",
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },

            body: JSON.stringify(createBody),
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
        const updateBody = {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          priority: formData.priority,
          status: formData.status,
        };

        // Only Admin can assign/reassign engineer
        if (isAdmin) {
          updateBody.engineer = formData.engineer;
        }

        const response = await fetch(
          `http://localhost:5000/api/tickets/${id}`,
          {
            method: "PUT",

            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },

            body: JSON.stringify(updateBody),
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
  // FORM OPTIONS
  // =========================

  const categoryOptions = [
    {
      value: "Bug",
      label: "Bug",
      description: "Something isn't working",
      icon: Bug,
      active: "border-red-300 bg-red-50 ring-red-100",
      iconClass: "bg-red-100 text-red-600",
    },
    {
      value: "Support",
      label: "Support",
      description: "Need help or have a question",
      icon: LifeBuoy,
      active: "border-blue-300 bg-blue-50 ring-blue-100",
      iconClass: "bg-blue-100 text-blue-600",
    },
    {
      value: "Feature Request",
      label: "Feature Request",
      description: "Suggest an improvement",
      icon: Lightbulb,
      active: "border-violet-300 bg-violet-50 ring-violet-100",
      iconClass: "bg-violet-100 text-violet-600",
    },
  ];

  const priorityOptions = [
    {
      value: "Low",
      hint: "Can wait",
      active: "border-emerald-400 bg-emerald-50 text-emerald-700",
      dot: "bg-emerald-500",
    },
    {
      value: "Medium",
      hint: "Normal",
      active: "border-amber-400 bg-amber-50 text-amber-700",
      dot: "bg-amber-500",
    },
    {
      value: "High",
      hint: "Urgent",
      active: "border-red-400 bg-red-50 text-red-700",
      dot: "bg-red-500",
    },
  ];

  const statusOptions = [
    {
      value: "Open",
      active: "border-blue-400 bg-blue-50 text-blue-700",
      dot: "bg-blue-500",
    },
    {
      value: "In Progress",
      active: "border-amber-400 bg-amber-50 text-amber-700",
      dot: "bg-amber-500",
    },
    {
      value: "Closed",
      active: "border-emerald-400 bg-emerald-50 text-emerald-700",
      dot: "bg-emerald-500",
    },
  ];

  const showStatus =
    isAdmin || (mode === "edit" && isEngineer);

  const selectedEngineerName =
    engineers.find(
      (engineer) =>
        String(engineer._id || engineer.id) ===
        String(formData.engineer)
    )?.name || assignedEngineerName;

  // Radio-style buttons write through the same handler
  const setField = (name, value) =>
    handleChange({ target: { name, value } });

  const TITLE_MAX = 120;
  const DESCRIPTION_MAX = 2000;

  const labelClass =
    "block text-sm font-semibold text-slate-700 mb-2";

  const sectionTitleClass =
    "text-xs font-semibold uppercase tracking-wide text-slate-500";

  // =========================
  // LOADING EDIT TICKET
  // =========================

  if (loadingTicket) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-pulse">
        <div className="xl:col-span-2 h-140 rounded-2xl bg-slate-200" />
        <div className="h-72 rounded-2xl bg-slate-200" />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start"
    >

      {/* =========================
          MAIN FORM CARD
      ========================= */}

      <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm">

        {/* =========================
            ERROR
        ========================= */}

        {error && (
          <div className="m-6 mb-0 flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
            <CircleAlert size={18} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* =========================
            DETAILS
        ========================= */}

        <div className="p-6 space-y-5">
          <p className={sectionTitleClass}>
            Ticket details
          </p>

          {/* TITLE */}

          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="ticket-title"
                className={labelClass}
              >
                Title <span className="text-red-500">*</span>
              </label>

              <span className="text-xs text-slate-400 mb-2">
                {formData.title.length}/{TITLE_MAX}
              </span>
            </div>

            <input
              id="ticket-title"
              type="text"
              name="title"
              maxLength={TITLE_MAX}
              placeholder="e.g. Unable to connect to office VPN"
              value={formData.title}
              onChange={handleChange}
              className="w-full h-12 border border-slate-300 rounded-xl px-4 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
            />
          </div>

          {/* DESCRIPTION */}

          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="ticket-description"
                className={labelClass}
              >
                Description <span className="text-red-500">*</span>
              </label>

              <span className="text-xs text-slate-400 mb-2">
                {formData.description.length}/{DESCRIPTION_MAX}
              </span>
            </div>

            <textarea
              id="ticket-description"
              name="description"
              rows={6}
              maxLength={DESCRIPTION_MAX}
              placeholder="What happened? What did you expect? Include steps to reproduce and any error messages."
              value={formData.description}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-800 leading-relaxed outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition resize-y min-h-36"
            />
          </div>
        </div>

        {/* =========================
            CLASSIFICATION
        ========================= */}

        <div className="p-6 space-y-5 border-t border-slate-100">
          <p className={sectionTitleClass}>
            Classification
          </p>

          {/* CATEGORY */}

          <div>
            <p className={labelClass}>
              Category <span className="text-red-500">*</span>
            </p>

            <div
              role="radiogroup"
              aria-label="Category"
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              {categoryOptions.map((option) => {
                const Icon = option.icon;
                const isActive =
                  formData.category === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    onClick={() =>
                      setField("category", option.value)
                    }
                    className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition ${
                      isActive
                        ? `${option.active} ring-2`
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${option.iconClass}`}
                    >
                      <Icon size={19} />
                    </span>

                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-800">
                        {option.label}
                      </span>

                      <span className="block text-xs text-slate-500 mt-0.5">
                        {option.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className={`grid grid-cols-1 ${
              showStatus ? "lg:grid-cols-2" : ""
            } gap-5`}
          >
            {/* PRIORITY */}

            <div>
              <p className={labelClass}>
                Priority <span className="text-red-500">*</span>
              </p>

              <div
                role="radiogroup"
                aria-label="Priority"
                className="grid grid-cols-3 gap-2"
              >
                {priorityOptions.map((option) => {
                  const isActive =
                    formData.priority === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      onClick={() =>
                        setField("priority", option.value)
                      }
                      className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-sm font-semibold transition ${
                        isActive
                          ? option.active
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${option.dot}`}
                        />
                        {option.value}
                      </span>

                      <span className="text-[11px] font-normal text-slate-500">
                        {option.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STATUS (Admin, or Engineer while editing) */}

            {showStatus && (
              <div>
                <p className={labelClass}>
                  Status <span className="text-red-500">*</span>
                </p>

                <div
                  role="radiogroup"
                  aria-label="Status"
                  className="grid grid-cols-3 gap-2"
                >
                  {statusOptions.map((option) => {
                    const isActive =
                      formData.status === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        onClick={() =>
                          setField("status", option.value)
                        }
                        className={`flex items-center justify-center gap-2 py-3 px-2 rounded-xl border-2 text-sm font-semibold whitespace-nowrap transition ${
                          isActive
                            ? option.active
                            : "border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${option.dot}`}
                        />
                        {option.value}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =========================
            ASSIGNMENT
        ========================= */}

        {(isAdmin ||
          (mode === "edit" && isEngineer && assignedEngineerName)) && (
          <div className="p-6 space-y-5 border-t border-slate-100">
            <p className={sectionTitleClass}>
              Assignment
            </p>

            {/* ADMIN: CHOOSE ENGINEER */}

            {isAdmin && (
              <div>
                <label
                  htmlFor="ticket-engineer"
                  className={labelClass}
                >
                  Assign Engineer <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <UserCog
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />

                  <select
                    id="ticket-engineer"
                    name="engineer"
                    value={formData.engineer}
                    onChange={handleChange}
                    disabled={loadingEngineers}
                    className="w-full h-12 border border-slate-300 rounded-xl pl-11 pr-4 text-sm text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed transition"
                  >
                    <option value="">
                      {loadingEngineers
                        ? "Loading engineers..."
                        : "Select an engineer"}
                    </option>

                    {engineers.map((engineer) => (
                      <option
                        key={
                          engineer._id ||
                          engineer.id
                        }
                        value={engineer._id || engineer.id}
                      >
                        {engineer.name}
                      </option>
                    ))}
                  </select>
                </div>

                {!loadingEngineers &&
                  engineers.length === 0 && (
                    <p className="flex items-center gap-1.5 text-sm text-red-500 mt-2">
                      <CircleAlert size={15} />
                      No active engineers available. Add one from User Management.
                    </p>
                  )}

                {mode === "edit" &&
                  assignedEngineerName && (
                    <p className="text-sm text-slate-500 mt-2">
                      Currently assigned to{" "}
                      <span className="font-medium text-slate-700">
                        {assignedEngineerName}
                      </span>
                    </p>
                  )}
              </div>
            )}

            {/* ENGINEER: READ-ONLY */}

            {mode === "edit" &&
              isEngineer &&
              assignedEngineerName && (
                <div>
                  <p className={labelClass}>
                    Assigned Engineer
                  </p>

                  <div className="flex items-center gap-3 border border-slate-200 rounded-xl px-4 py-3 bg-slate-50">
                    <span className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                      {initials(assignedEngineerName)}
                    </span>

                    <span className="text-sm font-medium text-slate-700">
                      {assignedEngineerName}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-2">
                    Only an Admin can change the assignment.
                  </p>
                </div>
              )}
          </div>
        )}

        {/* =========================
            BUTTONS
        ========================= */}

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/60 rounded-b-2xl">
          <p className="text-xs text-slate-500">
            Fields marked <span className="text-red-500">*</span> are required.
          </p>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() =>
                navigate(-1)
              }
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                loadingEngineers
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm disabled:bg-blue-300 disabled:cursor-not-allowed transition"
            >
              {loading ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : mode === "edit" ? (
                <Save size={17} />
              ) : (
                <Send size={17} />
              )}

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
      </div>

      {/* =========================
          SIDE PANEL
      ========================= */}

      <aside className="space-y-6 xl:sticky xl:top-6">

        {/* LIVE PREVIEW */}

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <p className={`${sectionTitleClass} mb-4`}>
            Preview
          </p>

          <p
            className={`text-base font-semibold wrap-break-word ${
              formData.title
                ? "text-slate-800"
                : "text-slate-400 italic"
            }`}
          >
            {formData.title || "Your ticket title"}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            {mode === "edit" ? `#${id}` : "New ticket"}
            {formData.category && ` · ${formData.category}`}
          </p>

          <div className="flex flex-wrap gap-2 mt-4">
            {formData.priority && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-700">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    priorityOptions.find(
                      (option) =>
                        option.value === formData.priority
                    )?.dot
                  }`}
                />
                {formData.priority} priority
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-700">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  statusOptions.find(
                    (option) =>
                      option.value === formData.status
                  )?.dot || "bg-blue-500"
                }`}
              />
              {showStatus ? formData.status : "Open"}
            </span>
          </div>

          <div className="flex items-center gap-2.5 mt-4 pt-4 border-t border-slate-100">
            {selectedEngineerName ? (
              <>
                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                  {initials(selectedEngineerName)}
                </span>

                <span className="text-sm text-slate-700">
                  {selectedEngineerName}
                </span>
              </>
            ) : (
              <>
                <span className="w-8 h-8 rounded-full border-2 border-dashed border-slate-300" />

                <span className="text-sm text-slate-400">
                  Unassigned
                </span>
              </>
            )}
          </div>
        </div>

        {/* TIPS */}

        <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-blue-800">
            <Lightbulb size={17} />
            Tips for a faster resolution
          </p>

          <ul className="mt-3 space-y-2 text-sm text-blue-900/80">
            <li className="flex gap-2">
              <CheckCircle size={15} className="shrink-0 mt-0.5 text-blue-600" />
              Use a short, specific title.
            </li>

            <li className="flex gap-2">
              <CheckCircle size={15} className="shrink-0 mt-0.5 text-blue-600" />
              Add steps to reproduce the problem.
            </li>

            <li className="flex gap-2">
              <CheckCircle size={15} className="shrink-0 mt-0.5 text-blue-600" />
              Paste exact error messages.
            </li>

            <li className="flex gap-2">
              <CheckCircle size={15} className="shrink-0 mt-0.5 text-blue-600" />
              Use High priority only for urgent issues.
            </li>
          </ul>
        </div>
      </aside>
    </form>
  );
}

export default TicketForm;
