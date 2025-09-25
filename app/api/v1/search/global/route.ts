import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const querySchema = z.object({
  q: z.string().trim().max(100).optional(),
});

const SEARCH_LIMIT = 5;

export async function GET(req: NextRequest) {
  const limiter = rateLimit(`cmdk:${req.ip ?? "unknown"}`, 120);
  if (!limiter.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({ q: searchParams.get("q") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 422 });
  }

  const q = parsed.data.q ?? "";
  const trimmed = q.trim();
  if (!trimmed) {
    const [recentPackages, hospitals] = await Promise.all([
      prisma.healthPackage.findMany({
        where: { status: "APPROVED" },
        orderBy: { updatedAt: "desc" },
        take: SEARCH_LIMIT,
        select: {
          id: true,
          title: true,
          slug: true,
          basePrice: true,
          hospital: { select: { name: true } },
        },
      }),
      prisma.hospital.findMany({
        orderBy: { updatedAt: "desc" },
        take: SEARCH_LIMIT,
        select: { id: true, name: true, district: true },
      }),
    ]);

    return NextResponse.json({
      packages: recentPackages,
      hospitals,
    });
  }

  const tokens = trimmed.toLowerCase().split(/\s+/).filter(Boolean);

  const [packages, hospitals] = await Promise.all([
    prisma.healthPackage.findMany({
      where: {
        status: "APPROVED",
        OR: [
          { title: { contains: trimmed, mode: "insensitive" } },
          { hospital: { name: { contains: trimmed, mode: "insensitive" } } },
          ...(tokens.length ? [{ tags: { hasSome: tokens } }] : []),
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: SEARCH_LIMIT,
      select: {
        id: true,
        title: true,
        slug: true,
        basePrice: true,
        hospital: { select: { name: true } },
      },
    }),
    prisma.hospital.findMany({
      where: { name: { contains: trimmed, mode: "insensitive" } },
      orderBy: { name: "asc" },
      take: SEARCH_LIMIT,
      select: { id: true, name: true, district: true },
    }),
  ]);

  return NextResponse.json({ packages, hospitals });
}
