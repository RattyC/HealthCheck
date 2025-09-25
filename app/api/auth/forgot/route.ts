import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/tokens";

const schema = z.object({ email: z.string().email({ message: "อีเมลไม่ถูกต้อง" }) });

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 422 });
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  let debugToken: string | null = null;
  if (user) {
    const token = generateToken(18);
    const expires = new Date(Date.now() + 1000 * 60 * 30);
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });
    await prisma.verificationToken.create({
      data: { identifier: email, token, expires },
    });
    await prisma.systemLog.create({
        data: { level: "INFO", message: "password.reset.request", context: { userId: user.id } },
    });
    if (process.env.NODE_ENV === "development") {
      debugToken = token;
    }
  }

  return NextResponse.json({ ok: true, token: debugToken });
}
