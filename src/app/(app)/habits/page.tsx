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

  const [habitsRaw, archivedRaw] = await Promise.all([
    prisma.habit.findMany({
      where: { userId: session.user.id, archivedAt: null },
      include: { _count: { select: { logs: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.habit.findMany({
      where: { userId: session.user.id, archivedAt: { not: null } },
      include: { _count: { select: { logs: true } } },
      orderBy: { archivedAt: "desc" },
    }),
  ]);

  function mapHabit(h: Habit & { _count: { logs: number } }) {
    return {
      id: h.id,
      name: h.name,
      description: h.description,
      color: h.color,
      icon: h.icon,
      frequency: h.frequency,
      startDate: h.startDate ? format(h.startDate, "yyyy-MM-dd") : null,
      endDate: h.endDate ? format(h.endDate, "yyyy-MM-dd") : null,
      targetDays: h.targetDays as number[],
      totalLogs: h._count.logs,
      createdAt: h.createdAt.toISOString(),
    };
  }

  const habits = await Promise.all(
    habitsRaw.map(async (h) => ({
      ...mapHabit(h),
      streak: await getHabitStreak(h.id),
      achievements: (await getHabitAchievements(h.id)).map((a) => ({
        type:     a.type,
        earnedAt: a.earnedAt.toISOString(),
      })),
    }))
  );

  const archivedHabits = archivedRaw.map((h) => ({
    ...mapHabit(h),
    streak: 0,
    achievements: [],
  }));

  return <HabitsClient habits={habits} archivedHabits={archivedHabits} />;
}
