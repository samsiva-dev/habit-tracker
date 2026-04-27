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
  completedDays: number[];
}

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b",
  "#10b981", "#3b82f6", "#ef4444", "#14b8a6",
];

const ICONS = ["🎯", "💪", "📚", "🏃", "🧘", "✍️", "🎨", "🚀", "💧", "🌱"];

interface FormState {
  name: string;
  description: string;
  color: string;
  icon: string;
  startDate: string;
}

function MiniGrid({ completedDays, color }: { completedDays: number[]; color: string }) {
  const done = new Set(completedDays);
  return (
    <div className="grid grid-cols-10 gap-0.5 mt-2">
      {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
        <div
          key={d}
          className="w-full aspect-square rounded-sm"
          style={{ backgroundColor: done.has(d) ? color : "#1f2937" }}
        />
      ))}
    </div>
  );
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
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, startDate: new Date(form.startDate).toISOString() }),
      });
      if (res.ok) {
        const created = await res.json();
        setChallenges((prev) => [
          { ...created, completedDays: [], startDate: created.startDate },
          ...prev,
        ]);
        setShowForm(false);
        setForm({ name: "", description: "", color: "#6366f1", icon: "🎯", startDate: format(new Date(), "yyyy-MM-dd") });
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

  function dayLabel(startDate: string, completedDays: number[]) {
    const start = parseISO(startDate);
    const today = new Date();
    const daysSinceStart = differenceInDays(today, start) + 1;
    const currentDay = Math.min(Math.max(daysSinceStart, 0), 30);
    const endDate = addDays(start, 29);
    const done = completedDays.length;
    if (daysSinceStart < 1) return `Starts ${format(start, "MMM d")}`;
    if (daysSinceStart > 30) return `Ended ${format(endDate, "MMM d")} · ${done}/30 done`;
    return `Day ${currentDay} of 30 · ${done} checked off`;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">30-Day Challenges</h1>
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
          <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">New 30-Day Challenge</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">What are you challenging yourself to do?</label>
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
                        form.color === c ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110" : ""
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
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
          <p className="text-sm mt-1">Start a 30-day challenge to track your progress</p>
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
                    <h3 className="font-semibold text-white truncate">{c.name}</h3>
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
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{c.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-0.5" style={{ color: c.color }}>
                    {dayLabel(c.startDate, c.completedDays)}
                  </p>
                  <MiniGrid completedDays={c.completedDays} color={c.color} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
