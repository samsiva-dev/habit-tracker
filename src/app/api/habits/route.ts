import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const habits = await prisma.habit.findMany({
    where: { userId: session.user.id, archivedAt: null },
    include: { logs: { orderBy: { completedAt: "desc" }, take: 100 } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(habits);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, color, icon, frequency, startDate, endDate, targetDays } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const habit = await prisma.habit.create({
    data: {
      userId: session.user.id,
      name: name.trim(),
      description: description?.trim() ?? null,
      color: color ?? "#6366f1",
      icon: icon ?? "✓",
      frequency: frequency ?? "daily",
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      targetDays: targetDays ?? [],
    },
  });

  return NextResponse.json(habit, { status: 201 });
}
