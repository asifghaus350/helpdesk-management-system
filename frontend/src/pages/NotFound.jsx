import { useLocation, useNavigate, Link } from "react-router-dom";
import { SearchX, ArrowLeft, LayoutDashboard, LogIn } from "lucide-react";

import StatusPage from "../components/common/StatusPage";

function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();

  const isLoggedIn = Boolean(localStorage.getItem("token"));

  return (
    <StatusPage
      code="404"
      icon={SearchX}
      iconClass="bg-blue-600 text-white"
      title="Page not found"
      message={
        <>
          We couldn't find{" "}
          <code className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-sm break-all">
            {location.pathname}
          </code>
          . It may have been moved, deleted, or the link is wrong.
        </>
      }
      footer={
        isLoggedIn && (
          <>
            Looking for a ticket?{" "}
            <Link
              to="/tickets"
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              Browse all tickets
            </Link>
          </>
        )
      }
    >
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
      >
        <ArrowLeft size={17} />
        Go back
      </button>

      <Link
        to={isLoggedIn ? "/dashboard" : "/login"}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition"
      >
        {isLoggedIn ? (
          <LayoutDashboard size={17} />
        ) : (
          <LogIn size={17} />
        )}
        {isLoggedIn ? "Go to Dashboard" : "Go to Login"}
      </Link>
    </StatusPage>
  );
}

export default NotFound;
