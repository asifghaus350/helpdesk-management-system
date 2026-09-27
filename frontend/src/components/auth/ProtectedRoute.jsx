import { Navigate, Outlet, useLocation } from "react-router-dom";
import { clearSession, isTokenExpired } from "../../utils/auth";

function ProtectedRoute() {
  const token = localStorage.getItem("token");
  const location = useLocation();

  // =========================
  // NOT LOGGED IN
  // =========================

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // =========================
  // TOKEN EXPIRED
  // =========================

  if (isTokenExpired(token)) {
    clearSession();

    return <Navigate to="/login?expired=1" replace />;
  }

  // =========================
  // GET CURRENT USER
  // =========================

  let user = null;

  try {
    user = JSON.parse(
      localStorage.getItem("user") || "null"
    );
  } catch (error) {
    console.error(
      "Invalid user data in localStorage:",
      error
    );
  }

  // =========================
  // USER DATA MISSING
  // =========================

  if (!user) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    return <Navigate to="/login" replace />;
  }

  // =========================
  // ADMIN-ONLY ROUTES
  // =========================

  const adminOnlyRoutes = [
    "/users",
  ];

  const isAdminOnlyRoute =
    adminOnlyRoutes.some((route) =>
      location.pathname === route ||
      location.pathname.startsWith(`${route}/`)
    );

  // =========================
  // CHECK ADMIN ACCESS
  // =========================

  if (
    isAdminOnlyRoute &&
    user.role !== "Admin"
  ) {
    return <Navigate to="/access-denied" replace />;
  }

  // =========================
  // ALLOW ACCESS
  // =========================

  return <Outlet />;
}

export default ProtectedRoute;