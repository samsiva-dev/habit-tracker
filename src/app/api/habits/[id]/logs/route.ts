import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const habit = await prisma.habit.findFirst({
    where: { id, userId: session.user.id, archivedAt: null },
  });
  if (!habit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const completedAt = body.completedAt ? new Date(body.completedAt) : new Date();

  // Upsert: one log per habit per day
  const dayStart = startOfDay(completedAt);
  const dayEnd = endOfDay(completedAt);

  const existing = await prisma.habitLog.findFirst({
    where: {
      habitId: id,
      completedAt: { gte: dayStart, lte: dayEnd },
    },
  });

  if (existing) {
    // Toggle off
    await prisma.habitLog.delete({ where: { id: existing.id } });
    return NextResponse.json({ completed: false });
  }

  const log = await prisma.habitLog.create({
    data: {
      habitId: id,
      completedAt,
      notes: body.notes ?? null,
    },
  });

  return NextResponse.json({ completed: true, log }, { status: 201 });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const habit = await prisma.habit.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!habit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "30");

  const logs = await prisma.habitLog.findMany({
    where: {
      habitId: id,
      completedAt: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
    },
    orderBy: { completedAt: "desc" },
  });

  return NextResponse.json(logs);
}
