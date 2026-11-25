import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  CheckCircle,
  CircleAlert,
  LoaderCircle,
  MailCheck,
} from "lucide-react";

import AuthLayout from "../components/auth/AuthLayout";
import { getStoredUser, updateStoredUser } from "../utils/auth";
import { API_URL } from "../config";

// Opened from the "confirm your new email" message sent after a
// profile email change. A button (not an automatic request) so link
// scanners and double renders can't use up the link.

function ConfirmEmail() {
  const { token } = useParams();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [doneEmail, setDoneEmail] = useState("");

  const handleConfirm = async () => {
    setError("");

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/auth/confirm-email/${encodeURIComponent(token)}`,
        { method: "POST" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to confirm this email.");
      }

      // Same browser still logged in: show the new email right away
      if (getStoredUser()) {
        updateStoredUser({ email: data.email });
      }

      setDoneEmail(data.email);
    } catch (confirmError) {
      setError(confirmError.message || "Unable to confirm this email.");
    } finally {
      setLoading(false);
    }
  };

  const loggedIn = Boolean(localStorage.getItem("token"));

  return (
    <AuthLayout>
      <span className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
        {doneEmail ? <CheckCircle size={28} /> : <MailCheck size={28} />}
      </span>

      <h2 className="text-3xl font-bold tracking-tight text-slate-800">
        {doneEmail ? "Email updated" : "Confirm your new email"}
      </h2>

      <p className="text-slate-500 mt-2 leading-relaxed">
        {doneEmail ? (
          <>
            Your HelpDesk email is now{" "}
            <span className="font-semibold text-slate-700">{doneEmail}</span>.
            Use it the next time you sign in.
          </>
        ) : (
          "Click below to start using this address for your HelpDesk account."
        )}
      </p>

      {error && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600"
        >
          <CircleAlert size={18} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {doneEmail ? (
        <Link
          to={loggedIn ? "/profile" : "/login"}
          className="mt-8 w-full h-12 inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
        >
          {loggedIn ? "Back to profile" : "Go to sign in"}
        </Link>
      ) : (
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          className="mt-8 w-full h-12 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold shadow-sm transition"
        >
          {loading ? (
            <LoaderCircle size={18} className="animate-spin" />
          ) : (
            <MailCheck size={18} />
          )}
          {loading ? "Confirming..." : "Confirm new email"}
        </button>
      )}
    </AuthLayout>
  );
}

export default ConfirmEmail;
