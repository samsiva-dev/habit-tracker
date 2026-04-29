"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  addDays,
  format,
  parseISO,
  differenceInDays,
  isSameDay,
  startOfDay,
  startOfMonth,
  addMonths,
  getDaysInMonth,
  getDay,
} from "date-fns";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";

interface Props {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  startDate: string;
  duration: number;
  initialCompletedDays: number[];
}

// ─── 30-day numbered grid (original style) ────────────────────────────────────

function Grid30({
  start,
  completedDays,
  toggling,
  color,
  onToggle,
}: {
  start: Date;
  completedDays: Set<number>;
  toggling: number | null;
  color: string;
  onToggle: (n: number) => void;
}) {
  const today = new Date();

  return (
    <div className="grid grid-cols-6 gap-2">
      {Array.from({ length: 30 }, (_, i) => i + 1).map((dayNumber) => {
        const dayDate = addDays(start, dayNumber - 1);
        const isCompleted = completedDays.has(dayNumber);
        const isToday = isSameDay(dayDate, today);
        const isFuture = dayDate > today;
        const isLoading = toggling === dayNumber;

        return (
          <button
            key={dayNumber}
            onClick={() => onToggle(dayNumber)}
            disabled={isLoading}
            title={format(dayDate, "MMM d, yyyy")}
            className={`
              relative flex flex-col items-center justify-center aspect-square rounded-xl
              transition-all duration-200 select-none
              ${isFuture ? "opacity-40" : !isCompleted ? "opacity-70" : ""}
              ${isLoading ? "scale-95 opacity-50" : "active:scale-95"}
              cursor-pointer hover:brightness-110
            `}
            style={{
              backgroundColor: isCompleted ? color : isToday ? color + "22" : "#1f2937",
              outline: isCompleted
                ? `2px solid ${color}`
                : isToday
                ? "2px solid rgba(255,255,255,0.2)"
                : "none",
              outlineOffset: "1px",
            }}
          >
            <span
              className={`text-xs font-semibold leading-none ${
                isCompleted ? "text-white" : isToday ? "text-white" : "text-gray-400"
              }`}
              style={
                isCompleted
                  ? {
                      textDecoration: "line-through",
                      textDecorationColor: "rgba(255,255,255,0.6)",
                      textDecorationThickness: "2px",
                    }
                  : undefined
              }
            >
              {dayNumber}
            </span>

            {isCompleted && (
              <Check size={10} className="text-white/80 mt-0.5" strokeWidth={3} />
            )}
            {isToday && !isCompleted && (
              <div className="w-1 h-1 rounded-full mt-0.5" style={{ backgroundColor: color }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Month calendar grid (used for 90 / 180 / 365-day challenges) ─────────────

const DOW_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function MonthCalendar({
  year,
  month,
  challengeStart,
  challengeEnd,
  completedDays,
  toggling,
  color,
  onToggle,
}: {
  year: number;
  month: number;       // 0-indexed
  challengeStart: Date;
  challengeEnd: Date;
  completedDays: Set<number>;
  toggling: number | null;
  color: string;
  onToggle: (n: number) => void;
}) {
  const today = new Date();
  const monthStart = new Date(year, month, 1);
  const firstDOW = getDay(monthStart); // 0 = Sunday
  const daysInMonth = getDaysInMonth(monthStart);
  const challengeStartDay = startOfDay(challengeStart);

  // Build cell list: null = padding, -1 = out of challenge range, N = dayNumber
  const cells: (number | null)[] = Array(firstDOW).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    if (date < challengeStartDay || date > challengeEnd) {
      cells.push(-1);
    } else {
      cells.push(differenceInDays(date, challengeStart) + 1);
    }
  }

  return (
    <div className="bg-gray-800/40 rounded-xl p-3">
      <p className="text-xs font-semibold text-gray-400 mb-2">
        {format(monthStart, "MMMM yyyy")}
      </p>

      <div className="grid grid-cols-7 gap-0.5">
        {/* Day-of-week header */}
        {DOW_LABELS.map((lbl) => (
          <div key={lbl} className="text-center text-gray-600" style={{ fontSize: "0.55rem" }}>
            {lbl}
          </div>
        ))}

        {/* Day cells */}
        {cells.map((dayNumber, idx) => {
          // Padding cell
          if (dayNumber === null) return <div key={idx} />;

          // Out-of-range day (before start or after end)
          if (dayNumber === -1) {
            const d = idx - firstDOW + 1;
            return (
              <div
                key={idx}
                className="aspect-square flex items-center justify-center opacity-20"
                style={{ fontSize: "0.6rem", color: "#6b7280" }}
              >
                {d}
              </div>
            );
          }

          const date = addDays(challengeStart, dayNumber - 1);
          const isCompleted = completedDays.has(dayNumber);
          const isToday = isSameDay(date, today);
          const isFuture = date > today;
          const isLoading = toggling === dayNumber;

          return (
            <button
              key={idx}
              onClick={() => onToggle(dayNumber)}
              disabled={isLoading}
              title={format(date, "MMM d, yyyy")}
              className={`
                aspect-square flex items-center justify-center rounded-md
                transition-all duration-150 select-none
                ${isFuture ? "opacity-40" : !isCompleted ? "opacity-80" : ""}
                ${isLoading ? "scale-90 opacity-50" : "active:scale-90"}
                cursor-pointer hover:brightness-110
              `}
              style={{
                backgroundColor: isCompleted
                  ? color
                  : isToday
                  ? color + "22"
                  : "#1f2937",
                outline: isToday && !isCompleted ? `1px solid ${color}66` : "none",
                outlineOffset: "1px",
              }}
            >
              <span
                style={{
                  fontSize: "0.58rem",
                  lineHeight: 1,
                  color: isCompleted ? "white" : isToday ? "white" : "#6b7280",
                  textDecoration: isCompleted ? "line-through" : "none",
                  textDecorationColor: "rgba(255,255,255,0.55)",
                  textDecorationThickness: "1.5px",
                }}
              >
                {format(date, "d")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ChallengeDetailClient({
  id,
  name,
  description,
  color,
  icon,
  startDate,
  duration,
  initialCompletedDays,
}: Props) {
  const router = useRouter();
  const [completedDays, setCompletedDays] = useState<Set<number>>(
    new Set(initialCompletedDays)
  );
  const [toggling, setToggling] = useState<number | null>(null);

  const start = parseISO(startDate);
  const endDate = addDays(start, duration - 1);
  const today = new Date();
  const elapsed = differenceInDays(today, start) + 1;
  const currentDay = Math.min(Math.max(elapsed, 1), duration);
  const isOver = elapsed > duration;
  const notStarted = elapsed < 1;

  async function toggleDay(dayNumber: number) {
    if (toggling !== null) return;
    setToggling(dayNumber);

    setCompletedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayNumber)) next.delete(dayNumber);
      else next.add(dayNumber);
      return next;
    });

    try {
      const res = await fetch(`/api/challenges/${id}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayNumber }),
      });
      if (!res.ok) {
        setCompletedDays((prev) => {
          const next = new Set(prev);
          if (next.has(dayNumber)) next.delete(dayNumber);
          else next.add(dayNumber);
          return next;
        });
      } else {
        router.refresh();
      }
    } catch {
      setCompletedDays((prev) => {
        const next = new Set(prev);
        if (next.has(dayNumber)) next.delete(dayNumber);
        else next.add(dayNumber);
        return next;
      });
    } finally {
      setToggling(null);
    }
  }

  const totalCompleted = completedDays.size;
  const pct = Math.round((totalCompleted / duration) * 100);

  // Build list of months spanned by this challenge (for multi-month view)
  const months: { year: number; month: number }[] = [];
  let cur = startOfMonth(start);
  while (cur <= endDate) {
    months.push({ year: cur.getFullYear(), month: cur.getMonth() });
    cur = addMonths(cur, 1);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/challenges" className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: color + "33" }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-white text-lg leading-tight truncate">{name}</h1>
          {description && <p className="text-xs text-gray-500 truncate">{description}</p>}
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">
            {notStarted
              ? `Starts ${format(start, "MMM d, yyyy")}`
              : isOver
              ? "Challenge period over"
              : `Day ${currentDay} of ${duration}`}
          </span>
          <span className="font-bold" style={{ color }}>
            {totalCompleted}/{duration}
          </span>
        </div>

        <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{format(start, "MMM d, yyyy")}</span>
          <span className="font-medium" style={{ color: pct === 100 ? color : undefined }}>
            {pct}% complete
          </span>
          <span>{format(endDate, "MMM d, yyyy")}</span>
        </div>
      </div>

      {/* Grid */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <p className="text-xs text-gray-500 mb-3">
          Tap any day to strike it off — completed days stay visible
        </p>

        {duration === 30 ? (
          <Grid30
            start={start}
            completedDays={completedDays}
            toggling={toggling}
            color={color}
            onToggle={toggleDay}
          />
        ) : (
          <div className="space-y-4">
            {months.map(({ year, month }) => (
              <MonthCalendar
                key={`${year}-${month}`}
                year={year}
                month={month}
                challengeStart={start}
                challengeEnd={endDate}
                completedDays={completedDays}
                toggling={toggling}
                color={color}
                onToggle={toggleDay}
              />
            ))}
          </div>
        )}
      </div>

      {/* Completion banner */}
      {totalCompleted === duration && (
        <div
          className="rounded-2xl p-4 text-center space-y-1"
          style={{
            backgroundColor: color + "22",
            border: `1px solid ${color}44`,
          }}
        >
          <p className="text-2xl">🎉</p>
          <p className="font-bold text-white">Challenge Complete!</p>
          <p className="text-xs text-gray-400">
            You&apos;ve struck off all {duration} days
          </p>
        </div>
      )}
    </div>
  );
}
