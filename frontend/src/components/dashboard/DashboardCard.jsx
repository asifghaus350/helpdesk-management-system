function DashboardCard({
  title,
  count,
  icon: Icon,
  color,
  iconColor,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow duration-200">

      {/* Card Content */}
      <div>
        <p className="text-sm font-medium text-slate-500">
          {title}
        </p>

        <h2 className="text-4xl font-bold mt-2 text-slate-800">
          {count}
        </h2>
      </div>

      {/* Icon */}
      <div
        className={`${color} ${iconColor} w-16 h-16 rounded-2xl flex items-center justify-center`}
      >
        <Icon size={30} strokeWidth={2} />
      </div>

    </div>
  );
}

export default DashboardCard;