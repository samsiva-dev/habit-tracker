import { auth } from "@/lib/auth";
import { getHabitTrends, getOverallStats, getHabitStreak, getAllTimeStreak } from "@/lib/habits";
import { prisma } from "@/lib/prisma";
import TrendsClient from "./TrendsClient";
import type { Habit, HabitLog } from "@prisma/client";
import { subDays, startOfDay, endOfDay } from "date-fns";

export const dynamic = "force-dynamic";

function countScheduledDays(
  h: Habit,
  rangeStart: Date,
  rangeEnd: Date
): number {
  let count = 0;
  const cur = new Date(rangeStart);
  while (cur <= rangeEnd) {
    const ds = startOfDay(cur);
    const de = endOfDay(cur);
    const dow = cur.getDay();
    const active =
      (!h.startDate || h.startDate <= de) &&
      (!h.endDate || h.endDate >= ds);
    const scheduled =
      (h.targetDays as number[]).length === 0 ||
      (h.targetDays as number[]).includes(dow);
    if (active && scheduled) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export default async function TrendsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const thirtyDaysAgoStart = startOfDay(subDays(new Date(), 29));
  const heatmapStart = startOfDay(subDays(new Date(), 83)); // 12 weeks
  const todayEnd = endOfDay(new Date());

  const [trends30, stats, habitsRaw] = await Promise.all([
    getHabitTrends(session.user.id, 30),
    getOverallStats(session.user.id),
    prisma.habit.findMany({
      where: { userId: session.user.id, archivedAt: null },
      include: {
        logs: {
          where: { completedAt: { gte: heatmapStart } },
          orderBy: { completedAt: "desc" },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const habits = await Promise.all(
    habitsRaw.map(async (h: Habit & { logs: HabitLog[] }) => {
      // logs filtered to last 30 days for completion rate
      const last30Logs = h.logs.filter(
        (l) => l.completedAt >= thirtyDaysAgoStart && l.completedAt <= todayEnd
      );
      return {
        id: h.id,
        name: h.name,
        color: h.color,
        icon: h.icon,
        streak: await getHabitStreak(h.id),
        allTimeStreak: await getAllTimeStreak(h.id),
        totalLogs: last30Logs.length,
        scheduledDays: countScheduledDays(h, thirtyDaysAgoStart, todayEnd),
        logs: h.logs.map((l: HabitLog) => l.completedAt.toISOString()),
      };
    })
  );

  return (
    <TrendsClient
      trends={trends30}
      stats={stats}
      habits={habits}
    />
  );
}
