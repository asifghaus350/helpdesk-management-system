import { useState } from "react";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LoaderCircle,
  CircleAlert,
  UserPlus,
} from "lucide-react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { isTokenExpired } from "../utils/auth";
import AuthLayout from "../components/auth/AuthLayout";
import CheckEmailNotice from "../components/auth/CheckEmailNotice";
import { API_URL } from "../config";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClass =
  "w-full h-12 border border-slate-300 rounded-xl pl-11 pr-4 text-sm text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Set after sign-up: the account waits for email verification
  const [sent, setSent] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (!EMAIL_PATTERN.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      // 502: account created but the email couldn't be sent;
      // the notice's "Resend email" button can retry.
      if (response.ok || (response.status === 502 && data.email)) {
        setPassword("");
        setConfirmPassword("");
        setSent({
          email: data.email || email.trim().toLowerCase(),
          message: response.ok ? "" : data.message,
        });
        return;
      }

      throw new Error(
        data.message || "Registration failed. Please try again."
      );
    } catch (error) {
      console.error("Register error:", error);

      setError(
        error.message || "Unable to create account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Already logged in: skip the sign-up screen
  const existingToken = localStorage.getItem("token");

  if (existingToken && !isTokenExpired(existingToken)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (sent) {
    return (
      <AuthLayout>
        <CheckEmailNotice
          email={sent.email}
          message={sent.message}
          onBack={() => navigate("/login")}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>

      {/* Heading */}

      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">
          Create your account
        </h2>

        <p className="text-slate-500 mt-2">
          Sign up to raise and track your support tickets.
        </p>
      </div>

      {/* Error Message */}

      {error && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600"
        >
          <CircleAlert size={18} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <form
        onSubmit={handleRegister}
        className="space-y-5"
        noValidate
      >

        {/* Name */}

        <div>
          <label
            htmlFor="register-name"
            className="block text-sm font-semibold text-slate-700 mb-1.5"
          >
            Full name
          </label>

          <div className="relative">
            <User
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="register-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              autoComplete="name"
              maxLength={80}
              autoFocus
              className={inputClass}
            />
          </div>
        </div>

        {/* Email */}

        <div>
          <label
            htmlFor="register-email"
            className="block text-sm font-semibold text-slate-700 mb-1.5"
          >
            Email
          </label>

          <div className="relative">
            <Mail
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              className={inputClass}
            />
          </div>
        </div>

        {/* Password */}

        <div>
          <label
            htmlFor="register-password"
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
              id="register-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              className={`${inputClass} pr-12`}
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

        {/* Confirm Password */}

        <div>
          <label
            htmlFor="register-confirm-password"
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
              id="register-confirm-password"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              className={inputClass}
            />
          </div>

          {confirmPassword && password !== confirmPassword && (
            <p className="mt-1.5 text-xs text-red-600">
              Passwords do not match.
            </p>
          )}
        </div>

        {/* Submit */}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold shadow-sm transition"
        >
          {loading ? (
            <LoaderCircle size={18} className="animate-spin" />
          ) : (
            <UserPlus size={18} />
          )}

          {loading ? "Creating account..." : "Create account"}
        </button>

      </form>

      <p className="mt-8 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-semibold text-blue-600 hover:text-blue-700 transition"
        >
          Sign in
        </Link>
      </p>

    </AuthLayout>
  );
}

export default Register;
