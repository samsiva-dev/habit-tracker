"use client";

import { useState } from "react";
import { Flame, CheckCircle, Target, TrendingUp } from "lucide-react";
import HabitCard from "@/components/HabitCard";
import Link from "next/link";

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

export default function DashboardClient({
  habits: initialHabits,
  stats,
  today,
  userName,
}: {
  habits: Habit[];
  stats: Stats;
  today: string;
  userName: string;
}) {
  const [habits, setHabits] = useState(initialHabits);

  function handleToggle(id: string) {
    setHabits((prev) =>
      prev.map((h) =>
        h.id === id ? { ...h, completedToday: !h.completedToday } : h
      )
    );
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
              <circle
                cx="44"
                cy="44"
                r="36"
                fill="none"
                stroke="#1f2937"
                strokeWidth="8"
              />
              <circle
                cx="44"
                cy="44"
                r="36"
                fill="none"
                stroke="#6366f1"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
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
              <span className="text-white font-semibold">
                {completed}/{total}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm flex items-center gap-1">
                <Flame size={13} className="text-orange-400" /> Best streak
              </span>
              <span className="text-white font-semibold">
                {stats.longestStreak} days
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">7-day avg</span>
              <span className="text-white font-semibold">
                {stats.avgCompletionRate}%
              </span>
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
          <p className="text-lg font-bold text-white">
            {stats.avgCompletionRate}%
          </p>
          <p className="text-xs text-gray-500">7-day avg</p>
        </div>
      </div>

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
              <HabitCard key={h.id} {...h} onToggle={handleToggle} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
