import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Ticket,
  CircleAlert,
  LoaderCircle,
  CheckCircle,
  Percent,
  UserX,
  Download,
  BarChart3,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

import Layout from "../components/layout/Layout";
import { initials } from "../utils/format";
import { API_URL } from "../config";

// =========================
// CHART COLORS
// =========================
// Same status colors as the rest of the app. Checked with the
// data-viz palette validator (CVD + normal-vision separation pass);
// every chart also shows its numbers as text, so color is never
// the only way to read a value.

const STATUS_COLORS = {
  Open: "#3b82f6",
  "In Progress": "#f59e0b",
  Closed: "#10b981",
};

const STATUSES = ["Open", "In Progress", "Closed"];
const PRIORITIES = ["High", "Medium", "Low"];
const CATEGORIES = ["Bug", "Support", "Feature Request"];

const SERIES_COLOR = "#3b82f6";
const GRID_COLOR = "#e2e8f0";
const AXIS_TEXT = "#64748b";

const RANGES = [
  { id: "7", label: "7 days", days: 7 },
  { id: "30", label: "30 days", days: 30 },
  { id: "90", label: "90 days", days: 90 },
  { id: "all", label: "All time", days: null },
];

const DAY = 24 * 60 * 60 * 1000;

const percent = (value, total) =>
  total ? Math.round((value / total) * 100) : 0;

const shortDate = (date) =>
  date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });

// =========================
// TOOLTIP
// =========================

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  const rows = payload.filter(
    (item) => item.value !== undefined
  );

  const total = rows.reduce(
    (sum, item) => sum + (Number(item.value) || 0),
    0
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3.5 py-2.5 text-sm min-w-36">
      {label !== undefined && (
        <p className="font-semibold text-slate-800 mb-1.5">
          {label}
        </p>
      )}

      {rows.map((item) => (
        <div
          key={item.name}
          className="flex items-center justify-between gap-4"
        >
          <span className="inline-flex items-center gap-2 text-slate-600">
            <span
              className="w-2.5 h-2.5 rounded-sm"
              style={{
                backgroundColor:
                  item.payload?.color || item.color || item.fill,
              }}
            />
            {item.name}
          </span>

          <span className="font-semibold text-slate-800">
            {item.value}
          </span>
        </div>
      ))}

      {rows.length > 1 && (
        <div className="flex justify-between gap-4 mt-1.5 pt-1.5 border-t border-slate-100 text-slate-500">
          <span>Total</span>
          <span className="font-semibold text-slate-800">
            {total}
          </span>
        </div>
      )}
    </div>
  );
}

// =========================
// CARD SHELL
// =========================

