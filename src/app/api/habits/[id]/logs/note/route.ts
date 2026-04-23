import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

// PATCH /api/habits/[id]/logs/note — update today's log note
export async function PATCH(
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

  const body = await req.json();
  const notes: string | null = body.notes ?? null;

  const today = new Date();
  const log = await prisma.habitLog.findFirst({
    where: {
      habitId: id,
      completedAt: { gte: startOfDay(today), lte: endOfDay(today) },
    },
  });

  if (!log) {
    return NextResponse.json({ error: "No log for today" }, { status: 404 });
  }

  const updated = await prisma.habitLog.update({
    where: { id: log.id },
    data: { notes },
  });

  return NextResponse.json(updated);
}
