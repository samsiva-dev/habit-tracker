import { auth } from "@/lib/auth";
import { getUserHabits, getHabitStreak, getOverallStats, getUserAchievements } from "@/lib/habits";
import DashboardClient from "./DashboardClient";
import { format } from "date-fns";
import type { Habit, HabitLog } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [habitsRaw, stats, achievementsRaw] = await Promise.all([
    getUserHabits(session.user.id),
    getOverallStats(session.user.id),
    getUserAchievements(session.user.id),
  ]);

  const habits = await Promise.all(
    habitsRaw.map(async (h: Habit & { logs: HabitLog[] }) => ({
      id: h.id,
      name: h.name,
      description: h.description,
      color: h.color,
      icon: h.icon,
      streak: await getHabitStreak(h.id),
      completedToday: h.logs.length > 0,
      todayNote: h.logs[0]?.notes ?? null,
    }))
  );

  const milestones = achievementsRaw.map((a) => ({
    habitId:    a.habitId,
    habitName:  a.habitName,
    habitColor: a.habitColor,
    type:       a.type,
    earnedAt:   a.earnedAt.toISOString(),
  }));

  const today = format(new Date(), "EEEE, MMMM d");

  return (
    <DashboardClient
      habits={habits}
      stats={stats}
      today={today}
      userName={session.user.name ?? ""}
      milestones={milestones}
    />
  );
}
