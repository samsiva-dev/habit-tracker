import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const challenges = await prisma.challenge.findMany({
    where: { userId: session.user.id },
    include: { logs: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(challenges);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { name, description, color, icon, startDate } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!startDate) {
    return NextResponse.json({ error: "Start date is required" }, { status: 400 });
  }

  const challenge = await prisma.challenge.create({
    data: {
      userId: session.user.id,
      name: name.trim(),
      description: description?.trim() ?? null,
      color: color ?? "#6366f1",
      icon: icon ?? "🎯",
      startDate: new Date(startDate),
    },
    include: { logs: true },
  });

  return NextResponse.json(challenge, { status: 201 });
}
