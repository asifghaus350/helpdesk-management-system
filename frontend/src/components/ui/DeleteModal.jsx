import { CircleAlert, LoaderCircle } from "lucide-react";

function DeleteModal({
  isOpen,
  onClose,
  onDelete,
  busy = false,
  error = "",
  title = "Delete Ticket",
  message = "Are you sure you want to delete this ticket? This action cannot be undone.",
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-2xl font-bold text-slate-800">
          {title}
        </h2>

        <p className="text-gray-500 mt-3">
          {message}
        </p>

        {/* Errors belong inside the popup, where the user is looking */}
        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 px-3 py-2.5 rounded-xl text-sm"
          >
            <CircleAlert size={17} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-4 mt-8">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-5 py-2 border rounded-xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed"
          >
            {busy && <LoaderCircle size={16} className="animate-spin" />}
            {busy ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteModal;
