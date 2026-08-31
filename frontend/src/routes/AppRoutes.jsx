import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import TicketList from "../pages/TicketList";
import CreateTicket from "../pages/CreateTicket";
import EditTicket from "../pages/EditTicket";
import TicketDetails from "../pages/TicketDetails";
import UserManagement from "../pages/UserManagement";
import Profile from "../pages/Profile";
import NotFound from "../pages/NotFound";
import Settings from "../pages/Settings";
import Reports from "../pages/Reports";
import AccessDenied from "../pages/AccessDenied";

import ProtectedRoute from "../components/auth/ProtectedRoute";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =========================
            PUBLIC ROUTES
        ========================= */}

        <Route path="/" element={<Login />} />

        <Route path="/login" element={<Login />} />

        {/* =========================
            AUTHENTICATED ROUTES
        ========================= */}

        <Route element={<ProtectedRoute />}>

          {/* Dashboard */}

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />


          <Route
            path="/access-denied"
            element={<AccessDenied />}
         />

          {/* Tickets */}

          <Route
            path="/tickets"
            element={<TicketList />}
          />

          <Route
            path="/tickets/create"
            element={<CreateTicket />}
          />

          <Route
            path="/tickets/edit/:id"
            element={<EditTicket />}
          />

          <Route
            path="/tickets/:id"
            element={<TicketDetails />}
          />

          {/* Profile */}

          <Route
            path="/profile"
            element={<Profile />}
          />

          {/* Settings */}

          <Route
            path="/settings"
            element={<Settings />}
          />

          {/* Reports */}

          <Route
            path="/reports"
            element={<Reports />}
          />

        </Route>

        {/* =========================
            ADMIN ONLY ROUTES
        ========================= */}

        <Route
          element={
            <ProtectedRoute allowedRoles={["Admin"]} />
          }
        >

          <Route
            path="/users"
            element={<UserManagement />}
          />

        </Route>

        {/* =========================
            404
        ========================= */}

        <Route
          path="*"
          element={<NotFound />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;