import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  MessageSquare,
  Send,
  Pencil,
  Trash2,
  X,
  Check,
  LoaderCircle,
  Paperclip,
} from "lucide-react";

import { getStoredUser } from "../../utils/auth";
import { timeAgo, initials } from "../../utils/format";
import { API_URL } from "../../config";
import {
  ACCEPT,
  fetchAttachments,
  uploadAttachments,
  downloadAttachment,
  fetchAttachmentBlob,
  validateFiles,
  formatBytes,
  isImage,
  isPdf,
} from "../../utils/attachments";

const MAX_LENGTH = 2000;

const roleBadges = {
  Admin: "bg-violet-50 text-violet-700",
  Engineer: "bg-amber-50 text-amber-700",
};

const sameId = (a, b) =>
  !!a && !!b && a.toString() === b.toString();

function TicketComments({ ticketId, onChange }) {
  const [comments, setComments] = useState([]);
  const [message, setMessage] = useState("");

  // Files picked in the composer, sent with the next comment
  const [pendingFiles, setPendingFiles] = useState([]);
  const fileInputRef = useRef(null);

  // Files already attached to comments, keyed by comment id
  const [commentFiles, setCommentFiles] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editMessage, setEditMessage] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [error, setError] = useState("");

  const currentUser = getStoredUser();
  const currentUserId = currentUser?._id || currentUser?.id;

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
          `${API_URL}/api/comments/ticket/${ticketId}`,
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
  // FILES ATTACHED TO COMMENTS
  // =========================

  useEffect(() => {
    let cancelled = false;

    const loadFiles = async () => {
      try {
        const attachments = await fetchAttachments(ticketId);
        const grouped = {};

        attachments
          .filter((attachment) => attachment.comment)
          .forEach((attachment) => {
            const key = String(attachment.comment);
            grouped[key] = [...(grouped[key] || []), attachment];
          });

        if (!cancelled) setCommentFiles(grouped);
      } catch {
        // Comments still work without their file list
      }
    };

    loadFiles();

    return () => {
      cancelled = true;
    };
  }, [ticketId]);

  const addPendingFiles = (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    const problem = validateFiles(files, pendingFiles.length);

    if (problem) {
      toast.error(problem);
      return;
    }

    setPendingFiles((prev) => [...prev, ...files]);
  };

  const openCommentFile = async (attachment) => {
    try {
      if (isImage(attachment.mimeType) || isPdf(attachment.mimeType)) {
        const blob = await fetchAttachmentBlob(attachment._id, {
          inline: true,
        });
        const url = URL.createObjectURL(blob);

        window.open(url, "_blank", "noopener");
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      } else {
        await downloadAttachment(attachment);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // =========================
  // ADD COMMENT
  // =========================

  const handleAddComment = async (e) => {
    e?.preventDefault();

    if (!message.trim() || submitting) {
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
        `${API_URL}/api/comments/ticket/${ticketId}`,
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
          `${API_URL}/api/comments/ticket/${ticketId}`,
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

      // Upload the picked files and link them to the new comment
      if (pendingFiles.length > 0 && data.comment) {
        try {
          const uploaded = await uploadAttachments(
            ticketId,
            pendingFiles,
            data.comment._id
          );

          setCommentFiles((prev) => ({
            ...prev,
            [String(data.comment._id)]: uploaded.attachments || [],
          }));
        } catch (uploadError) {
          toast.error(
            `Comment posted, but the files were not uploaded: ${uploadError.message}`
          );
        }
      }

      setMessage("");
      setPendingFiles([]);
      onChange?.();
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

  // Ctrl/Cmd + Enter sends
  const handleComposerKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleAddComment(e);
    }
  };

  // =========================
  // START / CANCEL EDIT
  // =========================

  const handleStartEdit = (comment) => {
    setConfirmDeleteId(null);
    setEditingId(comment._id);
    setEditMessage(comment.message || "");
  };

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
      setSavingEdit(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError(
          "Authentication required. Please login."
        );
        return;
      }

      const response = await fetch(
        `${API_URL}/api/comments/${id}`,
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
      onChange?.();
    } catch (error) {
      console.error(
        "Update comment error:",
        error
      );

      setError(
        error.message ||
          "Unable to update comment."
      );
    } finally {
      setSavingEdit(false);
    }
  };

  // =========================
  // DELETE COMMENT
  // =========================
  // Confirmation happens inline on the comment.

  const handleDeleteComment = async (id) => {
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
        `${API_URL}/api/comments/${id}`,
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

      // The server deleted the comment's files too
      setCommentFiles((prev) => {
        const next = { ...prev };
        delete next[String(id)];
        return next;
      });

      onChange?.();
    } catch (error) {
      console.error(
        "Delete comment error:",
        error
      );

      setError(
        error.message ||
          "Unable to delete comment."
      );
    } finally {
      setConfirmDeleteId(null);
    }
  };

  // =========================
  // COMMENT PERMISSION
  // =========================

  const isOwnComment = (comment) =>
    sameId(
      currentUserId,
      comment.user?._id || comment.user?.id
    );

  const canEditComment = (comment) =>
    isOwnComment(comment);

  const canDeleteComment = (comment) =>
    isOwnComment(comment) ||
    currentUser?.role === "Admin";

  const wasEdited = (comment) =>
    comment.updatedAt &&
    comment.createdAt &&
    new Date(comment.updatedAt).getTime() !==
      new Date(comment.createdAt).getTime();

  return (
    <section className="bg-white border border-slate-200 rounded-2xl shadow-sm">

      {/* =========================
          HEADER
      ========================= */}

      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-slate-400" />

          <h2 className="text-base font-semibold text-slate-800">
            Conversation
          </h2>
        </div>

        {!loading && (
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            {comments.length}{" "}
            {comments.length === 1 ? "comment" : "comments"}
          </span>
        )}
      </div>

      {/* =========================
          ERROR
      ========================= */}

      {error && (
        <div className="mx-5 mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* =========================
          COMMENTS LIST
      ========================= */}

      <div className="px-5 py-4">

        {loading ? (

          <div className="space-y-5 animate-pulse">
            {[1, 2].map((row) => (
              <div key={row} className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 rounded bg-slate-100 w-1/4" />
                  <div className="h-12 rounded-xl bg-slate-100" />
                </div>
              </div>
            ))}
          </div>

        ) : comments.length === 0 ? (

          <div className="py-6 text-center">
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <MessageSquare size={20} />
            </div>

            <p className="text-sm font-medium text-slate-700 mt-3">
              No comments yet
            </p>

            <p className="text-xs text-slate-500 mt-1">
              Start the conversation below.
            </p>
          </div>

        ) : (

          <ul className="space-y-5">
            {comments.map((comment) => {
              const isEditing = editingId === comment._id;
              const isConfirmingDelete =
                confirmDeleteId === comment._id;
              const own = isOwnComment(comment);
              const authorName =
                comment.user?.name || "Unknown User";
              const authorRole = comment.user?.role;

              return (
                <li
                  key={comment._id}
                  className="group flex gap-3"
                >
                  {/* Avatar */}

                  <span
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      own
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {initials(authorName)}
                  </span>

                  <div className="flex-1 min-w-0">

                    {/* Meta */}

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
                        <span className="text-sm font-semibold text-slate-800 truncate">
                          {authorName}
                        </span>

                        {roleBadges[authorRole] && (
                          <span
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase ${roleBadges[authorRole]}`}
                          >
                            {authorRole}
                          </span>
                        )}

                        <span
                          className="text-xs text-slate-400"
                          title={
                            comment.createdAt
                              ? new Date(comment.createdAt).toLocaleString()
                              : ""
                          }
                        >
                          {timeAgo(comment.createdAt)}
                          {wasEdited(comment) && " · edited"}
                        </span>
                      </div>

                      {/* Actions (on hover for desktop) */}

                      {!isEditing && !isConfirmingDelete && (
                        <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity">
                          {canEditComment(comment) && (
                            <button
                              type="button"
                              onClick={() => handleStartEdit(comment)}
                              className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                              title="Edit comment"
                              aria-label="Edit comment"
                            >
                              <Pencil size={14} />
                            </button>
                          )}

                          {canDeleteComment(comment) && (
                            <button
                              type="button"
                              onClick={() => {
                                handleCancelEdit();
                                setConfirmDeleteId(comment._id);
                              }}
                              className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                              title="Delete comment"
                              aria-label="Delete comment"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Body */}

                    {isEditing ? (

                      <div className="mt-2">
                        <textarea
                          value={editMessage}
                          onChange={(e) => setEditMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") handleCancelEdit();
                            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                              handleUpdateComment(comment._id);
                            }
                          }}
                          rows={3}
                          maxLength={MAX_LENGTH}
                          autoFocus
                          className="w-full border border-blue-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-100 resize-y"
                        />

                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50"
                          >
                            <X size={14} />
                            Cancel
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUpdateComment(comment._id)}
                            disabled={!editMessage.trim() || savingEdit}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium"
                          >
                            {savingEdit ? (
                              <LoaderCircle size={14} className="animate-spin" />
                            ) : (
                              <Check size={14} />
                            )}
                            Save
                          </button>
                        </div>
                      </div>

                    ) : (

                      <div
                        className={`mt-1.5 rounded-xl rounded-tl-sm px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap wrap-break-word ${
                          own
                            ? "bg-blue-50 text-slate-800"
                            : "bg-slate-50 text-slate-700"
                        }`}
                      >
                        {comment.message}
                      </div>

                    )}

                    {/* Files attached to this comment */}

                    {commentFiles[String(comment._id)]?.length > 0 && (
                      <ul className="flex flex-wrap gap-2 mt-2">
                        {commentFiles[String(comment._id)].map((attachment) => (
                          <li key={attachment._id}>
                            <button
                              type="button"
                              onClick={() => openCommentFile(attachment)}
                              title={`Open ${attachment.filename}`}
                              className="inline-flex items-center gap-1.5 max-w-60 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 hover:border-blue-300 hover:text-blue-700 transition"
                            >
                              <Paperclip size={13} className="shrink-0 text-slate-400" />
                              <span className="truncate">{attachment.filename}</span>
                              <span className="shrink-0 text-slate-400">
                                {formatBytes(attachment.size)}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Inline delete confirmation */}

                    {isConfirmingDelete && (
                      <div className="flex flex-wrap items-center justify-between gap-2 mt-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                        <span className="text-sm text-red-700">
                          Delete this comment?
                        </span>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-3 py-1 rounded-md text-sm text-slate-600 hover:bg-white"
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment._id)}
                            className="px-3 py-1 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

        )}
      </div>

      {/* =========================
          COMPOSER
      ========================= */}

      <form
        onSubmit={handleAddComment}
        className="flex gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50/60 rounded-b-2xl"
      >
        <span className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
          {initials(currentUser?.name || "?")}
        </span>

        <div className="flex-1 min-w-0">
          <div className="bg-white border border-slate-200 rounded-xl focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder="Write a reply..."
              aria-label="Write a comment"
              rows={3}
              maxLength={MAX_LENGTH}
              className="w-full px-3.5 pt-3 pb-1 text-sm text-slate-800 placeholder-slate-400 bg-transparent outline-none resize-none"
            />

            {pendingFiles.length > 0 && (
              <ul className="flex flex-wrap gap-2 px-3 pb-2">
                {pendingFiles.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="inline-flex items-center gap-1.5 max-w-60 rounded-lg bg-slate-100 pl-2.5 pr-1 py-0.5 text-xs text-slate-700"
                  >
                    <Paperclip size={12} className="shrink-0 text-slate-400" />
                    <span className="truncate">{file.name}</span>

                    <button
                      type="button"
                      onClick={() =>
                        setPendingFiles((prev) =>
                          prev.filter((_, i) => i !== index)
                        )
                      }
                      aria-label={`Remove ${file.name}`}
                      className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                    >
                      <X size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center justify-between gap-3 px-3 pb-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={submitting}
                  title="Attach files"
                  aria-label="Attach files"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-blue-600 disabled:opacity-50 shrink-0"
                >
                  <Paperclip size={16} />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ACCEPT}
                  className="hidden"
                  onChange={(e) => {
                    addPendingFiles(e.target.files);
                    e.target.value = "";
                  }}
                />

                <span className="text-xs text-slate-400 truncate">
                  <span className="hidden sm:inline">
                    Ctrl + Enter to send ·{" "}
                  </span>
                  {message.length}/{MAX_LENGTH}
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting || !message.trim()}
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white px-3.5 py-1.5 rounded-lg text-sm font-medium transition"
              >
                {submitting ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : (
                  <Send size={15} />
                )}
                {submitting ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      </form>

    </section>
  );
}

export default TicketComments;
