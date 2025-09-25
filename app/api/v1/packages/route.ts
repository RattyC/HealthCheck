import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { authConfig } from "@/lib/auth";
import { packageSearchSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const SEARCH_LIMIT = Number(process.env.RATE_LIMIT_SEARCH ?? 120);

function parseSearchParams(searchParams: URLSearchParams) {
  const raw = {
    q: searchParams.get("q") ?? undefined,
    hospitalId: searchParams.get("hospitalId") ?? undefined,
    minPrice: searchParams.get("minPrice") ?? undefined,
    maxPrice: searchParams.get("maxPrice") ?? undefined,
    gender: searchParams.get("gender") ?? undefined,
    age: searchParams.get("age") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  };
  return packageSearchSchema.safeParse(raw);
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.ip ?? "unknown";
  const limiter = rateLimit(`search:${ip}`, SEARCH_LIMIT);
  if (!limiter.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": Math.ceil((limiter.reset - Date.now()) / 1000).toString() } });
  }

  const { searchParams } = new URL(req.url);
  const parsed = parseSearchParams(searchParams);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid search parameters", issues: parsed.error.flatten() }, { status: 422 });
  }

  const { q, hospitalId, minPrice, maxPrice, gender, age, category, sort, page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  const tokens = q?.toLowerCase().split(/\s+/).filter(Boolean) ?? [];

  const where: Prisma.HealthPackageWhereInput = {
    status: "APPROVED",
    ...(hospitalId ? { hospitalId } : {}),
    ...(minPrice ? { basePrice: { gte: minPrice } } : {}),
    ...(maxPrice ? { basePrice: { lte: maxPrice } } : {}),
    ...(gender && gender !== "any"
      ? {
          OR: [
            { gender: "any" },
            { gender },
          ],
        }
      : {}),
    ...(age
      ? {
          AND: [
            { OR: [{ minAge: null }, { minAge: { lte: age } }] },
            { OR: [{ maxAge: null }, { maxAge: { gte: age } }] },
          ],
        }
      : {}),
    ...(category ? { category: { has: category } } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            ...(tokens.length ? [{ tags: { hasSome: tokens } }] : []),
            { includes: { some: { name: { contains: q, mode: "insensitive" } } } },
            { hospital: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.HealthPackageOrderByWithRelationInput =
    sort === "priceDesc"
      ? { basePrice: "desc" }
      : sort === "updated"
      ? { updatedAt: "desc" }
      : { basePrice: "asc" };

  try {
    const [total, items] = await Promise.all([
      prisma.healthPackage.count({ where }),
      prisma.healthPackage.findMany({
        where,
        orderBy,
        include: {
          hospital: { select: { id: true, name: true, logoUrl: true } },
          _count: { select: { includes: true } },
          metrics: true,
        },
        skip,
        take: limit,
      }),
    ]);

    const session = await getServerSession(authConfig);
    await prisma.searchLog.create({
      data: {
        userId: session?.user?.id,
        filters: parsed.data,
        results: total,
      },
    });

    return NextResponse.json({ page, limit, total, items });
  } catch (error) {
    logger.error("api.packages.search_failed", { error: `${error}` });
    return NextResponse.json({ page: 1, limit, total: 0, items: [] }, { status: 500 });
  }
}
