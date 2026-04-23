import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, subDays, format } from "date-fns";

export async function getUserHabits(userId: string) {
  const today = startOfDay(new Date());
  const todayDayIndex = new Date().getDay(); // 0=Sun, 6=Sat

  const habits = await prisma.habit.findMany({
    where: {
      userId,
      archivedAt: null,
      AND: [
        { OR: [{ startDate: null }, { startDate: { lte: endOfDay(today) } }] },
        { OR: [{ endDate: null }, { endDate: { gte: today } }] },
      ],
    },
    include: {
      logs: {
        where: {
          completedAt: {
            gte: today,
            lte: endOfDay(today),
          },
        },
        orderBy: { completedAt: "desc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Filter by targetDays: empty array means the habit appears every day
  return habits.filter(
    (h) => h.targetDays.length === 0 || h.targetDays.includes(todayDayIndex)
  );
}

export async function getHabitStreak(habitId: string): Promise<number> {
  const logs = await prisma.habitLog.findMany({
    where: { habitId },
    orderBy: { completedAt: "desc" },
    select: { completedAt: true },
  });

  if (logs.length === 0) return 0;

  const today = startOfDay(new Date());
  const uniqueDays = [
    ...new Set(logs.map((l) => format(l.completedAt, "yyyy-MM-dd"))),
  ].sort((a, b) => b.localeCompare(a));

  const mostRecent = startOfDay(new Date(uniqueDays[0]));
  const diffFromToday = Math.floor(
    (today.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffFromToday > 1) return 0;

  let streak = 0;
  let expectedDate = diffFromToday === 0 ? today : subDays(today, 1);

  for (const day of uniqueDays) {
    const dayDate = startOfDay(new Date(day));
    if (dayDate.getTime() === expectedDate.getTime()) {
      streak++;
      expectedDate = subDays(expectedDate, 1);
    } else {
      break;
    }
  }

  return streak;
}

export async function getAllTimeStreak(habitId: string): Promise<number> {
  const logs = await prisma.habitLog.findMany({
    where: { habitId },
    orderBy: { completedAt: "asc" },
    select: { completedAt: true },
  });

  if (logs.length === 0) return 0;

  const uniqueDays = [
    ...new Set(logs.map((l) => format(l.completedAt, "yyyy-MM-dd"))),
  ].sort((a, b) => a.localeCompare(b));

  let best = 1;
  let current = 1;

  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = startOfDay(new Date(uniqueDays[i - 1]));
    const curr = startOfDay(new Date(uniqueDays[i]));
    const diff = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 1) {
      current++;
      if (current > best) best = current;
    } else {
      current = 1;
    }
  }

  return best;
}

export async function getHabitTrends(
  userId: string,
  days: number = 30
): Promise<{ date: string; completed: number; total: number }[]> {
  const startDate = subDays(new Date(), days - 1);

  const habits = await prisma.habit.findMany({
    where: { userId, archivedAt: null },
    select: { id: true, targetDays: true, startDate: true, endDate: true },
  });

  if (habits.length === 0) return [];

  const logs = await prisma.habitLog.findMany({
    where: {
      habitId: { in: habits.map((h) => h.id) },
      completedAt: { gte: startOfDay(startDate) },
    },
    select: { habitId: true, completedAt: true },
  });

  const result: { date: string; completed: number; total: number }[] = [];

  for (let i = 0; i < days; i++) {
    const date = subDays(new Date(), days - 1 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    const dayOfWeek = date.getDay();

    // Only count habits that are active and scheduled for this specific day
    const scheduledHabits = habits.filter((h) => {
      if (h.startDate && h.startDate > dayEnd) return false;
      if (h.endDate && h.endDate < dayStart) return false;
      if (h.targetDays.length > 0 && !h.targetDays.includes(dayOfWeek)) return false;
      return true;
    });

    const scheduledIds = new Set(scheduledHabits.map((h) => h.id));

    const completed = logs.filter(
      (l) => scheduledIds.has(l.habitId) && l.completedAt >= dayStart && l.completedAt <= dayEnd
    ).length;

    result.push({ date: dateStr, completed, total: scheduledHabits.length });
  }

  return result;
}

export async function getOverallStats(userId: string) {
  const habits = await prisma.habit.findMany({
    where: { userId, archivedAt: null },
    include: { logs: true },
  });

  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);
  const todayDayOfWeek = today.getDay();

  // Helper: is a habit scheduled for a given day?
  function isScheduledOn(
    h: { targetDays: number[]; startDate: Date | null; endDate: Date | null },
    dayStart: Date,
    dayEnd: Date,
    dayOfWeek: number
  ) {
    if (h.startDate && h.startDate > dayEnd) return false;
    if (h.endDate && h.endDate < dayStart) return false;
    if (h.targetDays.length > 0 && !h.targetDays.includes(dayOfWeek)) return false;
    return true;
  }

  const completedToday = habits.filter(
    (h) =>
      isScheduledOn(h, todayStart, todayEnd, todayDayOfWeek) &&
      h.logs.some((l) => l.completedAt >= todayStart && l.completedAt <= todayEnd)
  ).length;

  const streaks = await Promise.all(
    habits.map(async (h) => ({
      id: h.id,
      name: h.name,
      streak: await getHabitStreak(h.id),
    }))
  );

  const longestStreak = streaks.length > 0
    ? Math.max(...streaks.map((s) => s.streak))
    : 0;
  const bestHabit = streaks.find((s) => s.streak === longestStreak);

  const last7Days = Array.from({ length: 7 }, (_, i) => subDays(today, i));
  const completionRates = last7Days
    .map((date) => {
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      const dayOfWeek = date.getDay();
      const scheduledHabits = habits.filter((h) =>
        isScheduledOn(h, dayStart, dayEnd, dayOfWeek)
      );
      if (scheduledHabits.length === 0) return null;
      const completed = scheduledHabits.filter((h) =>
        h.logs.some((l) => l.completedAt >= dayStart && l.completedAt <= dayEnd)
      ).length;
      return (completed / scheduledHabits.length) * 100;
    })
    .filter((r): r is number => r !== null);

  const avgCompletionRate =
    completionRates.length > 0
      ? completionRates.reduce((a, b) => a + b, 0) / completionRates.length
      : 0;

  return {
    totalHabits: habits.length,
    completedToday,
    longestStreak,
    bestHabit: longestStreak > 0 ? (bestHabit?.name ?? null) : null,
    avgCompletionRate: Math.round(avgCompletionRate),
    streaks,
  };
}
