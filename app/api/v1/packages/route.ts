import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";
    const hospitalId = searchParams.get("hospitalId") ?? undefined;
    const minPrice = Number(searchParams.get("minPrice") ?? 0);
    const maxPrice = Number(searchParams.get("maxPrice") ?? 0);
    const gender = searchParams.get("gender") ?? undefined;
    const age = Number(searchParams.get("age") ?? 0);
    const category = searchParams.get("category") ?? undefined;
    const sort = searchParams.get("sort") ?? "priceAsc";
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(Math.max(1, Number(searchParams.get("limit") ?? 20)), 50);
    const skip = (page - 1) * limit;

    const where: any = {
      status: "APPROVED",
      ...(hospitalId ? { hospitalId } : {}),
      ...(minPrice ? { basePrice: { gte: minPrice } } : {}),
      ...(maxPrice ? { basePrice: { lte: maxPrice } } : {}),
      ...(gender && gender !== "any"
        ? { OR: [{ gender: "any" }, { gender }] }
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
              { tags: { hasSome: q.toLowerCase().split(" ") } },
              { includes: { some: { name: { contains: q, mode: "insensitive" } } } },
            ],
          }
        : {}),
    };

    const orderBy =
      sort === "priceDesc"
        ? { basePrice: "desc" }
        : sort === "updated"
        ? { updatedAt: "desc" }
        : { basePrice: "asc" };

    const [total, items] = await Promise.all([
      prisma.healthPackage.count({ where }),
      prisma.healthPackage.findMany({
        where,
        orderBy,
        include: {
          hospital: { select: { id: true, name: true, logoUrl: true } },
          _count: { select: { includes: true } },
        },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({ page, limit, total, items });
  } catch (e) {
    return NextResponse.json({ page: 1, limit: 20, total: 0, items: [] });
  }
}
