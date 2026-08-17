function DashboardCard({ title, count, icon: Icon, color }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-6 flex items-center justify-between">
      
      {/* Card Content */}

      <div>
        <p className="text-gray-500 dark:text-gray-300">
          {title}
        </p>

        <h2 className="text-4xl font-bold mt-2 text-slate-800 dark:text-white">
          {count}
        </h2>
      </div>

      {/* Icon */}

      <div className={`${color} p-4 rounded-xl text-white`}>
        <Icon size={28} />
      </div>

    </div>
  );
}

export default DashboardCard;