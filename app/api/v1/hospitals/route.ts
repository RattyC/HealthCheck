import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const hospitals = await prisma.hospital.findMany({
      include: { _count: { select: { packages: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(hospitals);
  } catch (e) {
    return NextResponse.json([]);
  }
}
