import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ChallengesClient from "./ChallengesClient";

export const dynamic = "force-dynamic";

export default async function ChallengesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const challenges = await prisma.challenge.findMany({
    where: { userId: session.user.id },
    include: { logs: true },
    orderBy: { createdAt: "desc" },
  });

  const data = challenges.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    color: c.color,
    icon: c.icon,
    startDate: c.startDate.toISOString(),
    duration: c.duration,
    completedDays: c.logs.map((l) => l.dayNumber),
  }));

  return <ChallengesClient challenges={data} />;
}
