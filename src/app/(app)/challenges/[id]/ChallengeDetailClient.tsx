"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, format, parseISO, differenceInDays, isSameDay } from "date-fns";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";

interface Props {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  startDate: string;
  initialCompletedDays: number[];
}

export default function ChallengeDetailClient({
  id,
  name,
  description,
  color,
  icon,
  startDate,
  initialCompletedDays,
}: Props) {
  const router = useRouter();
  const [completedDays, setCompletedDays] = useState<Set<number>>(
    new Set(initialCompletedDays)
  );
  const [toggling, setToggling] = useState<number | null>(null);

  const start = parseISO(startDate);
  const today = new Date();
  const daysSinceStart = differenceInDays(today, start) + 1;
  const currentDay = Math.min(Math.max(daysSinceStart, 1), 30);
  const isOver = daysSinceStart > 30;
  const notStarted = daysSinceStart < 1;

  async function toggleDay(dayNumber: number) {
    if (toggling !== null) return;
    setToggling(dayNumber);

    // Optimistic update
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
        // Revert on failure
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

  function getDayDate(dayNumber: number) {
    return addDays(start, dayNumber - 1);
  }

  function getDayState(dayNumber: number): "completed" | "today" | "past" | "future" {
    if (completedDays.has(dayNumber)) return "completed";
    const dayDate = getDayDate(dayNumber);
    if (isSameDay(dayDate, today)) return "today";
    if (dayDate < today) return "past";
    return "future";
  }

  const totalCompleted = completedDays.size;
  const pct = Math.round((totalCompleted / 30) * 100);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/challenges"
          className="text-gray-400 hover:text-white transition-colors"
        >
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
          {description && (
            <p className="text-xs text-gray-500 truncate">{description}</p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">
            {notStarted
              ? `Starts ${format(start, "MMM d, yyyy")}`
              : isOver
              ? "Challenge complete!"
              : `Day ${currentDay} of 30`}
          </span>
          <span className="font-bold" style={{ color }}>
            {totalCompleted}/30
          </span>
        </div>

        <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{format(start, "MMM d")}</span>
          <span className="font-medium" style={{ color: pct === 100 ? color : undefined }}>
            {pct}% complete
          </span>
          <span>{format(addDays(start, 29), "MMM d")}</span>
        </div>
      </div>

      {/* 30-day grid */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <p className="text-xs text-gray-500 mb-3">
          Tap any day to strike it off — completed days stay visible
        </p>

        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 30 }, (_, i) => i + 1).map((dayNumber) => {
            const state = getDayState(dayNumber);
            const dayDate = getDayDate(dayNumber);
            const isCompleted = state === "completed";
            const isToday = state === "today";
            const isFuture = state === "future";
            const isLoading = toggling === dayNumber;

            return (
              <button
                key={dayNumber}
                onClick={() => toggleDay(dayNumber)}
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
                  backgroundColor: isCompleted
                    ? color
                    : isToday
                    ? color + "22"
                    : "#1f2937",
                  outline: isCompleted
                    ? `2px solid ${color}`
                    : isToday
                    ? "2px solid rgba(255,255,255,0.2)"
                    : "none",
                  outlineOffset: "1px",
                }}
              >
                {/* Day number — struck through when completed */}
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

                {/* Checkmark overlay on completed */}
                {isCompleted && (
                  <Check
                    size={10}
                    className="text-white/80 mt-0.5"
                    strokeWidth={3}
                  />
                )}

                {/* Today dot */}
                {isToday && !isCompleted && (
                  <div
                    className="w-1 h-1 rounded-full mt-0.5"
                    style={{ backgroundColor: color }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Month labels */}
      <div className="text-xs text-gray-600 text-center">
        {format(start, "MMMM d")} – {format(addDays(start, 29), "MMMM d, yyyy")}
      </div>

      {/* Completion message */}
      {totalCompleted === 30 && (
        <div
          className="rounded-2xl p-4 text-center space-y-1"
          style={{ backgroundColor: color + "22", borderColor: color + "44", borderWidth: 1 }}
        >
          <p className="text-2xl">🎉</p>
          <p className="font-bold text-white">Challenge Complete!</p>
          <p className="text-xs text-gray-400">You&apos;ve struck off all 30 days</p>
        </div>
      )}
    </div>
  );
}
