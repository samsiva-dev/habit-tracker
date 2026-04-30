"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { Flame, Award, TrendingUp, Calendar } from "lucide-react";
import { format, parseISO, subDays, startOfDay } from "date-fns";

interface TrendPoint {
  date: string;
  completed: number;
  total: number;
}

interface HabitStats {
  id: string;
  name: string;
  color: string;
  icon: string;
  streak: number;
  allTimeStreak: number;
  totalLogs: number;
  scheduledDays: number;
  logs: string[];
}

interface Stats {
  totalHabits: number;
  completedToday: number;
  longestStreak: number;
  bestHabit: string | null;
  avgCompletionRate: number;
}

interface Props {
  trends: TrendPoint[];
  stats: Stats;
  habits: HabitStats[];
}

function pct(completed: number, total: number) {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

// Build 12-week grid (84 days ending today, columns = weeks, rows = Sun–Sat)
function buildHeatmapWeeks(logDates: string[]): { date: string; filled: boolean }[][] {
  const logSet = new Set(logDates.map((d) => format(parseISO(d), "yyyy-MM-dd")));
  const today = startOfDay(new Date());
  // Start from Sunday of the week 11 full weeks ago
  const endDay = today;
  const startDay = subDays(today, 83);

  const weeks: { date: string; filled: boolean }[][] = [];
  let week: { date: string; filled: boolean }[] = [];

  // Pad to Sunday
  const startDow = startDay.getDay(); // 0=Sun
  for (let p = 0; p < startDow; p++) {
    week.push({ date: "", filled: false });
  }

  let cursor = new Date(startDay);
  while (cursor <= endDay) {
    const dateStr = format(cursor, "yyyy-MM-dd");
    week.push({ date: dateStr, filled: logSet.has(dateStr) });
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }
  if (week.length > 0) {
    while (week.length < 7) week.push({ date: "", filled: false });
    weeks.push(week);
  }
  return weeks;
}

function HeatmapGrid({ logs, color }: { logs: string[]; color: string }) {
  const weeks = buildHeatmapWeeks(logs);
  const todayStr = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="flex gap-0.5 overflow-x-auto pb-1">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-0.5">
          {week.map((cell, di) => (
            <div
              key={di}
              title={cell.date || undefined}
              className={`w-3 h-3 rounded-sm transition-colors ${
                !cell.date
                  ? "bg-transparent"
                  : cell.date === todayStr
                  ? "ring-1 ring-white/30"
                  : ""
              }`}
              style={{
                backgroundColor: cell.date
                  ? cell.filled
                    ? color
                    : "#1f2937"
                  : "transparent",
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Custom tooltip for area chart
function AreaTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number; payload: TrendPoint }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const rate = pct(p.completed, p.total);
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs">
      <p className="text-gray-400">{label}</p>
      <p className="text-white font-semibold">{p.completed}/{p.total} habits</p>
      <p className="text-indigo-400">{rate}%</p>
    </div>
  );
}

export default function TrendsClient({ trends, stats, habits }: Props) {
  const chartData = trends.map((t) => ({
    ...t,
    label: format(parseISO(t.date), "MMM d"),
    rate: pct(t.completed, t.total),
  }));

  // Last 7 days for bar chart
  const last7 = chartData.slice(-7);

  // Compute habit-level completion rate: logs completed / days the habit was scheduled
  const habitBarData = habits.map((h) => {
    const rate = h.scheduledDays > 0
      ? Math.round((h.totalLogs / h.scheduledDays) * 100)
      : 0;
    return { name: h.name, rate: Math.min(rate, 100), color: h.color };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Trends</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <TrendingUp size={14} className="text-indigo-400" />
            30-day avg
          </div>
          <p className="text-3xl font-bold text-white">
            {stats.avgCompletionRate}%
          </p>
          <p className="text-xs text-gray-500">completion rate</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <Flame size={14} className="text-orange-400" />
            Best streak
          </div>
          <p className="text-3xl font-bold text-white">
            {stats.longestStreak}
          </p>
          <p className="text-xs text-gray-500">
            {stats.bestHabit ?? "days in a row"}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <Award size={14} className="text-green-400" />
            Done today
          </div>
          <p className="text-3xl font-bold text-white">
            {stats.completedToday}
          </p>
          <p className="text-xs text-gray-500">
            of {stats.totalHabits} habits
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <Calendar size={14} className="text-blue-400" />
            Total habits
          </div>
          <p className="text-3xl font-bold text-white">
            {stats.totalHabits}
          </p>
          <p className="text-xs text-gray-500">being tracked</p>
        </div>
      </div>

      {/* 30-day completion area chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="font-semibold text-white mb-4">30-Day Completion Rate</h2>
        {habits.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">
            Add habits to see trends
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#6b7280", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval={6}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "#6b7280", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
                width={35}
              />
              <Tooltip content={<AreaTooltip />} />
              <Area
                type="monotone"
                dataKey="rate"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#grad)"
                dot={false}
                activeDot={{ r: 4, fill: "#6366f1" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Last 7 days bar chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="font-semibold text-white mb-4">Last 7 Days</h2>
        {habits.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">
            Add habits to see data
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={last7} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#6b7280", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "#6b7280", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
                width={35}
              />
              <Tooltip
                cursor={{ fill: "#1f2937" }}
                content={<AreaTooltip />}
              />
              <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                {last7.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.rate >= 80 ? "#6366f1" : entry.rate >= 50 ? "#8b5cf6" : "#374151"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Per-habit streaks */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="font-semibold text-white mb-4">Habit Streaks</h2>
        {habits.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">
            No habits to show
          </p>
        ) : (
          <div className="space-y-3">
            {[...habits]
              .sort((a, b) => b.streak - a.streak)
              .map((h) => (
                <div key={h.id} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                    style={{ backgroundColor: h.color }}
                  >
                    {h.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-white truncate">{h.name}</span>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {h.allTimeStreak > h.streak && (
                          <span className="text-gray-500 text-xs">
                            best&nbsp;{h.allTimeStreak}
                          </span>
                        )}
                        <div className="flex items-center gap-1">
                          <Flame size={12} className="text-orange-400" />
                          <span className="text-orange-400 text-xs font-bold">
                            {h.streak}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Streak bar — fills against all-time best for context */}
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min((h.streak / Math.max(h.allTimeStreak, 30)) * 100, 100)}%`,
                          backgroundColor: h.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Per-habit heatmap */}
      {habits.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-4">12-Week Heatmap</h2>
          <div className="space-y-5">
            {habits.map((h) => (
              <div key={h.id}>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0"
                    style={{ backgroundColor: h.color }}
                  >
                    {h.icon}
                  </div>
                  <span className="text-sm text-gray-300 truncate">{h.name}</span>
                </div>
                <HeatmapGrid logs={h.logs} color={h.color} />
              </div>
            ))}
          </div>
          <p className="text-gray-600 text-xs mt-3">Each cell = one day · filled = completed</p>
        </div>
      )}

      {/* Per-habit completion rate */}
      {habitBarData.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-4">
            30-Day Completion by Habit
          </h2>
          <div className="space-y-3">
            {habitBarData.map((h) => (
              <div key={h.name} className="flex items-center gap-3">
                <span className="text-gray-300 text-sm truncate w-28 shrink-0">
                  {h.name}
                </span>
                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${h.rate}%`, backgroundColor: h.color }}
                  />
                </div>
                <span className="text-gray-400 text-xs w-9 text-right shrink-0">
                  {h.rate}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
