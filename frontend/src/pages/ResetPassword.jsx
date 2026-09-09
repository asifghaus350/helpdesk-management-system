import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CheckCircle, Eye, EyeOff, KeyRound, XCircle } from "lucide-react";

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
        `http://localhost:5000/api/auth/reset-password/${token}`,
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

      setSuccess(
        data.message || "Password reset successfully."
      );

      setNewPassword("");
      setConfirmPassword("");

      // Redirect to login after a short delay.
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      console.error("Reset password error:", error);

      setError(
        error.message || "Unable to reset password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">

          {/* Icon */}

          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
              <KeyRound className="w-7 h-7 text-blue-600" />
            </div>
          </div>

          {/* Heading */}

          <div className="text-center mb-7">
            <h1 className="text-2xl font-bold text-slate-900">
              Reset Password
            </h1>

            <p className="text-sm text-slate-500 mt-2 leading-6">
              Create a new password for your account.
            </p>
          </div>

          {/* Success Message */}

          {success && (
            <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4">
              <div className="flex items-start gap-3">

                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />

                <p className="text-sm text-green-700 leading-5">
                  {success}
                </p>

              </div>
            </div>
          )}

          {/* Error Message */}

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">

                <XCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />

                <p className="text-sm text-red-700 leading-5">
                  {error}
                </p>

              </div>
            </div>
          )}

          {/* Form */}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* New Password */}

            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                New Password
              </label>

              <div className="relative">

                <input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowNewPassword(!showNewPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={
                    showNewPassword
                      ? "Hide new password"
                      : "Show new password"
                  }
                >
                  {showNewPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>

              </div>

              <p className="text-xs text-slate-500 mt-2">
                Password must be at least 6 characters.
              </p>
            </div>

            {/* Confirm Password */}

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Confirm Password
              </label>

              <div className="relative">

                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>

              </div>
            </div>

            {/* Submit */}

            <button
              type="submit"
              disabled={loading || !!success}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium transition hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </button>

          </form>

          {/* Back to Login */}

          <div className="mt-7 text-center">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition"
            >
              Back to Login
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ResetPassword;