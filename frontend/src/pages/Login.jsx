import { useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LoaderCircle,
  CircleAlert,
  LogIn,
} from "lucide-react";
import {
  Navigate,
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "../firebase";
import {
  clearSession,
  updateStoredUser,
  isTokenExpired,
} from "../utils/auth";
import AuthLayout from "../components/auth/AuthLayout";
import { API_URL } from "../config";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
const [loading, setLoading] = useState(false);
const [googleLoading, setGoogleLoading] = useState(false);
const [searchParams] = useSearchParams();
const [error, setError] = useState(
  searchParams.get("expired")
    ? "Your session has expired. Please log in again."
    : ""
);

  // Existing Email/Password Login
  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    // Basic validation
    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Login failed. Please try again."
        );
      }

      // Start from a clean session
      clearSession();

      // Save JWT token
      localStorage.setItem("token", data.token);

      // Save logged-in user (also notifies navbar/sidebar)
      updateStoredUser(data.user);

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);

      setError(
        error.message ||
          "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Google Login
  const handleGoogleLogin = async () => {
  if (!auth) {
    setError(
      "Google login is not configured yet. Please sign in with email and password."
    );
    return;
  }

  try {
   setError("");
setGoogleLoading(true);
    // Start Google authentication with Firebase
    const provider = new GoogleAuthProvider();

    const result = await signInWithPopup(
      auth,
      provider
    );

    // Get Firebase ID token
    const idToken = await result.user.getIdToken();

    // Send Firebase token to HelpDesk backend
    const response = await fetch(
      `${API_URL}/api/auth/google`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idToken,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Google login failed. Please try again."
      );
    }

    // Start from a clean session
    clearSession();

    // Save HelpDesk JWT token
    localStorage.setItem(
      "token",
      data.token
    );

    // Save logged-in HelpDesk user (also notifies navbar/sidebar)
    updateStoredUser(data.user);

    // Redirect to dashboard
    navigate("/dashboard");

  } catch (error) {
    console.error(
      "Google login error:",
      error
    );

    setError(
      error.message ||
        "Unable to login with Google. Please try again."
    );
  } finally {
    setGoogleLoading(false);
  }
};

  // Already logged in with a valid session: skip the login screen
  const existingToken = localStorage.getItem("token");

  if (existingToken && !isTokenExpired(existingToken)) {
    return <Navigate to="/dashboard" replace />;
  }

  const busy = loading || googleLoading;

  return (
    <AuthLayout>

      {/* Heading */}

      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">
          Welcome back
        </h2>

        <p className="text-slate-500 mt-2">
          Sign in to your HelpDesk account.
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

      {/* Google Login */}

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={busy || !isFirebaseConfigured}
        title={
          isFirebaseConfigured
            ? undefined
            : "Google login is not configured (Firebase keys missing in frontend/.env)"
        }
        className="w-full h-12 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed text-slate-700 rounded-xl text-sm font-semibold shadow-sm transition flex items-center justify-center gap-3"
      >
        {googleLoading ? (
          <LoaderCircle size={20} className="animate-spin" />
        ) : (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fill="#4285F4"
              d="M21.35 12.27c0-.68-.06-1.34-.18-1.97H12v3.73h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.15Z"
            />
            <path
              fill="#34A853"
              d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.93-3.31.93-2.54 0-4.69-1.72-5.46-4.03H3.3v2.52A9.75 9.75 0 0 0 12 21.75Z"
            />
            <path
              fill="#FBBC05"
              d="M6.54 13.84A5.86 5.86 0 0 1 6.23 12c0-.64.11-1.26.31-1.84V7.64H3.3A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.36l3.24-2.52Z"
            />
            <path
              fill="#EA4335"
              d="M12 6.13c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.22 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.7 5.39l3.24 2.52C7.31 7.85 9.46 6.13 12 6.13Z"
            />
          </svg>
        )}

        <span>
          {googleLoading
            ? "Connecting..."
            : "Continue with Google"}
        </span>
      </button>

      {/* Divider */}

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-slate-200" />

        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          or sign in with email
        </span>

        <div className="flex-1 h-px bg-slate-200" />
      </div>

      <form
        onSubmit={handleLogin}
        className="space-y-5"
        noValidate
      >

        {/* Email */}

        <div>
          <label
            htmlFor="login-email"
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
              id="login-email"
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="you@company.com"
              autoComplete="email"
              autoFocus
              className="w-full h-12 border border-slate-300 rounded-xl pl-11 pr-4 text-sm text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
            />
          </div>
        </div>

        {/* Password */}

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="login-password"
              className="block text-sm font-semibold text-slate-700"
            >
              Password
            </label>

            <Link
              to="/forgot-password"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition"
            >
              Forgot password?
            </Link>
          </div>

          <div className="relative">
            <Lock
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Enter your password"
              autoComplete="current-password"
              className="w-full h-12 border border-slate-300 rounded-xl pl-11 pr-12 text-sm text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
            />

            {/* Show / Hide Password */}
            <button
              type="button"
              onClick={() =>
                setShowPassword((prev) => !prev)
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600"
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
              title={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
            >
              {showPassword ? (
                <EyeOff size={19} />
              ) : (
                <Eye size={19} />
              )}
            </button>
          </div>
        </div>

        {/* Login Button */}

        <button
          type="submit"
          disabled={busy}
          className="w-full h-12 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold shadow-sm transition"
        >
          {loading ? (
            <LoaderCircle size={18} className="animate-spin" />
          ) : (
            <LogIn size={18} />
          )}

          {loading
            ? "Signing in..."
            : "Sign in"}
        </button>

      </form>

      <p className="mt-8 text-center text-sm text-slate-500">
        Don't have an account? Ask your administrator to create one.
      </p>

    </AuthLayout>
  );
}

export default Login;