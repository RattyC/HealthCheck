import { NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(64),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
  }
  const { token, password } = parsed.data;

  const record = await prisma.verificationToken.findFirst({ where: { token } });
  if (!record || record.expires < new Date()) {
    return NextResponse.json({ error: "Token expired" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: record.identifier } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const passwordHash = await hash(password, 10);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.verificationToken.deleteMany({ where: { identifier: record.identifier } }),
    prisma.auditTrail.create({
      data: {
        actorId: user.id,
        action: "RESET_PASSWORD",
        entityId: user.id,
        entityType: "user",
        diff: { event: "password_reset" },
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
