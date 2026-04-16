import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, subDays, format } from "date-fns";

export async function getUserHabits(userId: string) {
  return prisma.habit.findMany({
    where: { userId, archivedAt: null },
    include: {
      logs: {
        where: {
          completedAt: {
            gte: startOfDay(new Date()),
            lte: endOfDay(new Date()),
          },
        },
        orderBy: { completedAt: "desc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });
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

export async function getHabitTrends(
  userId: string,
  days: number = 30
): Promise<{ date: string; completed: number; total: number }[]> {
  const startDate = subDays(new Date(), days - 1);

  const habits = await prisma.habit.findMany({
    where: { userId, archivedAt: null },
    select: { id: true },
  });

  const totalHabits = habits.length;
  if (totalHabits === 0) return [];

  const logs = await prisma.habitLog.findMany({
    where: {
      habitId: { in: habits.map((h) => h.id) },
      completedAt: { gte: startOfDay(startDate) },
    },
    select: { completedAt: true },
  });

  const result: { date: string; completed: number; total: number }[] = [];

  for (let i = 0; i < days; i++) {
    const date = subDays(new Date(), days - 1 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const completed = logs.filter(
      (l) => l.completedAt >= dayStart && l.completedAt <= dayEnd
    ).length;

    result.push({ date: dateStr, completed, total: totalHabits });
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

  const completedToday = habits.filter((h) =>
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
  const completionRates = last7Days.map((date) => {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    const completed = habits.filter((h) =>
      h.logs.some(
        (l) => l.completedAt >= dayStart && l.completedAt <= dayEnd
      )
    ).length;
    return habits.length > 0 ? (completed / habits.length) * 100 : 0;
  });

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
