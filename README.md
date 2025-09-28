# HealthCheck CM Price

เว็บเทียบราคาแพ็กเกจตรวจสุขภาพเชียงใหม่ — Next.js 15 + Prisma + Tailwind

## ฟีเจอร์หลัก
- Landing page พร้อม quick filters, แพ็กเกจยอดนิยม, และแนะนำประกัน
- หน้ารายการ `/packages` + ฟิลเตอร์ (ช่วงราคา, โรงพยาบาล, เพศ, อายุ, แท็ก)
- หน้ารายละเอียด `/packages/[id]` แสดง price history, กราฟ, bookmark, cart
- เปรียบเทียบแพ็กเกจ `/compare` + library สำหรับลิงก์ที่บันทึกไว้
- ตะกร้า `/cart` ให้ผู้ใช้เตรียมสอบถามแพ็กเกจที่สนใจ
- แดชบอร์ดผู้ใช้ `/dashboard` รวม activity, bookmarks, saved searches
- ผู้ดูแลระบบ `/admin` + รายงานตะกร้า + อนุมัติ/กรองแพ็กเกจ
- ฟอร์ม auth (sign-in / forgot / reset) + toast feedback
- API `/api/v1/*` (packages, bookmarks, cart, compare) และ `/api/healthz` health check

## โครงสร้างโดยย่อ
- `app/` ทุกหน้าและ API route (healthz, auth, packages, cart, admin)
- `components/` UI หลัก: FilterBar, PackageCard, CompareClient, Auth forms, cart buttons
- `lib/` Prisma client, session tools, rate-limit, logger
- `prisma/schema.prisma` สคีมา + `prisma/seed.mjs` ชุด seed data (4 โรงพยาบาล, 13 แพ็กเกจ)
- `docs/production-checklist.md` เช็กลิสต์เตรียมโปรดักชัน

## การเริ่มต้น
1) ติดตั้งแพ็กเกจ (เลือกแพ็กเกจแมเนเจอร์ที่ชอบ)
```
npm install
```

2) ตั้งค่าไฟล์แวดล้อม
```
cp .env.example .env
# แก้ DATABASE_URL ให้ชี้ไปยัง Postgres ของคุณ
```

3) สตาร์ทฐานข้อมูล Postgres (ด้วย Docker) และ Prisma migrate/seed
ถ้ามี Docker:
```
npm run db:up
```
จากนั้น migrate + seed:
```
npx prisma generate
npx prisma migrate dev --name init
# (หลังเพิ่มการ์ด/tables ใหม่ ๆ เช่น Cart ให้รัน migrate dev อีกรอบ)
npm run prisma:seed
```

4) รันเว็บ
```
npm run dev
```

เปิด `http://localhost:3000` แล้วทดสอบหน้า `/packages`, `/cart`, `/admin`, `/api/healthz`

## Accounts ตัวอย่าง (หลัง seed)
| Role      | Email                       | Password   |
|-----------|-----------------------------|------------|
| Admin     | `admin@healthcheck.local`   | `admin1234`|
| Editor    | `editor@healthcheck.local`  | `editor1234`|
| User      | `user@healthcheck.local`    | `user1234` |

## API สำคัญ
- `GET /api/v1/packages` – ค้นหาแพ็กเกจตามฟิลเตอร์ query string
- `GET /api/v1/cart` / `POST /api/v1/cart` / `DELETE /api/v1/cart/:packageId`
- `POST /api/v1/bookmarks` / `DELETE /api/v1/bookmarks/:packageId`
- `GET /api/healthz` – ตรวจสถานะระบบ + database ping (ใช้กับ monitoring/uptime bot)

## หมายเหตุ
- ถ้าใช้งานหลังพร็อกซี/ดีพลอย ให้ตั้ง `NEXT_PUBLIC_BASE_URL` เป็น origin ของเว็บ เช่น `http://localhost:3000`
- สคีมาครอบคลุม Hospital/HealthPackage/PackageItem/PriceHistory/ApprovalLog/Bookmark พร้อม enum `PackageStatus`
- เพิ่มตาราง `Cart` / `CartItem` สำหรับตะกร้า (รัน migrate dev หลังดึงโค้ดล่าสุด)
- สามารถขยายฟีเจอร์ Compare, Bookmark, Admin CMS ตามแผนได้ทันที
- ถ้าไม่มี Docker หรือใช้ฐานข้อมูลภายนอก (Supabase/Neon) ให้ตั้ง `DATABASE_URL` เป็นค่าจากผู้ให้บริการ แล้วข้ามขั้นตอน `db:up`

## แผนงานถัดไป
- ต่อ KPI/production checklist จาก `docs/production-checklist.md` (UX, security, ops)
- ปรับใช้ rate-limit ระดับ production หรือ Redis-based ตามทราฟฟิกจริง
- ต่อ CI (lint/test/build) + deploy อัตโนมัติ พร้อม `prisma migrate deploy`
- ออกแบบ onboarding flow สำหรับโรงพยาบาล/พาร์ตเนอร์ + auto-scraper data feed
