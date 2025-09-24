# HealthCheck CM Price

เว็บเทียบราคาแพ็กเกจตรวจสุขภาพเชียงใหม่ — Next.js 14 + Prisma + Tailwind

## โครงสร้างโดยย่อ
- `app/` หน้า Landing, `/packages`, `/packages/[id]`, และ API (`/api/v1/*`)
- `components/` UI หลัก: FilterBar, PackageCard, Pagination, EmptyState
- `lib/prisma.ts` Prisma Client (singleton)
- `prisma/schema.prisma` สคีมา และ `prisma/seed.ts` สคริปต์ seed ตัวอย่าง
- `app/api/v1/packages` เอ็นด์พอยต์หลักสำหรับค้นหา/ฟิลเตอร์

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
npm run prisma:seed
```

4) รันเว็บ
```
npm run dev
```

เปิด `http://localhost:3000` แล้วทดสอบหน้า `/packages` และรายละเอียดแพ็กเกจ

## หมายเหตุ
- ถ้าใช้งานหลังพร็อกซี/ดีพลอย ให้ตั้ง `NEXT_PUBLIC_BASE_URL` เป็น origin ของเว็บ เช่น `http://localhost:3000`
- สคีมาครอบคลุม Hospital/HealthPackage/PackageItem/PriceHistory/ApprovalLog/Bookmark พร้อม enum `PackageStatus`
- สามารถขยายฟีเจอร์ Compare, Bookmark, Admin CMS ตามแผนได้ทันที
 - ถ้าไม่มี Docker หรือใช้ฐานข้อมูลภายนอก (Supabase/Neon) ให้ตั้ง `DATABASE_URL` เป็นค่าจากผู้ให้บริการ แล้วข้ามขั้นตอน `db:up`

## แผนงานถัดไป
- เพิ่มหน้า `/compare`, `/admin` (Approve/Reject), และฟังก์ชัน revalidate (ISR)
- เพิ่มสกอร์ความคุ้มค่า (value score) และตัวกรองขั้นสูง (ราคา/อายุ/เพศ/แท็ก)
- ตั้ง CI + Lint + Testing (API และ UI)
