import { useEffect, useState } from "react";
import {
  MessageSquare,
  Send,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

function TicketComments({ ticketId }) {
  const [comments, setComments] = useState([]);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editMessage, setEditMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // =========================
  // GET CURRENT USER
  // =========================

  const getCurrentUser = () => {
    try {
      const savedUser = localStorage.getItem("user");

      if (!savedUser) {
        return null;
      }

      return JSON.parse(savedUser);
    } catch (error) {
      console.error("Current user error:", error);
      return null;
    }
  };

  // =========================
  // FETCH COMMENTS
  // =========================

  useEffect(() => {
    let cancelled = false;

    const loadComments = async () => {
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
          `http://localhost:5000/api/comments/ticket/${ticketId}`,
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
            data.message || "Failed to fetch comments"
          );
        }

        if (!cancelled) {
          setComments(data.comments || []);
        }
      } catch (error) {
        console.error(
          "Fetch comments error:",
          error
        );

        if (!cancelled) {
          setError(
            error.message ||
              "Unable to load comments."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadComments();

    return () => {
      cancelled = true;
    };
  }, [ticketId]);

  // =========================
  // ADD COMMENT
  // =========================

  const handleAddComment = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError(
          "Authentication required. Please login."
        );
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/comments/ticket/${ticketId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: message.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to add comment"
        );
      }

      if (data.comment) {
        setComments((previousComments) => [
          ...previousComments,
          data.comment,
        ]);
      } else {
        // Fallback: reload comments if API
        // doesn't return the created comment.
        const refreshResponse = await fetch(
          `http://localhost:5000/api/comments/ticket/${ticketId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const refreshData =
          await refreshResponse.json();

        if (refreshResponse.ok) {
          setComments(
            refreshData.comments || []
          );
        }
      }

      setMessage("");
    } catch (error) {
      console.error(
        "Add comment error:",
        error
      );

      setError(
        error.message ||
          "Unable to add comment."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================
  // START EDIT
  // =========================

  const handleStartEdit = (comment) => {
    setEditingId(comment._id);
    setEditMessage(comment.message || "");
  };

  // =========================
  // CANCEL EDIT
  // =========================

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditMessage("");
  };

  // =========================
  // UPDATE COMMENT
  // =========================

  const handleUpdateComment = async (id) => {
    if (!editMessage.trim()) {
      return;
    }

    try {
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError(
          "Authentication required. Please login."
        );
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/comments/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: editMessage.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update comment"
        );
      }

      if (data.comment) {
        setComments((previousComments) =>
          previousComments.map((comment) =>
            comment._id === id
              ? data.comment
              : comment
          )
        );
      }

      setEditingId(null);
      setEditMessage("");
    } catch (error) {
      console.error(
        "Update comment error:",
        error
      );

      setError(
        error.message ||
          "Unable to update comment."
      );
    }
  };

  // =========================
  // DELETE COMMENT
  // =========================

  const handleDeleteComment = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this comment?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError(
          "Authentication required. Please login."
        );
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/comments/${id}`,
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
          data.message ||
            "Failed to delete comment"
        );
      }

      setComments((previousComments) =>
        previousComments.filter(
          (comment) => comment._id !== id
        )
      );
    } catch (error) {
      console.error(
        "Delete comment error:",
        error
      );

      setError(
        error.message ||
          "Unable to delete comment."
      );
    }
  };

  // =========================
  // COMMENT PERMISSION
  // =========================

  const canEditComment = (comment) => {
    const currentUser = getCurrentUser();

    if (!currentUser || !comment.user) {
      return false;
    }

    const currentUserId =
      currentUser._id ||
      currentUser.id;

    const commentUserId =
      comment.user._id ||
      comment.user.id;

    return (
      currentUserId &&
      commentUserId &&
      currentUserId.toString() ===
        commentUserId.toString()
    );
  };

  const canDeleteComment = (comment) => {
    const currentUser = getCurrentUser();

    if (!currentUser || !comment.user) {
      return false;
    }

    const currentUserId =
      currentUser._id ||
      currentUser.id;

    const commentUserId =
      comment.user._id ||
      comment.user.id;

    const isOwner =
      currentUserId &&
      commentUserId &&
      currentUserId.toString() ===
        commentUserId.toString();

    const isAdmin =
      currentUser.role === "Admin";

    return isOwner || isAdmin;
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-6 mt-8">

        <div className="flex items-center gap-2 mb-4">

          <MessageSquare
            size={20}
            className="text-blue-600"
          />

          <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
            Conversation
          </h2>

        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400">
          Loading comments...
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

          <MessageSquare
            size={21}
            className="text-blue-600"
          />

          <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
            Conversation
          </h2>

        </div>

        <span className="text-sm text-slate-500 dark:text-slate-400">
          {comments.length}{" "}
          {comments.length === 1
            ? "comment"
            : "comments"}
        </span>

      </div>

      {/* =========================
          ERROR
      ========================= */}

      {error && (
        <div className="mb-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* =========================
          ADD COMMENT
      ========================= */}

      <form
        onSubmit={handleAddComment}
        className="mb-8"
      >

        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Add Comment
        </label>

        <textarea
          value={message}
          onChange={(e) =>
            setMessage(e.target.value)
          }
          placeholder="Write your comment..."
          rows={4}
          maxLength={2000}
          className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />

        <div className="flex justify-between items-center mt-3">

          <span className="text-xs text-slate-400">
            {message.length}/2000
          </span>

          <button
            type="submit"
            disabled={
              submitting ||
              !message.trim()
            }
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-medium transition"
          >

            <Send size={17} />

            {submitting
              ? "Adding..."
              : "Add Comment"}

          </button>

        </div>

      </form>

      {/* =========================
          COMMENTS LIST
      ========================= */}

      {comments.length === 0 ? (

        <div className="border border-dashed border-slate-200 dark:border-slate-600 rounded-xl p-8 text-center">

          <MessageSquare
            size={32}
            className="mx-auto text-slate-300 dark:text-slate-500 mb-3"
          />

          <p className="text-sm text-slate-500 dark:text-slate-400">
            No comments yet.
          </p>

          <p className="text-xs text-slate-400 mt-1">
            Start the conversation by adding a comment.
          </p>

        </div>

      ) : (

        <div className="space-y-4">

          {comments.map((comment) => {

            const isEditing =
              editingId === comment._id;

            return (
              <div
                key={comment._id}
                className="border border-slate-200 dark:border-slate-600 rounded-xl p-4"
              >

                {/* =========================
                    COMMENT HEADER
                ========================= */}

                <div className="flex justify-between gap-4">

                  <div className="flex items-center gap-3">

                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-semibold">
                      {comment.user?.name
                        ?.charAt(0)
                        ?.toUpperCase() ||
                        "U"}
                    </div>

                    <div>

                      <p className="font-semibold text-slate-800 dark:text-white">
                        {comment.user?.name ||
                          "Unknown User"}
                      </p>

                      <p className="text-xs text-slate-400">
                        {comment.createdAt
                          ? new Date(
                              comment.createdAt
                            ).toLocaleString()
                          : "Unknown time"}
                      </p>

                    </div>

                  </div>

                  {/* =========================
                      ACTIONS
                  ========================= */}

                  <div className="flex items-center gap-2">

                    {canEditComment(comment) &&
                      !isEditing && (
                        <button
                          type="button"
                          onClick={() =>
                            handleStartEdit(
                              comment
                            )
                          }
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                          title="Edit comment"
                        >
                          <Pencil size={16} />
                        </button>
                      )}

                    {canDeleteComment(comment) &&
                      !isEditing && (
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteComment(
                              comment._id
                            )
                          }
                          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                          title="Delete comment"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}

                  </div>

                </div>

                {/* =========================
                    COMMENT CONTENT
                ========================= */}

                <div className="mt-4">

                  {isEditing ? (

                    <div>

                      <textarea
                        value={editMessage}
                        onChange={(e) =>
                          setEditMessage(
                            e.target.value
                          )
                        }
                        rows={3}
                        maxLength={2000}
                        className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />

                      <div className="flex justify-end gap-2 mt-3">

                        <button
                          type="button"
                          onClick={
                            handleCancelEdit
                          }
                          className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                        >
                          <X size={16} />
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateComment(
                              comment._id
                            )
                          }
                          disabled={
                            !editMessage.trim()
                          }
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg"
                        >
                          Save
                        </button>

                      </div>

                    </div>

                  ) : (

                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-6">
                      {comment.message}
                    </p>

                  )}

                </div>

                {/* =========================
                    EDITED INDICATOR
                ========================= */}

                {comment.updatedAt &&
                  comment.createdAt &&
                  new Date(
                    comment.updatedAt
                  ).getTime() !==
                    new Date(
                      comment.createdAt
                    ).getTime() && (
                    <p className="text-xs text-slate-400 mt-3">
                      Edited
                    </p>
                  )}

              </div>
            );
          })}

        </div>

      )}

    </div>
  );
}

export default TicketComments;