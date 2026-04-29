import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const challenge = await prisma.challenge.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!challenge) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const dayNumber = Number(body.dayNumber);

  if (!dayNumber || dayNumber < 1 || dayNumber > challenge.duration) {
    return NextResponse.json({ error: "Invalid day number" }, { status: 400 });
  }

  const existing = await prisma.challengeLog.findUnique({
    where: { challengeId_dayNumber: { challengeId: id, dayNumber } },
  });

  if (existing) {
    await prisma.challengeLog.delete({ where: { id: existing.id } });
    return NextResponse.json({ completed: false });
  }

  const log = await prisma.challengeLog.create({
    data: { challengeId: id, dayNumber, notes: body.notes ?? null },
  });

  return NextResponse.json({ completed: true, log }, { status: 201 });
}
