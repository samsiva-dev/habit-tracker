import { auth } from "@/lib/auth";
import { getHabitTrends, getOverallStats, getHabitStreak } from "@/lib/habits";
import { prisma } from "@/lib/prisma";
import TrendsClient from "./TrendsClient";
import type { Habit, HabitLog } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function TrendsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [trends30, stats, habitsRaw] = await Promise.all([
    getHabitTrends(session.user.id, 30),
    getOverallStats(session.user.id),
    prisma.habit.findMany({
      where: { userId: session.user.id, archivedAt: null },
      include: {
        logs: {
          orderBy: { completedAt: "desc" },
          take: 90,
        },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const habits = await Promise.all(
    habitsRaw.map(async (h: Habit & { logs: HabitLog[] }) => ({
      id: h.id,
      name: h.name,
      color: h.color,
      icon: h.icon,
      streak: await getHabitStreak(h.id),
      totalLogs: h.logs.length,
      logs: h.logs.map((l: HabitLog) => l.completedAt.toISOString()),
    }))
  );

  return (
    <TrendsClient
      trends={trends30}
      stats={stats}
      habits={habits}
    />
  );
}
