import { useNavigate, Link } from "react-router-dom";
import { ShieldX, ArrowLeft, LayoutDashboard } from "lucide-react";

import StatusPage from "../components/common/StatusPage";
import { getStoredUser } from "../utils/auth";

function AccessDenied() {
  const navigate = useNavigate();
  const user = getStoredUser();

  return (
    <StatusPage
      code="403"
      icon={ShieldX}
      iconClass="bg-red-500 text-white"
      title="Access denied"
      message="You don't have permission to open this page. It's only available to administrators."
      footer={
        user && (
          <>
            Signed in as{" "}
            <span className="font-medium text-slate-600">
              {user.name}
            </span>{" "}
            <span className="inline-block px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold">
              {user.role}
            </span>
            <br />
            Need access? Ask an administrator to update your role.
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
        to="/dashboard"
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition"
      >
        <LayoutDashboard size={17} />
        Back to Dashboard
      </Link>
    </StatusPage>
  );
}

export default AccessDenied;
