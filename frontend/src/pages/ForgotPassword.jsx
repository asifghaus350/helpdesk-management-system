import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  KeyRound,
  Mail,
  MailCheck,
  CircleAlert,
  LoaderCircle,
  Send,
  FlaskConical,
} from "lucide-react";

import AuthLayout from "../components/auth/AuthLayout";
import { API_URL } from "../config";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();

    setMessage("");
    setError("");
    setResetUrl("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to process password reset request."
        );
      }

      setMessage(
        data.message ||
          "If an account exists for this email, a reset link has been sent."
      );

      // Development-only reset URL.
      if (data.resetUrl) {
        setResetUrl(data.resetUrl);
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      setError(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const startOver = () => {
    setMessage("");
    setResetUrl("");
    setError("");
  };

  return (
    <AuthLayout>

      <Link
        to="/login"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-600 transition mb-8"
      >
        <ArrowLeft size={16} />
        Back to sign in
      </Link>

      {message ? (

        /* =========================
            CHECK YOUR EMAIL
        ========================= */

        <div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <MailCheck size={28} />
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-800 mt-6">
            Check your email
          </h1>

          <p className="text-slate-500 mt-2 leading-relaxed">
            {message}
          </p>

          <div className="mt-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <Mail size={18} className="text-slate-400 shrink-0" />
            <span className="text-sm font-medium text-slate-700 truncate">
              {email.trim()}
            </span>
          </div>

          {/* Development Reset Link */}

          {resetUrl && (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-800">
                <FlaskConical size={14} />
                Development reset link
              </p>

              <a
                href={resetUrl}
                className="block mt-2 text-sm text-blue-600 hover:text-blue-700 break-all underline"
              >
                {resetUrl}
              </a>

              <p className="text-xs text-amber-700 mt-2 leading-5">
                Shown only for local development. In production the link
                is delivered by email.
              </p>
            </div>
          )}

          <div className="mt-8 space-y-3">
            <Link
              to="/login"
              className="w-full h-12 inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
            >
              Back to sign in
            </Link>

            <p className="text-center text-sm text-slate-500">
              Didn't get it? Check spam, or{" "}
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={loading}
                className="font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                {loading ? "sending..." : "resend the link"}
              </button>{" "}
              ·{" "}
              <button
                type="button"
                onClick={startOver}
                className="font-medium text-slate-600 hover:text-blue-600"
              >
                use another email
              </button>
            </p>
          </div>
        </div>

      ) : (

        /* =========================
            REQUEST FORM
        ========================= */

        <div>
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <KeyRound size={28} />
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-800 mt-6">
            Forgot your password?
          </h1>

          <p className="text-slate-500 mt-2 leading-relaxed">
            Enter the email you use for HelpDesk and we&apos;ll send you a
            link to reset your password.
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

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
            noValidate
          >
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Email address
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  autoFocus
                  className="w-full h-12 border border-slate-300 rounded-xl pl-11 pr-4 text-sm text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold shadow-sm transition"
            >
              {loading ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <Send size={17} />
              )}

              {loading ? "Sending link..." : "Send reset link"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Remembered it?{" "}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              Sign in
            </Link>
          </p>
        </div>

      )}

    </AuthLayout>
  );
};

export default ForgotPassword;
