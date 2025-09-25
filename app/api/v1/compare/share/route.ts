import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/tokens";

const schema = z.object({ ids: z.array(z.string().cuid()).min(2).max(4) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "ต้องเลือกอย่างน้อย 2 แพ็กเกจ" }, { status: 422 });
  }
  const { ids } = parsed.data;
  const slug = generateToken(6);
  await prisma.compareSnapshot.create({
    data: {
      slug,
      packageIds: ids,
    },
  });
  return NextResponse.json({ ok: true, slug });
}
