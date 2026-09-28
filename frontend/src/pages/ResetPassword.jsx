import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  CheckCircle,
  CircleAlert,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Lock,
  X,
} from "lucide-react";

import AuthLayout from "../components/auth/AuthLayout";
import { API_URL } from "../config";

const REDIRECT_SECONDS = 3;

const strengthLevels = [
  { label: "", color: "bg-slate-200", text: "text-slate-400" },
  { label: "Weak", color: "bg-red-500", text: "text-red-600" },
  { label: "Fair", color: "bg-amber-500", text: "text-amber-600" },
  { label: "Good", color: "bg-blue-500", text: "text-blue-600" },
  { label: "Strong", color: "bg-emerald-500", text: "text-emerald-600" },
];

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);

  // After a successful reset, count down and go to login
  useEffect(() => {
    if (!success) return undefined;

    if (secondsLeft <= 0) {
      navigate("/login");
      return undefined;
    }

    const timer = setTimeout(
      () => setSecondsLeft((seconds) => seconds - 1),
      1000
    );

    return () => clearTimeout(timer);
  }, [success, secondsLeft, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSuccess("");
    setError("");

    if (!token) {
      setError("Invalid password reset link.");
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError("Please enter and confirm your new password.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/auth/reset-password/${token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            newPassword,
            confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to reset password."
        );
      }

      setSecondsLeft(REDIRECT_SECONDS);
      setSuccess(
        data.message || "Your password has been reset."
      );

      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Reset password error:", error);

      setError(
        error.message || "Unable to reset password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // PASSWORD STRENGTH
  // =========================

  const passwordChecks = [
    { label: "At least 6 characters", passed: newPassword.length >= 6 },
    { label: "A number", passed: /\d/.test(newPassword) },
    {
      label: "Upper and lower case",
      passed: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword),
    },
    { label: "A symbol", passed: /[^A-Za-z0-9]/.test(newPassword) },
  ];

  const strengthScore = newPassword
    ? passwordChecks.filter((check) => check.passed).length
    : 0;

  const strength = strengthLevels[strengthScore];

  const passwordsMatch =
    !!confirmPassword && confirmPassword === newPassword;

  const inputClass =
    "w-full h-12 border border-slate-300 rounded-xl pl-11 pr-12 text-sm text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition";

  // =========================
  // SUCCESS
  // =========================

  if (success) {
    return (
      <AuthLayout>
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <CheckCircle size={28} />
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-slate-800 mt-6">
          Password updated
        </h1>

        <p className="text-slate-500 mt-2 leading-relaxed">
          {success} You can now sign in with your new password.
        </p>

        <Link
          to="/login"
          className="mt-8 w-full h-12 inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
        >
          Sign in now
        </Link>

        <p
          aria-live="polite"
          className="mt-4 text-center text-sm text-slate-500"
        >
          Redirecting to sign in in {secondsLeft}s...
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>

      <Link
        to="/login"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-600 transition mb-8"
      >
        <ArrowLeft size={16} />
        Back to sign in
      </Link>

      <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
        <KeyRound size={28} />
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-slate-800 mt-6">
        Set a new password
      </h1>

      <p className="text-slate-500 mt-2 leading-relaxed">
        Choose a strong password you haven&apos;t used before.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600"
        >
          <CircleAlert size={18} className="shrink-0 mt-0.5" />

          <div>
            <p>{error}</p>

            {/expired|invalid/i.test(error) && (
              <Link
                to="/forgot-password"
                className="inline-block mt-1 font-semibold text-red-700 underline"
              >
                Request a new reset link
              </Link>
            )}
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-5"
        noValidate
      >

        {/* New Password */}

        <div>
          <label
            htmlFor="newPassword"
            className="block text-sm font-semibold text-slate-700 mb-1.5"
          >
            New password
          </label>

          <div className="relative">
            <Lock
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              autoComplete="new-password"
              autoFocus
              className={inputClass}
            />

            <button
              type="button"
              onClick={() => setShowNewPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600"
              aria-label={
                showNewPassword
                  ? "Hide new password"
                  : "Show new password"
              }
            >
              {showNewPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>

          {/* Strength meter */}

          <div className="flex items-center gap-3 mt-2.5">
            <div className="flex-1 grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`h-1.5 rounded-full transition-colors ${
                    strengthScore >= level
                      ? strength.color
                      : "bg-slate-200"
                  }`}
                />
              ))}
            </div>

            <span
              className={`text-xs font-semibold w-12 text-right ${strength.text}`}
            >
              {strength.label}
            </span>
          </div>

          <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3">
            {passwordChecks.map((check) => (
              <li
                key={check.label}
                className={`flex items-center gap-1.5 text-xs ${
                  check.passed
                    ? "text-emerald-600"
                    : "text-slate-500"
                }`}
              >
                {check.passed ? (
                  <Check size={13} />
                ) : (
                  <span className="w-1.5 h-1.5 mx-0.75 rounded-full bg-slate-300" />
                )}
                {check.label}
              </li>
            ))}
          </ul>
        </div>

        {/* Confirm Password */}

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-semibold text-slate-700 mb-1.5"
          >
            Confirm password
          </label>

          <div className="relative">
            <Lock
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              autoComplete="new-password"
              className={inputClass}
            />

            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600"
              aria-label={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
            >
              {showConfirmPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>

          {confirmPassword && (
            <p
              className={`flex items-center gap-1.5 text-xs mt-2 ${
                passwordsMatch ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {passwordsMatch ? <Check size={14} /> : <X size={14} />}
              {passwordsMatch
                ? "Passwords match"
                : "Passwords do not match"}
            </p>
          )}
        </div>

        {/* Submit */}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold shadow-sm transition"
        >
          {loading && (
            <LoaderCircle size={18} className="animate-spin" />
          )}
          {loading ? "Updating password..." : "Reset password"}
        </button>

      </form>

    </AuthLayout>
  );
};

export default ResetPassword;
