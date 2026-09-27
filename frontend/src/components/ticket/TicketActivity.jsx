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
  ArrowRight,
} from "lucide-react";

import { timeAgo } from "../../utils/format";

// Actions whose old/new values are worth showing as "A → B".
// For the others (e.g. a comment's full text) the message says enough.
const CHANGE_ACTIONS = [
  "Ticket Assigned",
  "Priority Changed",
  "Status Changed",
];

const INITIAL_VISIBLE = 6;

function TicketActivity({ ticketId, refreshKey = 0 }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);

  // =========================
  // GET ACTIVITY ICON
  // =========================

  const getActivityIcon = (action) => {
    switch (action) {
      case "Ticket Created":
        return <PlusCircle size={15} />;

      case "Ticket Updated":
        return <Edit size={15} />;

      case "Ticket Assigned":
        return <UserPlus size={15} />;

      case "Priority Changed":
        return <AlertCircle size={15} />;

      case "Status Changed":
        return <CheckCircle size={15} />;

      case "Comment Added":
      case "Comment Updated":
      case "Comment Deleted":
        return <MessageSquare size={15} />;

      case "Ticket Deleted":
        return <Trash2 size={15} />;

      default:
        return <Activity size={15} />;
    }
  };

  // =========================
  // GET ACTIVITY STYLE
  // =========================

  const getActivityStyle = (action) => {
    switch (action) {
      case "Ticket Created":
        return "bg-emerald-50 text-emerald-600 ring-emerald-100";

      case "Ticket Assigned":
        return "bg-blue-50 text-blue-600 ring-blue-100";

      case "Priority Changed":
        return "bg-red-50 text-red-600 ring-red-100";

      case "Status Changed":
        return "bg-amber-50 text-amber-600 ring-amber-100";

      case "Comment Added":
      case "Comment Updated":
      case "Comment Deleted":
        return "bg-violet-50 text-violet-600 ring-violet-100";

      case "Ticket Deleted":
        return "bg-red-50 text-red-600 ring-red-100";

      default:
        return "bg-slate-50 text-slate-600 ring-slate-100";
    }
  };

  // =========================
  // FETCH ACTIVITIES
  // =========================

  useEffect(() => {
    let cancelled = false;

    const loadActivities = async () => {
      try {
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
  }, [ticketId, refreshKey]);

  const visibleActivities = showAll
    ? activities
    : activities.slice(0, INITIAL_VISIBLE);

  return (
    <section className="bg-white border border-slate-200 rounded-2xl shadow-sm">

      {/* =========================
          HEADER
      ========================= */}

      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-slate-400" />

          <h2 className="text-base font-semibold text-slate-800">
            Activity
          </h2>
        </div>

        {!loading && (
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            {activities.length}
          </span>
        )}
      </div>

      <div className="px-5 py-4">

        {/* LOADING */}

        {loading && (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((row) => (
              <div key={row} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 rounded bg-slate-100 w-2/3" />
                  <div className="h-3 rounded bg-slate-100 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ERROR */}

        {!loading && error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2.5 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* EMPTY */}

        {!loading && !error && activities.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">
            No activity yet.
          </p>
        )}

        {/* TIMELINE */}

        {!loading && !error && activities.length > 0 && (
          <ol className="relative">
            {visibleActivities.map((activity, index) => {
              const isLast =
                index === visibleActivities.length - 1;

              const showChange =
                CHANGE_ACTIONS.includes(activity.action) &&
                (activity.oldValue || activity.newValue);

              return (
                <li
                  key={activity._id}
                  className="relative flex gap-3 pb-5 last:pb-0"
                >
                  {/* Connector line */}

                  {!isLast && (
                    <span className="absolute left-3.5 top-8 bottom-0 w-px bg-slate-200" />
                  )}

                  {/* Icon */}

                  <span
                    className={`relative z-10 w-7 h-7 shrink-0 rounded-full ring-1 flex items-center justify-center ${getActivityStyle(
                      activity.action
                    )}`}
                  >
                    {getActivityIcon(activity.action)}
                  </span>

                  {/* Content */}

                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm text-slate-700 leading-snug">
                      <span className="font-semibold text-slate-800">
                        {activity.user?.name || "System"}
                      </span>{" "}
                      <span className="text-slate-500">
                        {activity.action.toLowerCase()}
                      </span>
                    </p>

                    {showChange && (
                      <p className="flex flex-wrap items-center gap-1.5 mt-1.5 text-xs">
                        {activity.oldValue && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            {activity.oldValue}
                          </span>
                        )}

                        {activity.oldValue && activity.newValue && (
                          <ArrowRight size={12} className="text-slate-400" />
                        )}

                        {activity.newValue && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium">
                            {activity.newValue}
                          </span>
                        )}
                      </p>
                    )}

                    <p
                      className="text-xs text-slate-400 mt-1"
                      title={
                        activity.createdAt
                          ? new Date(activity.createdAt).toLocaleString()
                          : ""
                      }
                    >
                      {timeAgo(activity.createdAt)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {!loading &&
          activities.length > INITIAL_VISIBLE && (
            <button
              type="button"
              onClick={() => setShowAll((prev) => !prev)}
              className="mt-4 w-full text-sm font-medium text-blue-600 hover:text-blue-700 py-2 rounded-lg hover:bg-blue-50 transition"
            >
              {showAll
                ? "Show less"
                : `Show all ${activities.length} activities`}
            </button>
          )}

      </div>
    </section>
  );
}

export default TicketActivity;
