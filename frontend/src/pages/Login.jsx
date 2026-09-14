import { useState } from "react";
import { Mail, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../firebase";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
const [loading, setLoading] = useState(false);
const [googleLoading, setGoogleLoading] = useState(false);
const [error, setError] = useState("");

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
        "http://localhost:5000/api/auth/login",
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

      // Save JWT token
      localStorage.setItem("token", data.token);

      // Save logged-in user
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      // Notify other components about user change
      window.dispatchEvent(new Event("userChanged"));

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
      "http://localhost:5000/api/auth/google",
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

    // Save HelpDesk JWT token
    localStorage.setItem(
      "token",
      data.token
    );

    // Save logged-in HelpDesk user
    localStorage.setItem(
      "user",
      JSON.stringify(data.user)
    );

    // Notify other components about user change
    window.dispatchEvent(
      new Event("userChanged")
    );

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

  return (
    <div className="min-h-screen bg-slate-100 flex">

      {/* Left Side */}

      <div className="hidden lg:flex w-1/2 bg-blue-700 text-white items-center justify-center p-12">

        <div>

          <h1 className="text-5xl font-bold mb-6">
            HelpDesk Ticket
            <br />
            Management System
          </h1>

          <p className="text-xl text-blue-100 leading-8">
            Manage support tickets, assign engineers,
            track progress and resolve customer issues
            from one modern dashboard.
          </p>

        </div>

      </div>

      {/* Right Side */}

      <div className="flex-1 flex items-center justify-center">

        <div className="bg-white shadow-xl rounded-3xl w-112.5 p-10">

          <h2 className="text-3xl font-bold text-center mb-2">
            Welcome Back
          </h2>

          <p className="text-center text-gray-500 mb-8">
            Login to continue
          </p>

          {/* Error Message */}

          {error && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>

            {/* Email */}

            <div className="mb-5">

              <label className="font-medium">
                Email
              </label>

              <div className="relative mt-2">

                <Mail
                  size={20}
                  className="absolute left-4 top-3 text-gray-400"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="Enter email"
                  autoComplete="email"
                  className="w-full border rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

            </div>

            {/* Password */}

            <div className="mb-6">

              <div className="flex items-center justify-between">

                <label className="font-medium">
                  Password
                </label>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/forgot-password")
                  }
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 transition"
                >
                  Forgot Password?
                </button>

              </div>

              <div className="relative mt-2">

                <Lock
                  size={20}
                  className="absolute left-4 top-3 text-gray-400"
                />

                <input
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="w-full border rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

            </div>

            {/* Login Button */}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-xl font-semibold transition"
            >
              {loading
                ? "Logging in..."
                : "Login"}
            </button>

            {/* Google Login Divider */}

            <div className="flex items-center gap-3 my-6">

              <div className="flex-1 h-px bg-gray-200"></div>

              <span className="text-sm text-gray-400">
                OR
              </span>

              <div className="flex-1 h-px bg-gray-200"></div>

            </div>

            {/* Google Login Button */}

           <button
  type="button"
  onClick={handleGoogleLogin}
  disabled={googleLoading || loading}
  className="w-full h-12 border border-gray-300 bg-white hover:bg-gray-50 disabled:bg-gray-100 text-gray-700 rounded-xl font-medium transition flex items-center justify-center gap-3"
>
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

  <span>
    {googleLoading
      ? "Connecting..."
      : "Continue with Google"}
  </span>
</button>

          </form>

        </div>

      </div>

    </div>
  );
}

export default Login;