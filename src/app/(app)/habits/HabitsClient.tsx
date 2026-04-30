"use client";

import { useState } from "react";
import { Plus, Flame, Pencil, Trash2, Target, CalendarDays } from "lucide-react";
import HabitForm from "@/components/HabitForm";
import { BADGE_DEFINITIONS } from "@/lib/badges";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Achievement {
  type: string;
  earnedAt: string;
}

interface Habit {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  icon: string;
  frequency: string;
  startDate?: string | null;
  endDate?: string | null;
  targetDays: number[];
  streak: number;
  totalLogs: number;
  createdAt: string;
  achievements: Achievement[];
}

export default function HabitsClient({ habits: initial }: { habits: Habit[] }) {
  const [habits, setHabits] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function handleCreate(data: {
    name: string;
    description: string;
    color: string;
    icon: string;
    frequency: string;
    startDate: string | null;
    endDate: string | null;
    targetDays: number[];
  }) {
    const res = await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create habit");
    const habit = await res.json();
    setHabits((prev) => [...prev, { ...habit, streak: 0, totalLogs: 0, achievements: [] }]);
    setShowForm(false);
  }

  async function handleEdit(data: {
    name: string;
    description: string;
    color: string;
    icon: string;
    frequency: string;
    startDate: string | null;
    endDate: string | null;
    targetDays: number[];
  }) {
    if (!editing) return;
    const res = await fetch(`/api/habits/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update habit");
    const updated = await res.json();
    setHabits((prev) =>
      prev.map((h) =>
        h.id === editing.id ? { ...h, ...updated } : h
      )
    );
    setEditing(null);
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/habits/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setHabits((prev) => prev.filter((h) => h.id !== id));
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  }

  function formatDateRange(startDate?: string | null, endDate?: string | null) {
    if (!startDate && !endDate) return null;
    if (startDate && endDate) return `${startDate} → ${endDate}`;
    if (startDate) return `From ${startDate}`;
    return `Until ${endDate}`;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">My Habits</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
        >
          <Plus size={16} />
          Add Habit
        </button>
      </div>

      {/* Stats bar */}
      {habits.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center gap-4 text-sm">
          <span className="text-gray-400">
            <span className="text-white font-semibold">{habits.length}</span> habits
          </span>
          <span className="text-gray-700">•</span>
          <span className="text-gray-400">
            Best streak:{" "}
            <span className="text-orange-400 font-semibold">
              {Math.max(...habits.map((h) => h.streak), 0)} days
            </span>
          </span>
        </div>
      )}

      {/* List */}
      {habits.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center space-y-4">
          <Target size={40} className="text-gray-700 mx-auto" />
          <div>
            <p className="text-white font-semibold">No habits yet</p>
            <p className="text-gray-500 text-sm mt-1">
              Add your first habit to start tracking
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
          >
            Add Habit
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {habits.map((h) => {
            const dateRange = formatDateRange(h.startDate, h.endDate);
            const activeDays =
              h.frequency === "weekly" && h.targetDays.length > 0
                ? h.targetDays.sort((a, b) => a - b).map((d) => DAYS[d]).join(", ")
                : null;

            return (
              <div
                key={h.id}
                className="relative bg-gray-900 border border-gray-800 rounded-2xl p-4"
              >
                <div
                  className="absolute left-0 top-3 bottom-3 w-1 rounded-full"
                  style={{ backgroundColor: h.color }}
                />

                <div className="flex items-center gap-3 ml-2">
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-base shrink-0"
                    style={{ backgroundColor: h.color }}
                  >
                    <span className="text-white">{h.icon}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{h.name}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {h.description && (
                        <p className="text-gray-500 text-xs truncate max-w-[160px]">
                          {h.description}
                        </p>
                      )}
                      <span className="text-gray-600 text-xs capitalize shrink-0">
                        {h.frequency}
                      </span>
                      {activeDays && (
                        <span className="text-indigo-400 text-xs shrink-0">
                          {activeDays}
                        </span>
                      )}
                      {dateRange && (
                        <span className="flex items-center gap-0.5 text-gray-500 text-xs shrink-0">
                          <CalendarDays size={10} />
                          {dateRange}
                        </span>
                      )}
                      {h.streak > 0 && (
                        <span className="flex items-center gap-0.5 shrink-0">
                          <Flame size={11} className="text-orange-400" />
                          <span className="text-orange-400 text-xs font-bold">
                            {h.streak}
                          </span>
                        </span>
                      )}
                      <span className="text-gray-600 text-xs shrink-0">
                        {h.totalLogs} logs
                      </span>
                      {h.achievements.length > 0 && (
                        <span
                          className="flex items-center gap-0.5 shrink-0"
                          title={h.achievements
                            .map((a) => BADGE_DEFINITIONS.find((d) => d.type === a.type)?.label ?? a.type)
                            .join(", ")}
                        >
                          {h.achievements.map((a) => {
                            const def = BADGE_DEFINITIONS.find((d) => d.type === a.type);
                            return (
                              <span key={a.type} className="text-sm leading-none">
                                {def?.emoji ?? "🏅"}
                              </span>
                            );
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setEditing(h)}
                      className="p-2 text-gray-500 hover:text-indigo-400 transition-colors rounded-lg hover:bg-gray-800"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(h.id)}
                      className="p-2 text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-gray-800"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Inline delete confirm */}
                {confirmDelete === h.id && (
                  <div className="mt-3 ml-2 p-3 bg-gray-800 rounded-xl flex items-center justify-between gap-3">
                    <p className="text-sm text-gray-300">Delete this habit?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-3 py-1.5 text-xs text-gray-400 hover:text-white border border-gray-600 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(h.id)}
                        disabled={deleting === h.id}
                        className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors disabled:opacity-60"
                      >
                        {deleting === h.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <HabitForm
          onSave={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Edit form */}
      {editing && (
        <HabitForm
          initial={editing}
          onSave={handleEdit}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}
