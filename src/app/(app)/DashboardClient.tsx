"use client";

import { useState } from "react";
import { Flame, CheckCircle, Target, TrendingUp, Trophy } from "lucide-react";
import HabitCard from "@/components/HabitCard";
import Link from "next/link";
import { BADGE_DEFINITIONS } from "@/lib/badges";
import { format, parseISO } from "date-fns";

interface Habit {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  icon: string;
  streak: number;
  completedToday: boolean;
  todayNote?: string | null;
}

interface Stats {
  totalHabits: number;
  completedToday: number;
  longestStreak: number;
  bestHabit: string | null;
  avgCompletionRate: number;
}

interface Milestone {
  habitId: string;
  habitName: string;
  habitColor: string;
  type: string;
  earnedAt: string;
}

interface NewBadge {
  type: string;
  label: string;
  emoji: string;
}

export default function DashboardClient({
  habits: initialHabits,
  stats,
  today,
  userName,
  milestones: initialMilestones,
}: {
  habits: Habit[];
  stats: Stats;
  today: string;
  userName: string;
  milestones: Milestone[];
}) {
  const [habits, setHabits] = useState(initialHabits);
  const [milestones, setMilestones] = useState(initialMilestones);

  function handleToggle(id: string) {
    setHabits((prev) =>
      prev.map((h) =>
        h.id === id ? { ...h, completedToday: !h.completedToday } : h
      )
    );
  }

  function handleBadgeEarned(habitId: string, badges: NewBadge[]) {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    setMilestones((prev) => {
      const next = [...prev];
      for (const b of badges) {
        if (!next.find((m) => m.habitId === habitId && m.type === b.type)) {
          next.unshift({
            habitId,
            habitName: habit.name,
            habitColor: habit.color,
            type: b.type,
            earnedAt: new Date().toISOString(),
          });
        }
      }
      return next;
    });
  }

  const completed = habits.filter((h) => h.completedToday).length;
  const total = habits.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-gray-400 text-sm">{today}</p>
        <h1 className="text-2xl font-bold text-white mt-1">
          {userName ? `Hey, ${userName.split(" ")[0]}!` : "Today's Habits"}
        </h1>
      </div>

      {/* Progress ring + stats */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center gap-6">
          {/* Ring */}
          <div className="relative shrink-0">
            <svg width="88" height="88" viewBox="0 0 88 88">
              <circle cx="44" cy="44" r="36" fill="none" stroke="#1f2937" strokeWidth="8" />
              <circle
                cx="44" cy="44" r="36" fill="none"
                stroke="#6366f1" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={offset}
                transform="rotate(-90 44 44)"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-white">{pct}%</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Done today</span>
              <span className="text-white font-semibold">{completed}/{total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm flex items-center gap-1">
                <Flame size={13} className="text-orange-400" /> Best streak
              </span>
              <span className="text-white font-semibold">{stats.longestStreak} days</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">7-day avg</span>
              <span className="text-white font-semibold">{stats.avgCompletionRate}%</span>
            </div>
          </div>
        </div>

        {completed === total && total > 0 && (
          <div className="mt-4 bg-indigo-950 border border-indigo-800 rounded-xl px-4 py-2.5 text-center">
            <p className="text-indigo-300 text-sm font-medium">
              🎉 All habits done! Amazing work!
            </p>
          </div>
        )}
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
          <CheckCircle size={18} className="text-green-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{completed}</p>
          <p className="text-xs text-gray-500">Done</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
          <Flame size={18} className="text-orange-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{stats.longestStreak}</p>
          <p className="text-xs text-gray-500">Streak</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
          <TrendingUp size={18} className="text-indigo-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{stats.avgCompletionRate}%</p>
          <p className="text-xs text-gray-500">7-day avg</p>
        </div>
      </div>

      {/* Milestones */}
      {milestones.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={16} className="text-yellow-400" />
            <h2 className="font-semibold text-white">Milestones</h2>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl divide-y divide-gray-800">
            {milestones.map((m) => {
              const def = BADGE_DEFINITIONS.find((d) => d.type === m.type);
              return (
                <div key={`${m.habitId}-${m.type}`} className="flex items-center gap-3 px-4 py-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0"
                    style={{ backgroundColor: m.habitColor + "33" }}
                  >
                    {def?.emoji ?? "🏅"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {def?.label ?? m.type}
                    </p>
                    <p className="text-gray-500 text-xs truncate">{m.habitName}</p>
                  </div>
                  <span className="text-gray-600 text-xs shrink-0">
                    {format(parseISO(m.earnedAt), "MMM d")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Habits list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-white">Today&apos;s Habits</h2>
          <Link
            href="/habits"
            className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors"
          >
            Manage
          </Link>
        </div>

        {habits.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center space-y-3">
            <Target size={32} className="text-gray-600 mx-auto" />
            <p className="text-gray-400">No habits yet.</p>
            <Link
              href="/habits"
              className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors"
            >
              Add your first habit
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {habits.map((h) => (
              <HabitCard
                key={h.id}
                {...h}
                onToggle={handleToggle}
                onBadgeEarned={handleBadgeEarned}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
