import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ChallengeDetailClient from "./ChallengeDetailClient";

export const dynamic = "force-dynamic";

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { id } = await params;
  const challenge = await prisma.challenge.findFirst({
    where: { id, userId: session.user.id },
    include: { logs: true },
  });

  if (!challenge) notFound();

  return (
    <ChallengeDetailClient
      id={challenge.id}
      name={challenge.name}
      description={challenge.description}
      color={challenge.color}
      icon={challenge.icon}
      startDate={challenge.startDate.toISOString()}
      duration={challenge.duration}
      initialCompletedDays={challenge.logs.map((l) => l.dayNumber)}
    />
  );
}
