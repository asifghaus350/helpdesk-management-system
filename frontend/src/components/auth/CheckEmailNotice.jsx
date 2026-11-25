import { useState } from "react";
import { MailCheck, LoaderCircle, RotateCcw, CircleAlert } from "lucide-react";
import { API_URL } from "../../config";

// "Check your inbox" panel with a resend button, shown after sign-up
// and when an unverified account tries to log in.

function CheckEmailNotice({ email, message, onBack, backLabel = "Back to sign in" }) {
  const [sending, setSending] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");

  const handleResend = async () => {
    setInfo("");
    setError("");

    try {
      setSending(true);

      const response = await fetch(
        `${API_URL}/api/auth/resend-verification`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Couldn't send the email.");
      }

      setInfo("A new verification link is on its way. Check your inbox and spam folder.");
    } catch (resendError) {
      setError(resendError.message || "Couldn't send the email.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <span className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
        <MailCheck size={28} />
      </span>

      <h2 className="text-3xl font-bold tracking-tight text-slate-800">
        Check your inbox
      </h2>

      <p className="text-slate-500 mt-2 leading-relaxed">
        {message || (
          <>
            We sent a verification link to{" "}
            <span className="font-semibold text-slate-700">{email}</span>.
            Open it to activate your account.
          </>
        )}
      </p>

      <p className="text-sm text-slate-400 mt-3">
        The link works for 24 hours. Can't find it? Look in your spam folder.
      </p>

      {info && (
        <div className="mt-6 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
          {info}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600"
        >
          <CircleAlert size={18} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleResend}
        disabled={sending}
        className="mt-8 w-full h-12 inline-flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed text-slate-700 rounded-xl text-sm font-semibold shadow-sm transition"
      >
        {sending ? (
          <LoaderCircle size={18} className="animate-spin" />
        ) : (
          <RotateCcw size={18} />
        )}
        {sending ? "Sending..." : "Resend email"}
      </button>

      <button
        type="button"
        onClick={onBack}
        className="mt-4 w-full text-center text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
      >
        {backLabel}
      </button>
    </div>
  );
}

export default CheckEmailNotice;
