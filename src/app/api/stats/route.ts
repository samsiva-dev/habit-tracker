import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOverallStats, getHabitTrends, getHabitStreak } from "@/lib/habits";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "30");

  const [stats, trends, habits] = await Promise.all([
    getOverallStats(session.user.id),
    getHabitTrends(session.user.id, days),
    prisma.habit.findMany({
      where: { userId: session.user.id, archivedAt: null },
      select: { id: true, name: true, color: true, icon: true },
    }),
  ]);

  const habitsWithStreaks = await Promise.all(
    habits.map(async (h) => ({
      ...h,
      streak: await getHabitStreak(h.id),
    }))
  );

  return NextResponse.json({ stats, trends, habits: habitsWithStreaks });
}
