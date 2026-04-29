"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, X, ChevronRight } from "lucide-react";
import { addDays, format, parseISO, differenceInDays } from "date-fns";

interface Challenge {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  startDate: string;
  duration: number;
  completedDays: number[];
}

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b",
  "#10b981", "#3b82f6", "#ef4444", "#14b8a6",
];

const ICONS = ["🎯", "💪", "📚", "🏃", "🧘", "✍️", "🎨", "🚀", "💧", "🌱"];

const DURATIONS: { value: number; label: string; sub: string }[] = [
  { value: 30,  label: "30 Days",   sub: "1 month"   },
  { value: 90,  label: "3 Months",  sub: "90 days"   },
  { value: 180, label: "6 Months",  sub: "180 days"  },
  { value: 365, label: "1 Year",    sub: "365 days"  },
];

interface FormState {
  name: string;
  description: string;
  color: string;
  icon: string;
  startDate: string;
  duration: number;
}

function durationLabel(duration: number): string {
  return DURATIONS.find((d) => d.value === duration)?.label ?? `${duration} days`;
}

function MiniGrid({
  completedDays,
  color,
  duration,
}: {
  completedDays: number[];
  color: string;
  duration: number;
}) {
  const done = new Set(completedDays);
  // Adapt columns so the grid stays compact regardless of duration
  const cols = duration <= 30 ? 10 : duration <= 90 ? 15 : duration <= 180 ? 20 : 26;
  return (
    <div
      className="mt-2 gap-0.5"
      style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: duration }, (_, i) => i + 1).map((d) => (
        <div
          key={d}
          className="w-full aspect-square rounded-sm"
          style={{ backgroundColor: done.has(d) ? color : "#1f2937" }}
        />
      ))}
    </div>
  );
}

function statusLabel(startDate: string, duration: number, completedDays: number[]): string {
  const start = parseISO(startDate);
  const today = new Date();
  const elapsed = differenceInDays(today, start) + 1;
  const currentDay = Math.min(Math.max(elapsed, 0), duration);
  const endDate = addDays(start, duration - 1);
  const done = completedDays.length;
  if (elapsed < 1) return `Starts ${format(start, "MMM d")}`;
  if (elapsed > duration) return `Ended ${format(endDate, "MMM d")} · ${done}/${duration} done`;
  return `Day ${currentDay} of ${duration} · ${done} checked off`;
}

export default function ChallengesClient({ challenges: initial }: { challenges: Challenge[] }) {
  const router = useRouter();
  const [challenges, setChallenges] = useState<Challenge[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: "",
    description: "",
    color: "#6366f1",
    icon: "🎯",
    startDate: format(new Date(), "yyyy-MM-dd"),
    duration: 30,
  });

  function resetForm() {
    setForm({
      name: "",
      description: "",
      color: "#6366f1",
      icon: "🎯",
      startDate: format(new Date(), "yyyy-MM-dd"),
      duration: 30,
    });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          startDate: new Date(form.startDate).toISOString(),
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setChallenges((prev) => [
          { ...created, completedDays: [] },
          ...prev,
        ]);
        setShowForm(false);
        resetForm();
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/challenges/${id}`, { method: "DELETE" });
    setChallenges((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Challenges</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-3 py-2 rounded-xl transition-colors"
        >
          <Plus size={16} />
          New
        </button>
      </div>

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">New Challenge</h2>
              <button
                onClick={() => { setShowForm(false); resetForm(); }}
                className="text-gray-500 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  What are you challenging yourself to do?
                </label>
                <input
                  type="text"
                  placeholder="e.g. Read every day, No sugar, Morning walks…"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Description (optional)</label>
                <input
                  type="text"
                  placeholder="Any notes or motivation…"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Duration picker */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Duration</label>
                <div className="grid grid-cols-2 gap-2">
                  {DURATIONS.map(({ value, label, sub }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, duration: value }))}
                      className={`flex flex-col items-center py-2.5 rounded-xl border text-sm transition-all ${
                        form.duration === value
                          ? "border-indigo-500 bg-indigo-500/10 text-white"
                          : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                      }`}
                    >
                      <span className="font-semibold">{label}</span>
                      <span className="text-xs opacity-60">{sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Start date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-2 block">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, icon: ic }))}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                        form.icon === ic
                          ? "ring-2 ring-indigo-500 bg-gray-700"
                          : "bg-gray-800 hover:bg-gray-700"
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-2 block">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, color: c }))}
                      className={`w-8 h-8 rounded-full transition-all ${
                        form.color === c
                          ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110"
                          : ""
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-2.5 rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
                >
                  {saving ? "Creating…" : "Start Challenge"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Challenge cards */}
      {challenges.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">🎯</p>
          <p className="font-medium text-gray-400">No challenges yet</p>
          <p className="text-sm mt-1">Pick a duration and start tracking your progress</p>
        </div>
      ) : (
        <div className="space-y-3">
          {challenges.map((c) => (
            <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: c.color + "33" }}
                >
                  {c.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white truncate">{c.name}</h3>
                      <span
                        className="text-xs font-medium px-1.5 py-0.5 rounded-md"
                        style={{ backgroundColor: c.color + "22", color: c.color }}
                      >
                        {durationLabel(c.duration)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Link
                        href={`/challenges/${c.id}`}
                        className="text-gray-500 hover:text-indigo-400 transition-colors"
                      >
                        <ChevronRight size={18} />
                      </Link>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-gray-600 hover:text-red-400 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  {c.description && (
                    <p className="text-xs text-gray-500 mt-1 truncate">{c.description}</p>
                  )}
                  <p className="text-xs mt-1" style={{ color: c.color }}>
                    {statusLabel(c.startDate, c.duration, c.completedDays)}
                  </p>
                  <MiniGrid
                    completedDays={c.completedDays}
                    color={c.color}
                    duration={c.duration}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
