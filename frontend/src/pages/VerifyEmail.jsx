import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  CircleAlert,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  MailCheck,
} from "lucide-react";

import AuthLayout from "../components/auth/AuthLayout";
import { clearSession, updateStoredUser } from "../utils/auth";
import { API_URL } from "../config";

// Opened from the sign-up email. Asks for the sign-up password too,
// so only the person who owns the inbox AND chose the password can
// activate the account.

function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Enter the password you chose when signing up.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/auth/verify-email/${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to verify your email.");
      }

      clearSession();
      localStorage.setItem("token", data.token);
      updateStoredUser(data.user);

      navigate("/dashboard", { replace: true });
    } catch (verifyError) {
      setError(verifyError.message || "Unable to verify your email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <span className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
        <MailCheck size={28} />
      </span>

      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">
          Verify your email
        </h2>

        <p className="text-slate-500 mt-2">
          Enter the password you chose when you signed up to activate your
          account.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600"
        >
          <CircleAlert size={18} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label
            htmlFor="verify-password"
            className="block text-sm font-semibold text-slate-700 mb-1.5"
          >
            Password
          </label>

          <div className="relative">
            <Lock
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="verify-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your sign-up password"
              autoComplete="current-password"
              autoFocus
              className="w-full h-12 border border-slate-300 rounded-xl pl-11 pr-12 text-sm text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
            />

            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
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
            <MailCheck size={18} />
          )}
          {loading ? "Verifying..." : "Verify and sign in"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500">
        Forgot the password?{" "}
        <Link
          to="/forgot-password"
          className="font-semibold text-blue-600 hover:text-blue-700 transition"
        >
          Reset it
        </Link>{" "}
        — that verifies your email too.
      </p>
    </AuthLayout>
  );
}

export default VerifyEmail;