function ChartCard({ title, subtitle, children, className = "" }) {
  return (
    <section
      className={`bg-white border border-slate-200 rounded-2xl shadow-sm ${className}`}
    >
      <div className="px-5 pt-5">
        <h2 className="text-base font-semibold text-slate-800">
          {title}
        </h2>

        {subtitle && (
          <p className="text-sm text-slate-500 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
}

function StatusLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
      {STATUSES.map((status) => (
        <span
          key={status}
          className="inline-flex items-center gap-1.5"
        >
          <span
            className="w-2.5 h-2.5 rounded-sm"
            style={{ backgroundColor: STATUS_COLORS[status] }}
          />
          {status}
        </span>
      ))}
    </div>
  );
}

function Reports() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rangeId, setRangeId] = useState("30");

  // Fixed "now" for this visit, so ranges don't shift between renders
  const [now] = useState(() => Date.now());

  // =========================
  // FETCH TICKETS
  // =========================

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch(
          `${API_URL}/api/tickets`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to fetch report data"
          );
        }

        setTickets(data.tickets || []);
      } catch (error) {
        console.error(
          "Reports tickets error:",
          error
        );

        setError(
          error.message ||
            "Unable to load report data."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [navigate]);

  // =========================
  // REPORT DATA
  // =========================

  const range = RANGES.find((item) => item.id === rangeId);

  const report = useMemo(() => {
    const since = range.days ? now - range.days * DAY : null;

    const inRange = since
      ? tickets.filter(
          (ticket) =>
            new Date(ticket.createdAt).getTime() >= since
        )
      : tickets;

    const total = inRange.length;

    const byStatus = Object.fromEntries(
      STATUSES.map((status) => [
        status,
        inRange.filter((ticket) => ticket.status === status).length,
      ])
    );

    const unassigned = inRange.filter(
      (ticket) =>
        ticket.status !== "Closed" && !ticket.engineer
    ).length;

    // Status donut
    const statusData = STATUSES.map((status) => ({
      name: status,
      value: byStatus[status],
      color: STATUS_COLORS[status],
    }));

    // Priority, split by status (stacked)
    const priorityData = PRIORITIES.map((priority) => {
      const row = { name: priority };

      STATUSES.forEach((status) => {
        row[status] = inRange.filter(
          (ticket) =>
            ticket.priority === priority &&
            ticket.status === status
        ).length;
      });

      return row;
    });

    // Category
    const categoryData = CATEGORIES.map((category) => ({
      name: category,
      Tickets: inRange.filter(
        (ticket) => ticket.category === category
      ).length,
    }));

    // Created over time: daily up to 30 days, weekly beyond
    const earliest = inRange.reduce(
      (min, ticket) =>
        Math.min(min, new Date(ticket.createdAt).getTime()),
      now
    );

    const start = since ?? Math.min(earliest, now - 12 * 7 * DAY);
    const spanDays = Math.ceil((now - start) / DAY);
    const bucketDays = spanDays <= 31 ? 1 : 7;
    const bucketCount = Math.max(
      1,
      Math.ceil(spanDays / bucketDays)
    );

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const trendData = Array.from(
      { length: bucketCount },
      (_, index) => {
        const bucketEnd =
          startOfToday.getTime() +
          DAY -
          (bucketCount - 1 - index) * bucketDays * DAY;
        const bucketStart = bucketEnd - bucketDays * DAY;

        return {
          name:
            bucketDays === 1
              ? shortDate(new Date(bucketStart))
              : `Week of ${shortDate(new Date(bucketStart))}`,
          short: shortDate(new Date(bucketStart)),
          Created: inRange.filter((ticket) => {
            const created = new Date(ticket.createdAt).getTime();
            return created >= bucketStart && created < bucketEnd;
          }).length,
        };
      }
    );

    // Engineer workload
    const workloadMap = new Map();

    inRange.forEach((ticket) => {
      if (!ticket.engineer) return;

      const entry = workloadMap.get(ticket.engineer) || {
        name: ticket.engineer,
        active: 0,
        closed: 0,
      };

      if (ticket.status === "Closed") {
        entry.closed += 1;
      } else {
        entry.active += 1;
      }

      workloadMap.set(ticket.engineer, entry);
    });

    const workload = [...workloadMap.values()].sort(
      (a, b) =>
        b.active - a.active || b.closed - a.closed
    );

    return {
      inRange,
      total,
      byStatus,
      unassigned,
      resolutionRate: percent(byStatus.Closed, total),
      statusData,
      priorityData,
      categoryData,
      trendData,
      bucketDays,
      workload,
    };
  }, [tickets, range, now]);

  // =========================
  // CSV EXPORT
  // =========================

  const handleExport = () => {
    const header = [
      "Ticket ID",
      "Title",
      "Category",
      "Priority",
      "Status",
      "Engineer",
      "Created By",
      "Created At",
      "Updated At",
    ];

    const escape = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = report.inRange.map((ticket) => [
      ticket.ticketId,
      ticket.title,
      ticket.category,
      ticket.priority,
      ticket.status,
      ticket.engineer || "Unassigned",
      ticket.createdBy?.name || "",
      ticket.createdAt,
      ticket.updatedAt,
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map(escape).join(","))
      .join("\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" })
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = `helpdesk-report-${range.id}-${new Date(now)
      .toISOString()
      .slice(0, 10)}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6 animate-pulse">
          <div className="h-16 rounded-2xl bg-slate-200 max-w-md" />

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="h-24 rounded-2xl bg-slate-200"
              />
            ))}
          </div>

          <div className="h-80 rounded-2xl bg-slate-200" />
        </div>
      </Layout>
    );
  }

  const statCards = [
    {
      label: "Total Tickets",
      value: report.total,
      icon: Ticket,
      tile: "bg-blue-50 text-blue-600",
    },
    {
      label: "Open",
      value: report.byStatus.Open,
      icon: CircleAlert,
      tile: "bg-blue-50 text-blue-600",
      hint: `${percent(report.byStatus.Open, report.total)}%`,
    },
    {
      label: "In Progress",
      value: report.byStatus["In Progress"],
      icon: LoaderCircle,
      tile: "bg-amber-50 text-amber-600",
      hint: `${percent(report.byStatus["In Progress"], report.total)}%`,
    },
    {
      label: "Closed",
      value: report.byStatus.Closed,
      icon: CheckCircle,
      tile: "bg-emerald-50 text-emerald-600",
      hint: `${percent(report.byStatus.Closed, report.total)}%`,
    },
    {
      label: "Resolution Rate",
      value: `${report.resolutionRate}%`,
      icon: Percent,
      tile: "bg-violet-50 text-violet-600",
    },
    {
      label: "Unassigned",
      value: report.unassigned,
      icon: UserX,
      tile: "bg-red-50 text-red-600",
      hint: "active",
    },
  ];

  const maxWorkload = Math.max(
    1,
    ...report.workload.map((row) => row.active + row.closed)
  );

  const hasData = report.total > 0;

  return (
    <Layout>

      {/* =========================
          HEADER + FILTERS
      ========================= */}

      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">
            Reports
          </h1>

          <p className="text-slate-500 mt-2">
            Analyze support ticket performance and trends.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            role="group"
            aria-label="Date range"
            className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm"
          >
            {RANGES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRangeId(item.id)}
                aria-pressed={rangeId === item.id}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  rangeId === item.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExport}
            disabled={!hasData}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
          <CircleAlert size={18} />
          {error}
        </div>
      )}

      {/* =========================
          KPI TILES
      ========================= */}

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500">
                  {card.label}
                </p>

                <span
                  className={`${card.tile} w-8 h-8 rounded-lg flex items-center justify-center`}
                >
                  <Icon size={16} />
                </span>
              </div>

              <p className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-800">
                  {card.value}
                </span>

                {card.hint && (
                  <span className="text-xs text-slate-400">
                    {card.hint}
                  </span>
                )}
              </p>
            </div>
          );
        })}
      </div>

      {!hasData ? (

        /* =========================
            EMPTY STATE
        ========================= */

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm py-16 px-6 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
            <BarChart3 size={26} />
          </div>

          <p className="text-base font-semibold text-slate-800">
            No tickets in this period
          </p>

          <p className="text-sm text-slate-500 mt-1">
            Pick a longer date range to see report data.
          </p>

          {rangeId !== "all" && (
            <button
              type="button"
              onClick={() => setRangeId("all")}
              className="mt-5 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Show all time
            </button>
          )}
        </div>

      ) : (

        <div className="space-y-6">

          {/* =========================
              TREND
          ========================= */}

          <ChartCard
            title="Tickets created"
            subtitle={`${
              report.bucketDays === 1 ? "Per day" : "Per week"
            } · ${range.days ? `last ${range.label}` : "all time"}`}
          >
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={report.trendData}
                  margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
                >
                  <defs>
                    <linearGradient id="createdFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={SERIES_COLOR} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={SERIES_COLOR} stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    vertical={false}
                    stroke={GRID_COLOR}
                  />

                  <XAxis
                    dataKey="short"
                    tick={{ fill: AXIS_TEXT, fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: GRID_COLOR }}
                    interval="preserveStartEnd"
                    minTickGap={24}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: AXIS_TEXT, fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip
                    content={<ChartTooltip />}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.name
                    }
                    cursor={{ stroke: "#94a3b8", strokeDasharray: "4 4" }}
                  />

                  <Area
                    type="monotone"
                    dataKey="Created"
                    stroke={SERIES_COLOR}
                    strokeWidth={2}
                    fill="url(#createdFill)"
                    dot={false}
                    activeDot={{
                      r: 5,
                      stroke: "#ffffff",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {/* =========================
                STATUS
            ========================= */}

            <ChartCard
              title="Tickets by status"
              subtitle="Current state of tickets in this period"
            >
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative w-52 h-52 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={report.statusData.filter((item) => item.value > 0)}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={64}
                        outerRadius={92}
                        paddingAngle={
                          report.statusData.filter((item) => item.value > 0)
                            .length > 1
                            ? 2
                            : 0
                        }
                        stroke="#ffffff"
                        strokeWidth={2}
                        startAngle={90}
                        endAngle={-270}
                      >
                        {report.statusData
                          .filter((item) => item.value > 0)
                          .map((item) => (
                            <Cell key={item.name} fill={item.color} />
                          ))}
                      </Pie>

                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold text-slate-800">
                      {report.total}
                    </span>
                    <span className="text-xs text-slate-500">
                      tickets
                    </span>
                  </div>
                </div>

                {/* Legend with values */}

                <ul className="flex-1 w-full space-y-3">
                  {report.statusData.map((item) => (
                    <li key={item.name}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="inline-flex items-center gap-2 text-slate-600">
                          <span
                            className="w-2.5 h-2.5 rounded-sm"
                            style={{ backgroundColor: item.color }}
                          />
                          {item.name}
                        </span>

                        <span className="text-slate-800">
                          <span className="font-semibold">
                            {item.value}
                          </span>
                          <span className="text-slate-400 ml-2 text-xs">
                            {percent(item.value, report.total)}%
                          </span>
                        </span>
                      </div>

                      <div className="h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${percent(item.value, report.total)}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </ChartCard>

            {/* =========================
                PRIORITY (stacked by status)
            ========================= */}

            <ChartCard
              title="Tickets by priority"
              subtitle="Split by status, so you can see the backlog"
            >
              <div className="mb-3">
                <StatusLegend />
              </div>

              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={report.priorityData}
                    layout="vertical"
                    margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
                    barCategoryGap="28%"
                  >
                    <CartesianGrid
                      horizontal={false}
                      stroke={GRID_COLOR}
                    />

                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fill: AXIS_TEXT, fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />

                    <YAxis
                      type="category"
                      dataKey="name"
                      width={64}
                      tick={{ fill: "#334155", fontSize: 13 }}
                      tickLine={false}
                      axisLine={false}
                    />

                    <Tooltip
                      content={<ChartTooltip />}
                      cursor={{ fill: "#f1f5f9" }}
                    />

                    {STATUSES.map((status, index) => (
                      <Bar
                        key={status}
                        dataKey={status}
                        stackId="status"
                        fill={STATUS_COLORS[status]}
                        stroke="#ffffff"
                        strokeWidth={2}
                        radius={
                          index === STATUSES.length - 1
                            ? [0, 4, 4, 0]
                            : 0
                        }
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* =========================
                CATEGORY
            ========================= */}

            <ChartCard
              title="Tickets by category"
              subtitle="Where requests are coming from"
            >
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={report.categoryData}
                    margin={{ top: 16, right: 8, bottom: 0, left: -20 }}
                    barCategoryGap="36%"
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke={GRID_COLOR}
                    />

                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#334155", fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: GRID_COLOR }}
                    />

                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: AXIS_TEXT, fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />

                    <Tooltip
                      content={<ChartTooltip />}
                      cursor={{ fill: "#f1f5f9" }}
                    />

                    <Bar
                      dataKey="Tickets"
                      fill={SERIES_COLOR}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={56}
                      label={{
                        position: "top",
                        fill: "#334155",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* =========================
                ENGINEER WORKLOAD
            ========================= */}

            <ChartCard
              title="Engineer workload"
              subtitle="Active and closed tickets per engineer"
            >
              {report.workload.length === 0 ? (
                <p className="text-sm text-slate-500 py-10 text-center">
                  No tickets are assigned in this period.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="pb-2 font-semibold">Engineer</th>
                      <th className="pb-2 font-semibold text-right">Active</th>
                      <th className="pb-2 font-semibold text-right">Closed</th>
                      <th className="pb-2 font-semibold w-2/5 pl-4">Load</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {report.workload.map((row) => (
                      <tr key={row.name}>
                        <td className="py-2.5">
                          <span className="inline-flex items-center gap-2 text-slate-700">
                            <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                              {initials(row.name)}
                            </span>
                            <span className="truncate max-w-36">
                              {row.name}
                            </span>
                          </span>
                        </td>

                        <td className="py-2.5 text-right font-semibold text-slate-800">
                          {row.active}
                        </td>

                        <td className="py-2.5 text-right text-slate-600">
                          {row.closed}
                        </td>

                        <td className="py-2.5 pl-4">
                          <div
                            className="flex h-2 rounded-full bg-slate-100 overflow-hidden"
                            title={`${row.active} active, ${row.closed} closed`}
                          >
                            <div
                              className="h-full"
                              style={{
                                width: `${(row.active / maxWorkload) * 100}%`,
                                backgroundColor: STATUS_COLORS["In Progress"],
                              }}
                            />
                            <div
                              className="h-full border-l-2 border-white"
                              style={{
                                width: `${(row.closed / maxWorkload) * 100}%`,
                                backgroundColor: STATUS_COLORS.Closed,
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {report.unassigned > 0 && (
                <p className="mt-4 text-xs text-slate-500">
                  <span className="font-semibold text-red-600">
                    {report.unassigned}
                  </span>{" "}
                  active ticket{report.unassigned === 1 ? " is" : "s are"} not assigned to anyone.
                </p>
              )}
            </ChartCard>

          </div>
        </div>

      )}

    </Layout>
  );
}

export default Reports;
