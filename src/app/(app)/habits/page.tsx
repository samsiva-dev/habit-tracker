import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getHabitStreak } from "@/lib/habits";
import HabitsClient from "./HabitsClient";

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
    habitsRaw.map(async (h) => ({
      id: h.id,
      name: h.name,
      description: h.description,
      color: h.color,
      icon: h.icon,
      frequency: h.frequency,
      streak: await getHabitStreak(h.id),
      totalLogs: h._count.logs,
      createdAt: h.createdAt.toISOString(),
    }))
  );

  return <HabitsClient habits={habits} />;
}
