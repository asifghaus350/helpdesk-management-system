import { Link } from "react-router-dom";
import { Ticket } from "lucide-react";

// Full-screen page for errors like 404 / 403.
// Works with or without a logged-in user (no sidebar).

function StatusPage({
  code,
  icon: Icon,
  iconClass,
  title,
  message,
  children,
  footer,
}) {
  return (
    <div className="min-h-screen bg-[#f7f8fa] dark:bg-slate-900 flex flex-col">

      {/* Brand */}

      <header className="px-6 py-5">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2.5"
        >
          <span className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
            <Ticket size={19} />
          </span>

          <span className="text-lg font-bold text-slate-800">
            HelpDesk
          </span>
        </Link>
      </header>

      {/* Content */}

      <main className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-lg text-center">

          <div className="relative inline-flex items-center justify-center">
            <span
              aria-hidden="true"
              className="text-[9rem] sm:text-[11rem] leading-none font-black tracking-tighter text-slate-200 dark:text-slate-800 select-none"
            >
              {code}
            </span>

            <span
              className={`absolute w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg ring-8 ring-white ${iconClass}`}
            >
              <Icon size={36} />
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800 mt-4">
            {title}
          </h1>

          <div className="text-slate-500 mt-3 leading-relaxed">
            {message}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            {children}
          </div>

          {footer && (
            <div className="mt-8 text-sm text-slate-400">
              {footer}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default StatusPage;
