import { auth } from "@/lib/auth";
import { getUserHabits, getHabitStreak, getOverallStats } from "@/lib/habits";
import DashboardClient from "./DashboardClient";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [habitsRaw, stats] = await Promise.all([
    getUserHabits(session.user.id),
    getOverallStats(session.user.id),
  ]);

  const habits = await Promise.all(
    habitsRaw.map(async (h) => ({
      id: h.id,
      name: h.name,
      description: h.description,
      color: h.color,
      icon: h.icon,
      streak: await getHabitStreak(h.id),
      completedToday: h.logs.length > 0,
    }))
  );

  const today = format(new Date(), "EEEE, MMMM d");

  return (
    <DashboardClient
      habits={habits}
      stats={stats}
      today={today}
      userName={session.user.name ?? ""}
    />
  );
}
