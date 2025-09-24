import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  try {
    const id = params.id;
    const pkg = await prisma.healthPackage.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        hospital: true,
        includes: true,
        histories: { orderBy: { recordedAt: "desc" }, take: 12 },
      },
    });

    if (!pkg) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(pkg);
  } catch (e) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }
}
