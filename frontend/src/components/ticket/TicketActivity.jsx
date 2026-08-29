import { useEffect, useState } from "react";
import {
  Activity,
  CheckCircle,
  Edit,
  UserPlus,
  AlertCircle,
  MessageSquare,
  Trash2,
  PlusCircle,
} from "lucide-react";

function TicketActivity({ ticketId }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================
  // GET ACTIVITY ICON
  // =========================

  const getActivityIcon = (action) => {
    switch (action) {
      case "Ticket Created":
        return <PlusCircle size={18} />;

      case "Ticket Updated":
        return <Edit size={18} />;

      case "Ticket Assigned":
        return <UserPlus size={18} />;

      case "Priority Changed":
        return <AlertCircle size={18} />;

      case "Status Changed":
        return <CheckCircle size={18} />;

      case "Comment Added":
      case "Comment Updated":
      case "Comment Deleted":
        return <MessageSquare size={18} />;

      case "Ticket Deleted":
        return <Trash2 size={18} />;

      default:
        return <Activity size={18} />;
    }
  };

  // =========================
  // GET ACTIVITY STYLE
  // =========================

  const getActivityStyle = (action) => {
    switch (action) {
      case "Ticket Created":
        return "bg-green-100 text-green-600";

      case "Ticket Assigned":
        return "bg-blue-100 text-blue-600";

      case "Priority Changed":
        return "bg-red-100 text-red-600";

      case "Status Changed":
        return "bg-yellow-100 text-yellow-600";

      case "Comment Added":
      case "Comment Updated":
      case "Comment Deleted":
        return "bg-purple-100 text-purple-600";

      case "Ticket Deleted":
        return "bg-red-100 text-red-600";

      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  // =========================
  // FETCH ACTIVITIES
  // =========================

  useEffect(() => {
    let cancelled = false;

    const loadActivities = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          if (!cancelled) {
            setError(
              "Authentication required. Please login."
            );
            setLoading(false);
          }

          return;
        }

        const response = await fetch(
          `http://localhost:5000/api/activities/ticket/${ticketId}`,
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
              "Failed to fetch ticket activity"
          );
        }

        if (!cancelled) {
          setActivities(data.activities || []);
        }
      } catch (error) {
        console.error(
          "Fetch activity error:",
          error
        );

        if (!cancelled) {
          setError(
            error.message ||
              "Unable to load ticket activity."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadActivities();

    return () => {
      cancelled = true;
    };
  }, [ticketId]);

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-6 mt-8">

        <div className="flex items-center gap-2 mb-5">

          <Activity
            size={21}
            className="text-blue-600"
          />

          <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
            Activity History
          </h2>

        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400">
          Loading activity history...
        </p>

      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-6 mt-8">

      {/* =========================
          HEADER
      ========================= */}

      <div className="flex items-center justify-between mb-6">

        <div className="flex items-center gap-2">

          <Activity
            size={21}
            className="text-blue-600"
          />

          <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
            Activity History
          </h2>

        </div>

        <span className="text-sm text-slate-500 dark:text-slate-400">
          {activities.length}{" "}
          {activities.length === 1
            ? "activity"
            : "activities"}
        </span>

      </div>

      {/* =========================
          ERROR
      ========================= */}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* =========================
          EMPTY STATE
      ========================= */}

      {!error && activities.length === 0 && (
        <div className="border border-dashed border-slate-200 dark:border-slate-600 rounded-xl p-8 text-center">

          <Activity
            size={32}
            className="mx-auto text-slate-300 dark:text-slate-500 mb-3"
          />

          <p className="text-sm text-slate-500 dark:text-slate-400">
            No activity history available.
          </p>

        </div>
      )}

      {/* =========================
          ACTIVITY TIMELINE
      ========================= */}

      {!error && activities.length > 0 && (
        <div className="relative">

          {/* Timeline Line */}

          <div className="absolute left-5 top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-600" />

          <div className="space-y-6">

            {activities.map((activity) => (

              <div
                key={activity._id}
                className="relative flex gap-4"
              >

                {/* Icon */}

                <div
                  className={`relative z-10 w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${getActivityStyle(
                    activity.action
                  )}`}
                >
                  {getActivityIcon(
                    activity.action
                  )}
                </div>

                {/* Content */}

                <div className="flex-1 min-w-0">

                  <div className="flex flex-wrap items-center gap-2">

                    <p className="font-semibold text-slate-800 dark:text-white">
                      {activity.action}
                    </p>

                    {activity.user?.name && (
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        by {activity.user.name}
                      </span>
                    )}

                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    {activity.message}
                  </p>

                  {/* Old / New Values */}

                  {(activity.oldValue ||
                    activity.newValue) && (
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">

                      {activity.oldValue && (
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          From: {activity.oldValue}
                        </span>
                      )}

                      {activity.newValue && (
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                          To: {activity.newValue}
                        </span>
                      )}

                    </div>
                  )}

                  {/* Time */}

                  <p className="text-xs text-slate-400 mt-2">
                    {activity.createdAt
                      ? new Date(
                          activity.createdAt
                        ).toLocaleString()
                      : "Unknown time"}
                  </p>

                </div>

              </div>

            ))}

          </div>

        </div>
      )}

    </div>
  );
}

export default TicketActivity;