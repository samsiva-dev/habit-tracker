"use client";

import { useState } from "react";
import { X } from "lucide-react";

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#10b981",
  "#06b6d4", "#3b82f6",
];

const ICONS = ["✓", "💪", "🏃", "📚", "💧", "🧘", "🍎", "😴", "✍️", "🎯"];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface HabitFormProps {
  initial?: {
    id?: string;
    name: string;
    description?: string | null;
    color: string;
    icon: string;
    frequency: string;
    startDate?: string | null;
    endDate?: string | null;
    targetDays?: number[];
  };
  onSave: (data: {
    name: string;
    description: string;
    color: string;
    icon: string;
    frequency: string;
    startDate: string | null;
    endDate: string | null;
    targetDays: number[];
  }) => Promise<void>;
  onCancel: () => void;
}

export default function HabitForm({ initial, onSave, onCancel }: HabitFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [color, setColor] = useState(initial?.color ?? "#6366f1");
  const [icon, setIcon] = useState(initial?.icon ?? "✓");
  const [frequency, setFrequency] = useState(initial?.frequency ?? "daily");
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [targetDays, setTargetDays] = useState<number[]>(initial?.targetDays ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleDay(day: number) {
    setTargetDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function handleFrequencyChange(f: string) {
    setFrequency(f);
    if (f === "daily") {
      setTargetDays([]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Habit name is required");
      return;
    }
    if (frequency === "weekly" && targetDays.length === 0) {
      setError("Select at least one day for a weekly habit");
      return;
    }
    if (startDate && endDate && endDate < startDate) {
      setError("End date must be on or after start date");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({
        name,
        description,
        color,
        icon,
        frequency,
        startDate: startDate || null,
        endDate: endDate || null,
        targetDays,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="font-bold text-lg text-white">
            {initial?.id ? "Edit Habit" : "New Habit"}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {error && (
            <p className="text-red-400 text-sm bg-red-950/50 border border-red-800 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Morning run"
              maxLength={80}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 placeholder:text-gray-600"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              maxLength={120}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 placeholder:text-gray-600"
            />
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={`w-10 h-10 rounded-xl text-lg transition-all ${
                    icon === i
                      ? "ring-2 ring-indigo-400 bg-indigo-950"
                      : "bg-gray-800 hover:bg-gray-700"
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === c ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Frequency
            </label>
            <div className="flex gap-2">
              {["daily", "weekly"].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => handleFrequencyChange(f)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium capitalize transition-all ${
                    frequency === f
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Day selector — shown only for weekly habits */}
          {frequency === "weekly" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Active days *
              </label>
              <div className="flex gap-1.5">
                {DAYS.map((day, index) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(index)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                      targetDays.includes(index)
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-800 text-gray-400 hover:text-white"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Start date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                End date
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-800 rounded-xl p-3 flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-base"
              style={{ backgroundColor: color }}
            >
              <span className="text-white">{icon}</span>
            </div>
            <div>
              <p className="text-white text-sm font-medium">
                {name || "Habit name"}
              </p>
              <p className="text-gray-500 text-xs capitalize">
                {frequency}
                {frequency === "weekly" && targetDays.length > 0 && (
                  <span className="ml-1">
                    · {targetDays.sort((a, b) => a - b).map((d) => DAYS[d]).join(", ")}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-300 font-medium text-sm hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors disabled:opacity-60"
            >
              {saving ? "Saving..." : initial?.id ? "Save Changes" : "Create Habit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
