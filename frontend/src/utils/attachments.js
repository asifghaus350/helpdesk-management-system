import { API_URL } from "../config";

// =========================
// RULES (same as the backend)
// =========================

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_FILES = 5;

const ALLOWED_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".pdf",
  ".txt",
  ".log",
  ".csv",
  ".docx",
  ".xlsx",
];

// For <input type="file" accept="…">
export const ACCEPT = ALLOWED_EXTENSIONS.join(",");

export const ALLOWED_LABEL =
  "PNG, JPG, GIF, WebP, PDF, TXT, LOG, CSV, DOCX, XLSX · up to 5 MB each";

const extensionOf = (name = "") => {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot).toLowerCase();
};

// Returns an error message, or "" when the files are fine
export const validateFiles = (files, alreadySelected = 0) => {
  if (files.length + alreadySelected > MAX_FILES) {
    return `You can attach up to ${MAX_FILES} files at a time.`;
  }

  for (const file of files) {
    if (!ALLOWED_EXTENSIONS.includes(extensionOf(file.name))) {
      return `"${file.name}" is not an allowed file type.`;
    }

    if (file.size > MAX_FILE_SIZE) {
      return `"${file.name}" is larger than 5 MB.`;
    }
  }

  return "";
};

export const formatBytes = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const isImage = (mimeType = "") => mimeType.startsWith("image/");
export const isPdf = (mimeType = "") => mimeType === "application/pdf";

// =========================
// API
// =========================

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const readJson = async (response, fallback) => {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || fallback);
  }

  return data;
};

export const fetchAttachments = async (ticketId) =>
  (
    await readJson(
      await fetch(`${API_URL}/api/attachments/ticket/${ticketId}`, {
        headers: authHeader(),
      }),
      "Unable to load attachments"
    )
  ).attachments || [];

// Pass commentId to attach the files to one of your comments
export const uploadAttachments = async (ticketId, files, commentId) => {
  const form = new FormData();
  files.forEach((file) => form.append("files", file));

  if (commentId) form.append("commentId", commentId);

  // No Content-Type header: the browser sets the multipart boundary
  return readJson(
    await fetch(`${API_URL}/api/attachments/ticket/${ticketId}`, {
      method: "POST",
      headers: authHeader(),
      body: form,
    }),
    "Upload failed"
  );
};

export const deleteAttachment = async (id) =>
  readJson(
    await fetch(`${API_URL}/api/attachments/${id}`, {
      method: "DELETE",
      headers: authHeader(),
    }),
    "Unable to delete file"
  );

// Files need the login token, so they're fetched as a Blob and shown
// through an object URL instead of a plain <img src> / <a href>.
export const fetchAttachmentBlob = async (id, { inline = false } = {}) => {
  const response = await fetch(
    `${API_URL}/api/attachments/${id}/download${inline ? "?inline=1" : ""}`,
    { headers: authHeader() }
  );

  if (!response.ok) {
    let message = "Unable to open file";

    try {
      message = (await response.json()).message || message;
    } catch {
      // Not JSON
    }

    throw new Error(message);
  }

  return response.blob();
};

export const downloadAttachment = async (attachment) => {
  const blob = await fetchAttachmentBlob(attachment._id);
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = attachment.filename;
  link.click();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
