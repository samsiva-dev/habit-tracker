import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getHabitForUser(habitId: string, userId: string) {
  return prisma.habit.findFirst({
    where: { id: habitId, userId, archivedAt: null },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const habit = await getHabitForUser(id, session.user.id);
  if (!habit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(habit);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const habit = await getHabitForUser(id, session.user.id);
  if (!habit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const { name, description, color, icon, frequency, startDate, endDate, targetDays } = body;

  const updated = await prisma.habit.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() ?? null }),
      ...(color !== undefined && { color }),
      ...(icon !== undefined && { icon }),
      ...(frequency !== undefined && { frequency }),
      ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      ...(targetDays !== undefined && { targetDays }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const habit = await getHabitForUser(id, session.user.id);
  if (!habit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Soft delete
  await prisma.habit.update({
    where: { id },
    data: { archivedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
