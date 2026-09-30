import { useRef, useState } from "react";
import { UploadCloud, LoaderCircle } from "lucide-react";

import { ACCEPT, ALLOWED_LABEL } from "../../utils/attachments";

// Click-or-drop area for choosing files. Validation happens in the
// parent (onFiles receives a plain File[]).

function AttachmentDropzone({ onFiles, disabled = false, busy = false }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const pick = (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length > 0) onFiles(files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);

    if (!disabled) pick(e.dataTransfer.files);
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`flex flex-col sm:flex-row items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-5 text-center sm:text-left transition ${
        disabled
          ? "border-slate-200 opacity-60 cursor-not-allowed"
          : dragging
          ? "border-blue-500 bg-blue-50 cursor-copy"
          : "border-slate-300 hover:border-blue-400 hover:bg-slate-50 cursor-pointer"
      }`}
    >
      <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
        {busy ? (
          <LoaderCircle size={20} className="animate-spin" />
        ) : (
          <UploadCloud size={20} />
        )}
      </span>

      <span>
        <span className="block text-sm font-medium text-slate-700">
          {busy ? (
            "Uploading..."
          ) : (
            <>
              <span className="text-blue-600">Choose files</span> or drag
              them here
            </>
          )}
        </span>

        <span className="block text-xs text-slate-500 mt-0.5">
          {ALLOWED_LABEL}
        </span>
      </span>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          pick(e.target.files);
          e.target.value = "";
        }}
        disabled={disabled}
      />
    </div>
  );
}

export default AttachmentDropzone;
