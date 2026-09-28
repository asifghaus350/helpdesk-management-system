import {
  Ticket,
  UserCheck,
  BarChart3,
  MessageSquare,
  CheckCircle,
} from "lucide-react";

const features = [
  {
    icon: UserCheck,
    title: "Assign the right engineer",
    text: "Route every ticket to someone who can fix it.",
  },
  {
    icon: MessageSquare,
    title: "Keep the conversation in one place",
    text: "Comments and a full activity history on every ticket.",
  },
  {
    icon: BarChart3,
    title: "See what's slowing you down",
    text: "Reports on status, priority and engineer workload.",
  },
];

// Split-screen shell for login / forgot / reset password.

function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex bg-[#f7f8fa] dark:bg-slate-900">

      {/* =========================
          BRAND PANEL (desktop)
      ========================= */}

      <aside className="hidden lg:flex lg:w-[46%] xl:w-1/2 relative overflow-hidden bg-linear-to-br from-blue-600 via-blue-700 to-indigo-700 text-white">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-white/10" />
        <div className="absolute -left-20 bottom-10 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute right-20 bottom-40 w-40 h-40 rounded-full bg-white/10" />

        <div className="relative flex flex-col justify-between w-full p-12 xl:p-16">

          {/* Logo */}

          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Ticket size={22} />
            </span>

            <div>
              <p className="text-lg font-bold leading-tight">
                HelpDesk
              </p>
              <p className="text-xs text-blue-100">
                Ticket Management
              </p>
            </div>
          </div>

          {/* Pitch */}

          <div className="max-w-md">
            <h1 className="text-4xl xl:text-5xl font-bold tracking-tight leading-tight">
              Resolve support issues faster.
            </h1>

            <p className="text-lg text-blue-100 mt-4 leading-relaxed">
              Raise, assign and track every support ticket from one
              clean dashboard.
            </p>

            <ul className="mt-10 space-y-5">
              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <li
                    key={feature.title}
                    className="flex gap-4"
                  >
                    <span className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                      <Icon size={19} />
                    </span>

                    <div>
                      <p className="font-semibold">
                        {feature.title}
                      </p>
                      <p className="text-sm text-blue-100 mt-0.5">
                        {feature.text}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Preview card */}

          <div className="max-w-sm bg-white/10 backdrop-blur border border-white/15 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-blue-100">
                #TKT-1042
              </span>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-100 text-xs font-semibold">
                <CheckCircle size={12} />
                Closed
              </span>
            </div>

            <p className="font-semibold mt-2">
              VPN not connecting from home
            </p>

            <p className="text-sm text-blue-100 mt-1">
              Resolved by the network team in 2 hours.
            </p>
          </div>
        </div>
      </aside>

      {/* =========================
          FORM PANEL
      ========================= */}

      <main className="flex-1 flex flex-col">

        {/* Mobile logo */}

        <div className="lg:hidden flex items-center gap-2.5 px-6 pt-6">
          <span className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
            <Ticket size={19} />
          </span>

          <span className="text-lg font-bold text-slate-800">
            HelpDesk
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>

        <p className="px-6 pb-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} HelpDesk Ticket Management System
        </p>
      </main>
    </div>
  );
}

export default AuthLayout;
