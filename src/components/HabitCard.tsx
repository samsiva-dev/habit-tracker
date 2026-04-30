"use client";

import { useState, useRef } from "react";
import { Flame, StickyNote } from "lucide-react";

interface NewBadge {
  type: string;
  label: string;
  emoji: string;
}

interface HabitCardProps {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  icon: string;
  streak: number;
  completedToday: boolean;
  todayNote?: string | null;
  onToggle: (id: string) => void;
  onBadgeEarned?: (id: string, badges: NewBadge[]) => void;
}

export default function HabitCard({
  id,
  name,
  description,
  color,
  icon,
  streak,
  completedToday,
  todayNote,
  onToggle,
  onBadgeEarned,
}: HabitCardProps) {
  const [loading, setLoading] = useState(false);
  const [localCompleted, setLocalCompleted] = useState(completedToday);
  const [badgeFlash, setBadgeFlash] = useState<NewBadge | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState(todayNote ?? "");
  const [savingNote, setSavingNote] = useState(false);

  async function handleToggle() {
    if (loading) return;
    setLoading(true);
    const prev = localCompleted;
    setLocalCompleted(!prev);
    try {
      const res = await fetch(`/api/habits/${id}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: note || null }),
      });
      const data = await res.json();
      setLocalCompleted(data.completed);
      if (!data.completed) {
        setNote("");
        setShowNote(false);
      }
      onToggle(id);

      if (data.completed && data.newBadges?.length) {
        const highest: NewBadge = data.newBadges[data.newBadges.length - 1];
        if (flashTimer.current) clearTimeout(flashTimer.current);
        setBadgeFlash(highest);
        onBadgeEarned?.(id, data.newBadges);
        flashTimer.current = setTimeout(() => setBadgeFlash(null), 3500);
      }
    } catch {
      setLocalCompleted(prev);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveNote() {
    if (savingNote) return;
    setSavingNote(true);
    try {
      await fetch(`/api/habits/${id}/logs/note`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: note || null }),
      });
      setShowNote(false);
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <div
      className={`relative rounded-2xl border transition-all duration-200 ${
        localCompleted
          ? "bg-gray-800/60 border-gray-700"
          : "bg-gray-900 border-gray-800 hover:border-gray-700"
      }`}
    >
      <div className="flex items-center gap-4 p-4">
        {/* Color accent */}
        <div
          className="absolute left-0 top-3 bottom-3 w-1 rounded-full"
          style={{ backgroundColor: color }}
        />

        {/* Checkbox */}
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`relative ml-2 w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-200 shrink-0 ${
            localCompleted
              ? "scale-95"
              : "border-2 border-gray-600 hover:border-gray-400"
          }`}
          style={localCompleted ? { backgroundColor: color } : {}}
          aria-label={localCompleted ? "Mark incomplete" : "Mark complete"}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : localCompleted ? (
            <span className="text-white text-sm">✓</span>
          ) : (
            <span style={{ color }}>{icon}</span>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className={`font-semibold truncate ${
              localCompleted ? "text-gray-400 line-through" : "text-white"
            }`}
          >
            {name}
          </p>
          {description && (
            <p className="text-xs text-gray-500 truncate mt-0.5">{description}</p>
          )}
        </div>

        {/* Streak */}
        {streak > 0 && (
          <div className="flex items-center gap-1 shrink-0">
            <Flame size={14} className="text-orange-400" />
            <span className="text-orange-400 text-sm font-bold">{streak}</span>
          </div>
        )}

        {/* Note toggle (only when completed) */}
        {localCompleted && (
          <button
            onClick={() => setShowNote((v) => !v)}
            className={`p-1.5 rounded-lg transition-colors shrink-0 ${
              note ? "text-indigo-400" : "text-gray-600 hover:text-gray-400"
            }`}
            aria-label="Add note"
          >
            <StickyNote size={14} />
          </button>
        )}
      </div>

      {/* Note input */}
      {localCompleted && showNote && (
        <div className="px-4 pb-3 flex gap-2">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note..."
            maxLength={200}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            onKeyDown={(e) => e.key === "Enter" && handleSaveNote()}
          />
          <button
            onClick={handleSaveNote}
            disabled={savingNote}
            className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-60"
          >
            {savingNote ? "..." : "Save"}
          </button>
        </div>
      )}

      {/* Saved note preview */}
      {localCompleted && !showNote && note && (
        <button onClick={() => setShowNote(true)} className="w-full text-left px-4 pb-3">
          <p className="text-xs text-indigo-300/70 italic truncate">&ldquo;{note}&rdquo;</p>
        </button>
      )}

      {/* New badge flash */}
      {badgeFlash && (
        <div className="absolute inset-x-0 bottom-0 rounded-b-2xl bg-indigo-950 border-t border-indigo-800 px-4 py-2 flex items-center gap-2">
          <span className="text-base">{badgeFlash.emoji}</span>
          <span className="text-indigo-300 text-xs font-semibold">
            New badge: {badgeFlash.label}!
          </span>
        </div>
      )}
    </div>
  );
}
