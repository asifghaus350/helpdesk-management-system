import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Paperclip,
  FileText,
  FileSpreadsheet,
  File as FileIcon,
  Download,
  Eye,
  Trash2,
  X,
  LoaderCircle,
} from "lucide-react";

import AttachmentDropzone from "./AttachmentDropzone";
import { getStoredUser } from "../../utils/auth";
import { timeAgo } from "../../utils/format";
import {
  fetchAttachments,
  uploadAttachments,
  deleteAttachment,
  downloadAttachment,
  fetchAttachmentBlob,
  validateFiles,
  formatBytes,
  isImage,
  isPdf,
} from "../../utils/attachments";

const iconFor = (mimeType) => {
  if (isPdf(mimeType)) return FileText;
  if (/sheet|excel|csv/.test(mimeType)) return FileSpreadsheet;
  if (/text|word/.test(mimeType)) return FileText;
  return FileIcon;
};

function TicketAttachments({ ticketId, onChange }) {
  const currentUser = getStoredUser();

  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  // Object URLs for image thumbnails, keyed by attachment id
  const [thumbnails, setThumbnails] = useState({});
  const [preview, setPreview] = useState(null); // { url, filename }
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  // =========================
  // LOAD LIST
  // =========================

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setError("");
        const list = await fetchAttachments(ticketId);
        if (!cancelled) setAttachments(list);
      } catch (error) {
        if (!cancelled) setError(error.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [ticketId]);

  // =========================
  // IMAGE THUMBNAILS
  // =========================

  const imageIds = attachments
    .filter((item) => isImage(item.mimeType))
    .map((item) => item._id)
    .join(",");

  useEffect(() => {
    if (!imageIds) return undefined;

    let cancelled = false;
    const urls = {};

    const load = async () => {
      for (const id of imageIds.split(",")) {
        try {
          const blob = await fetchAttachmentBlob(id, { inline: true });
          urls[id] = URL.createObjectURL(blob);
        } catch {
          // Thumbnail is optional; the file icon is shown instead
        }
      }

      if (!cancelled) setThumbnails({ ...urls });
    };

    load();

    return () => {
      cancelled = true;
      Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageIds]);

  // =========================
  // ACTIONS
  // =========================

  const handleFiles = async (files) => {
    const problem = validateFiles(files);

    if (problem) {
      toast.error(problem);
      return;
    }

    try {
      setUploading(true);

      const data = await uploadAttachments(ticketId, files);

      setAttachments((prev) => [...(data.attachments || []), ...prev]);
      toast.success(data.message || "Uploaded");
      onChange?.();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handlePreview = async (attachment) => {
    try {
      setBusyId(attachment._id);

      const blob = await fetchAttachmentBlob(attachment._id, {
        inline: true,
      });
      const url = URL.createObjectURL(blob);

      if (isPdf(attachment.mimeType)) {
        // Browsers have their own PDF viewer
        window.open(url, "_blank", "noopener");
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      } else {
        setPreview({ url, filename: attachment.filename });
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusyId(null);
    }
  };

  const closePreview = () => {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
  };

  const handleDownload = async (attachment) => {
    try {
      setBusyId(attachment._id);
      await downloadAttachment(attachment);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (attachment) => {
    try {
      setBusyId(attachment._id);
      await deleteAttachment(attachment._id);

      setAttachments((prev) =>
        prev.filter((item) => item._id !== attachment._id)
      );
      toast.success("File deleted");
      onChange?.();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusyId(null);
      setConfirmDeleteId(null);
    }
  };

  const canDelete = (attachment) => {
    const uploaderId =
      attachment.uploadedBy?._id || attachment.uploadedBy;

    return (
      currentUser?.role === "Admin" ||
      String(uploaderId) === String(currentUser?.id)
    );
  };

  // Close the image preview with Esc
  useEffect(() => {
    if (!preview) return undefined;

    const handleKey = (e) => {
      if (e.key === "Escape") {
        URL.revokeObjectURL(preview.url);
        setPreview(null);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [preview]);

  return (
    <section className="bg-white border border-slate-200 rounded-2xl shadow-sm">

      {/* Header */}

      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Paperclip size={18} className="text-slate-400" />

          <h2 className="text-base font-semibold text-slate-800">
            Attachments
          </h2>
        </div>

        {!loading && (
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            {attachments.length}
          </span>
        )}
      </div>

      <div className="p-5 space-y-4">

        <AttachmentDropzone
          onFiles={handleFiles}
          disabled={uploading}
          busy={uploading}
        />

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-pulse">
            {[1, 2].map((item) => (
              <div key={item} className="h-16 rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : attachments.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-2">
            No files attached yet. Add screenshots, logs or documents
            that help explain the issue.
          </p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {attachments.map((attachment) => {
              const Icon = iconFor(attachment.mimeType);
              const thumbnail = thumbnails[attachment._id];
              const previewable =
                isImage(attachment.mimeType) ||
                isPdf(attachment.mimeType);
              const isBusy = busyId === attachment._id;

              return (
                <li
                  key={attachment._id}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 p-2.5 min-w-0"
                >
                  {/* Thumbnail / icon */}

                  <button
                    type="button"
                    onClick={() =>
                      previewable
                        ? handlePreview(attachment)
                        : handleDownload(attachment)
                    }
                    className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 hover:ring-2 hover:ring-blue-200 transition"
                    aria-label={`Open ${attachment.filename}`}
                  >
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Icon size={22} />
                    )}
                  </button>

                  {/* Name + meta */}

                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium text-slate-800 truncate"
                      title={attachment.filename}
                    >
                      {attachment.filename}
                    </p>

                    <p className="text-xs text-slate-500 truncate">
                      {formatBytes(attachment.size)}
                      {attachment.uploadedBy?.name &&
                        ` · ${attachment.uploadedBy.name}`}
                      {` · ${timeAgo(attachment.createdAt)}`}
                    </p>
                  </div>

                  {/* Actions */}

                  {confirmDeleteId === attachment._id ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 rounded-md text-xs text-slate-600 hover:bg-slate-100"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(attachment)}
                        disabled={isBusy}
                        className="px-2 py-1 rounded-md text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-0.5 shrink-0">
                      {isBusy && (
                        <LoaderCircle
                          size={16}
                          className="animate-spin text-slate-400 mx-1"
                        />
                      )}

                      {previewable && (
                        <button
                          type="button"
                          onClick={() => handlePreview(attachment)}
                          title="Preview"
                          aria-label={`Preview ${attachment.filename}`}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Eye size={16} />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDownload(attachment)}
                        title="Download"
                        aria-label={`Download ${attachment.filename}`}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Download size={16} />
                      </button>

                      {canDelete(attachment) && (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(attachment._id)}
                          title="Delete"
                          aria-label={`Delete ${attachment.filename}`}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Image preview */}

      {preview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={preview.filename}
          onClick={closePreview}
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-4"
        >
          <div className="w-full max-w-5xl flex items-center justify-between gap-3 mb-3 text-white">
            <p className="text-sm font-medium truncate">
              {preview.filename}
            </p>

            <button
              type="button"
              onClick={closePreview}
              aria-label="Close preview"
              className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/10 hover:bg-white/20"
            >
              <X size={20} />
            </button>
          </div>

          <img
            src={preview.url}
            alt={preview.filename}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[80vh] rounded-xl shadow-2xl bg-white"
          />
        </div>
      )}
    </section>
  );
}

export default TicketAttachments;
