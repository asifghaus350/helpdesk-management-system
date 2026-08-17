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


function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
      
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tickets" element={<TicketList />} />
        <Route path="/tickets/create" element={<CreateTicket />} />
        <Route path="/tickets/edit/:id" element={<EditTicket />} />
        <Route path="/tickets/:id" element={<TicketDetails />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/login" element={<Login />} />

        <Route path="*" element={<NotFound />} />
        <Route path="/reports" element={<Reports />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;