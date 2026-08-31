import { ShieldX } from "lucide-react";
import { useNavigate } from "react-router-dom";

function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">

        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
          <ShieldX
            size={42}
            className="text-red-500"
          />
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-slate-800 mb-3">
          Access Denied
        </h1>

        {/* Message */}
        <p className="text-slate-500 leading-7 mb-8">
          You don't have permission to access this page.
          This section is available only to administrators.
        </p>

        {/* Back Button */}
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition"
        >
          Back to Dashboard
        </button>

      </div>
    </div>
  );
}

export default AccessDenied;