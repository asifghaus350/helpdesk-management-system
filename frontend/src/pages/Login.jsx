import { Mail, Lock } from "lucide-react";

function Login() {
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

        <div className="bg-white shadow-xl rounded-3xl w-[450px] p-10">

          <h2 className="text-3xl font-bold text-center mb-2">
            Welcome Back
          </h2>

          <p className="text-center text-gray-500 mb-8">
            Login to continue
          </p>

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
                placeholder="Enter email"
                className="w-full border rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>

          </div>

          {/* Password */}

          <div className="mb-6">

            <label className="font-medium">
              Password
            </label>

            <div className="relative mt-2">

              <Lock
                size={20}
                className="absolute left-4 top-3 text-gray-400"
              />

              <input
                type="password"
                placeholder="Enter password"
                className="w-full border rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>

          </div>

          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition">

            Login

          </button>

        </div>

      </div>

    </div>
  );
}

export default Login;