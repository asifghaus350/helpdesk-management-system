function DashboardCard({
  title,
  count,
  icon: Icon,
  color,
  iconColor,
  barColor,
  percent,
  hint,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="flex items-start justify-between">
        {/* Card Content */}
        <div>
          <p className="text-xs sm:text-sm font-medium text-slate-500">
            {title}
          </p>

          <h2 className="text-2xl sm:text-3xl font-bold mt-2 text-slate-800">
            {count}
          </h2>
        </div>

        {/* Icon */}
        <div
          className={`${color} ${iconColor} w-9 h-9 sm:w-12 sm:h-12 shrink-0 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}
        >
          <Icon className="w-4.5 h-4.5 sm:w-6 sm:h-6" strokeWidth={2} />
        </div>
      </div>

      {/* Share of total */}
      <div className="mt-4 sm:mt-5">
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} rounded-full transition-all duration-500`}
            style={{ width: `${percent}%` }}
          />
        </div>

        <p className="text-xs text-slate-500 mt-2 truncate">
          {hint}
        </p>
      </div>
    </button>
  );
}

export default DashboardCard;
