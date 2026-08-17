import { useState } from "react";

function RecentTickets() {
  const [tickets] = useState(() => {
    const storedTickets =
      JSON.parse(localStorage.getItem("tickets")) || [];

    return [...storedTickets].reverse().slice(0, 5);
  });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-6">
      {/* Heading */}

      <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-6">
        Recent Tickets
      </h2>

      {/* No Tickets */}

      {tickets.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-6">
          No recent tickets found.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Table Header */}

            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700">
                <th className="text-left py-3 px-2 text-slate-800 dark:text-white">
                  ID
                </th>

                <th className="text-left px-2 text-slate-800 dark:text-white">
                  Title
                </th>

                <th className="text-left px-2 text-slate-800 dark:text-white">
                  Status
                </th>

                <th className="text-left px-2 text-slate-800 dark:text-white">
                  Priority
                </th>
              </tr>
            </thead>

            {/* Table Body */}

            <tbody>
              {tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="border-b border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                >
                  <td className="py-4 px-2 text-slate-700 dark:text-gray-200">
                    {ticket.id}
                  </td>

                  <td className="px-2 text-slate-700 dark:text-gray-200">
                    {ticket.title}
                  </td>

                  <td className="px-2 text-slate-700 dark:text-gray-200">
                    {ticket.status}
                  </td>

                  <td className="px-2 text-slate-700 dark:text-gray-200">
                    {ticket.priority}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default RecentTickets;