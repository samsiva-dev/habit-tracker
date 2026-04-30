import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getHabitStreak, getHabitAchievements } from "@/lib/habits";
import HabitsClient from "./HabitsClient";
import { format } from "date-fns";
import type { Habit } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function HabitsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const habitsRaw = await prisma.habit.findMany({
    where: { userId: session.user.id, archivedAt: null },
    include: { _count: { select: { logs: true } } },
    orderBy: { createdAt: "asc" },
  });

  const habits = await Promise.all(
    habitsRaw.map(async (h: Habit & { _count: { logs: number } }) => ({
      id: h.id,
      name: h.name,
      description: h.description,
      color: h.color,
      icon: h.icon,
      frequency: h.frequency,
      startDate: h.startDate ? format(h.startDate, "yyyy-MM-dd") : null,
      endDate: h.endDate ? format(h.endDate, "yyyy-MM-dd") : null,
      targetDays: h.targetDays,
      streak: await getHabitStreak(h.id),
      totalLogs: h._count.logs,
      createdAt: h.createdAt.toISOString(),
      achievements: (await getHabitAchievements(h.id)).map((a) => ({
        type:     a.type,
        earnedAt: a.earnedAt.toISOString(),
      })),
    }))
  );

  return <HabitsClient habits={habits} />;
}
