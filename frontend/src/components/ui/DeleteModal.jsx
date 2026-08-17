function DeleteModal({ isOpen, onClose, onDelete }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white rounded-2xl shadow-xl w-[420px] p-6">

        <h2 className="text-2xl font-bold text-slate-800">
          Delete Ticket
        </h2>

        <p className="text-gray-500 mt-3">
          Are you sure you want to delete this ticket?
          This action cannot be undone.
        </p>

        <div className="flex justify-end gap-4 mt-8">

          <button
            onClick={onClose}
            className="px-5 py-2 border rounded-xl hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            onClick={onDelete}
            className="px-5 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
          >
            Delete
          </button>

        </div>

      </div>

    </div>
  );
}

export default DeleteModal;