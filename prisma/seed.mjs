import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const hospitals = [
  {
    key: "cmr",
    name: "โรงพยาบาลเชียงใหม่ราม",
    shortName: "CMR",
    district: "เมืองเชียงใหม่",
    phone: "053-920300",
    website: "https://www.chiangmairam.com",
    logoUrl: "https://images.healthcheck.cm/hospitals/cmr.png",
  },
  {
    key: "mcc",
    name: "โรงพยาบาลแมคคอร์มิค",
    shortName: "MCC",
    district: "เมืองเชียงใหม่",
    phone: "053-921777",
    website: "https://www.mccormick.in.th",
    logoUrl: "https://images.healthcheck.cm/hospitals/mcc.png",
  },
  {
    key: "srn",
    name: "โรงพยาบาลสวนปรุง",
    shortName: "SRN",
    district: "เมืองเชียงใหม่",
    phone: "053-934600",
    website: "https://www.suanprung.go.th",
    logoUrl: "https://images.healthcheck.cm/hospitals/srn.png",
  },
  {
    key: "bkk",
    name: "โรงพยาบาลกรุงเทพเชียงใหม่",
    shortName: "BCH",
    district: "หางดง",
    phone: "052-089-888",
    website: "https://www.bangkokhospital-chiangmai.com",
    logoUrl: "https://images.healthcheck.cm/hospitals/bkk.png",
  },
];

const packages = [
  {
    slug: "cmr-basic-male",
    title: "Basic Health Check (ชาย)",
    basePrice: 1990,
    gender: "male",
    category: ["basic"],
    priceNote: "รวมค่าแพทย์และค่าบริการแล้ว",
    tags: ["blood", "xray", "urine"],
    hospitalKey: "cmr",
    includes: [
      { name: "CBC", groupName: "Basic Lab" },
      { name: "FBS", groupName: "Basic Lab" },
      { name: "Lipid Profile", groupName: "Basic Lab", isOptional: false },
      { name: "Chest X-ray", groupName: "Imaging" },
      { name: "Urinalysis", groupName: "Basic Lab" },
    ],
    histories: [
      { price: 1890, recordedAt: new Date("2024-06-01T00:00:00Z"), notes: "โปรโมชันกลางปี" },
      { price: 1990, recordedAt: new Date("2024-10-01T00:00:00Z"), notes: "ราคาปัจจุบัน" },
    ],
  },
  {
    slug: "cmr-executive-female",
    title: "Executive Premium (หญิง)",
    basePrice: 5990,
    gender: "female",
    category: ["executive"],
    priceNote: "แถมตรวจ Pap Smear",
    tags: ["blood", "ultrasound", "heart", "gyne"],
    hospitalKey: "cmr",
    includes: [
      { name: "CBC", groupName: "Advanced Lab" },
      { name: "Liver Function Test", groupName: "Advanced Lab" },
      { name: "Kidney Function Test", groupName: "Advanced Lab" },
      { name: "Abdominal Ultrasound", groupName: "Imaging" },
      { name: "Chest X-ray", groupName: "Imaging" },
      { name: "Mammogram", groupName: "Imaging" },
      { name: "Pap Smear", groupName: "Gyne" },
      { name: "EKG", groupName: "Heart" },
    ],
    histories: [
      { price: 6290, recordedAt: new Date("2024-03-01T00:00:00Z") },
      { price: 5990, recordedAt: new Date("2024-09-01T00:00:00Z"), notes: "ลดราคา" },
    ],
  },
  {
    slug: "mcc-senior-any",
    title: "Senior Care 60+",
    basePrice: 3490,
    gender: "any",
    category: ["senior"],
    priceNote: "รวมตรวจสมรรถภาพหัวใจและสมอง",
    tags: ["blood", "brain", "heart"],
    hospitalKey: "mcc",
    includes: [
      { name: "CBC", groupName: "Lab" },
      { name: "HbA1c", groupName: "Lab" },
      { name: "Kidney Function Test", groupName: "Lab" },
      { name: "Chest X-ray", groupName: "Imaging" },
      { name: "Bone Density", groupName: "Imaging" },
      { name: "EKG", groupName: "Cardio" },
      { name: "Carotid Ultrasound", groupName: "Cardio" },
    ],
    histories: [
      { price: 3290, recordedAt: new Date("2023-12-01T00:00:00Z") },
      { price: 3490, recordedAt: new Date("2024-07-01T00:00:00Z") },
    ],
  },
  {
    slug: "srn-mental-wellness",
    title: "Mental Wellness Assessment",
    basePrice: 2590,
    gender: "any",
    category: ["mental"],
    priceNote: "ปรึกษาจิตแพทย์ 1 ครั้ง",
    tags: ["mental", "counseling"],
    hospitalKey: "srn",
    includes: [
      { name: "แบบประเมินภาวะซึมเศร้า", groupName: "Screening" },
      { name: "แบบประเมินความเครียด", groupName: "Screening" },
      { name: "จิตบำบัดรายบุคคล", groupName: "Therapy" },
      { name: "เทคนิคผ่อนคลาย", groupName: "Therapy" },
    ],
    histories: [
      { price: 2490, recordedAt: new Date("2024-01-15T00:00:00Z") },
      { price: 2590, recordedAt: new Date("2024-08-15T00:00:00Z") },
    ],
  },
  {
    slug: "bkk-family-combo",
    title: "Family Shield Combo",
    basePrice: 8990,
    gender: "any",
    category: ["family", "premium"],
    priceNote: "ตรวจ 2 ผู้ใหญ่ + 1 เด็ก",
    tags: ["family", "pediatric", "cardio"],
    hospitalKey: "bkk",
    includes: [
      { name: "CBC (ผู้ใหญ่)", groupName: "Adult" },
      { name: "CBC (เด็ก)", groupName: "Child" },
      { name: "Ultrasound ช่องท้อง", groupName: "Adult" },
      { name: "Dental Screening (เด็ก)", groupName: "Child" },
      { name: "Vision Screening", groupName: "Child" },
      { name: "EKG", groupName: "Adult" },
      { name: "Echocardiogram", groupName: "Adult" },
    ],
    histories: [
      { price: 8990, recordedAt: new Date("2024-07-01T00:00:00Z") },
    ],
  },
  {
    slug: "cmr-pre-employment",
    title: "Pre-Employment Screening",
    basePrice: 1790,
    gender: "any",
    category: ["basic", "corporate"],
    priceNote: "รวมใบรับรองแพทย์เพื่อสมัครงาน",
    tags: ["blood", "xray", "vision", "hearing"],
    hospitalKey: "cmr",
    includes: [
      { name: "CBC", groupName: "Lab" },
      { name: "Urine Analysis", groupName: "Lab" },
      { name: "Chest X-ray", groupName: "Imaging" },
      { name: "Vision Test", groupName: "Vitals" },
      { name: "Audiogram", groupName: "Vitals" },
    ],
    histories: [
      { price: 1690, recordedAt: new Date("2023-11-01T00:00:00Z") },
      { price: 1790, recordedAt: new Date("2024-09-15T00:00:00Z") },
    ],
  },
  {
    slug: "mcc-diabetes-care",
    title: "Diabetes Care Package",
    basePrice: 3290,
    gender: "any",
    category: ["chronic"],
    priceNote: "รวมพบอายุรแพทย์และโภชนากร",
    tags: ["blood", "diabetes", "nutrition"],
    hospitalKey: "mcc",
    includes: [
      { name: "HbA1c", groupName: "Lab" },
      { name: "FBS", groupName: "Lab" },
      { name: "Lipid Profile", groupName: "Lab" },
      { name: "Kidney Function Test", groupName: "Lab" },
      { name: "Consultation with Endocrinologist", groupName: "Doctor" },
      { name: "Dietitian Counseling", groupName: "Doctor" },
    ],
    histories: [
      { price: 3190, recordedAt: new Date("2024-02-01T00:00:00Z"), notes: "โปรเปิดตัว" },
      { price: 3290, recordedAt: new Date("2024-08-01T00:00:00Z") },
    ],
  },
  {
    slug: "bkk-heart-protect",
    title: "Heart Protect 360",
    basePrice: 7590,
    gender: "any",
    category: ["cardio", "premium"],
    priceNote: "รวมแพ็กเกจค่าโรงแรมผู้ป่วยวันเดียว",
    tags: ["cardio", "stress", "imaging"],
    hospitalKey: "bkk",
    includes: [
      { name: "EKG", groupName: "Cardio" },
      { name: "Echocardiogram", groupName: "Cardio" },
      { name: "Treadmill Stress Test", groupName: "Cardio" },
      { name: "Cardiac Enzymes", groupName: "Lab" },
      { name: "Chest CT Calcium Scoring", groupName: "Imaging" },
      { name: "Cardiologist Consultation", groupName: "Doctor" },
    ],
    histories: [
      { price: 7490, recordedAt: new Date("2024-04-01T00:00:00Z") },
      { price: 7590, recordedAt: new Date("2024-10-01T00:00:00Z") },
    ],
  },
  {
    slug: "srn-sleep-recharge",
    title: "Sleep Recharge Program",
    basePrice: 3990,
    gender: "any",
    category: ["mental", "wellness"],
    priceNote: "โปรแกรม CBT-I 4 สัปดาห์",
    tags: ["sleep", "mental", "cbt"],
    hospitalKey: "srn",
    includes: [
      { name: "Sleep Quality Assessment", groupName: "Screening" },
      { name: "Polysomnography (1 คืน)", groupName: "Diagnostics" },
      { name: "CBT-I Session", groupName: "Therapy" },
      { name: "Mindfulness Coaching", groupName: "Therapy" },
    ],
    histories: [
      { price: 3790, recordedAt: new Date("2024-05-01T00:00:00Z") },
      { price: 3990, recordedAt: new Date("2024-09-01T00:00:00Z") },
    ],
  },
  {
    slug: "cmr-mom-to-be",
    title: "Mom-to-Be Trimester 1",
    basePrice: 4990,
    gender: "female",
    category: ["pregnancy"],
    priceNote: "แถมวิตามินสำหรับครรภ์แรก",
    tags: ["pregnancy", "ultrasound", "lab"],
    hospitalKey: "cmr",
    includes: [
      { name: "Prenatal Lab Panel", groupName: "Lab" },
      { name: "Blood Type & Rh", groupName: "Lab" },
      { name: "Rubella/Varicella Screening", groupName: "Lab" },
      { name: "Obstetric Ultrasound", groupName: "Imaging" },
      { name: "OB-GYN Consultation", groupName: "Doctor" },
      { name: "Prenatal Vitamin Set", groupName: "Wellness" },
    ],
    histories: [
      { price: 4890, recordedAt: new Date("2024-01-01T00:00:00Z"), notes: "Early bird" },
      { price: 4990, recordedAt: new Date("2024-08-01T00:00:00Z") },
    ],
  },
  {
    slug: "bkk-onco-screen",
    title: "Onco Guard Advanced",
    basePrice: 12900,
    gender: "any",
    category: ["oncology", "premium"],
    priceNote: "รวมตรวจ Tumor Marker ครบทุกเพศ",
    tags: ["oncology", "tumor", "imaging"],
    hospitalKey: "bkk",
    includes: [
      { name: "Comprehensive Tumor Markers", groupName: "Lab" },
      { name: "Low-dose Chest CT", groupName: "Imaging" },
      { name: "Abdominal MRI", groupName: "Imaging" },
      { name: "PET-CT Screening", groupName: "Imaging" },
      { name: "Oncologist Consultation", groupName: "Doctor" },
      { name: "Genetic Risk Assessment", groupName: "Lab" },
    ],
    histories: [
      { price: 13400, recordedAt: new Date("2024-02-01T00:00:00Z"), notes: "ราคาเปิดตัว" },
      { price: 12900, recordedAt: new Date("2024-09-01T00:00:00Z"), notes: "ลดพิเศษปลายปี" },
    ],
  },
  {
    slug: "mcc-travel-asia",
    title: "Travel Ready Asia",
    basePrice: 2890,
    gender: "any",
    category: ["travel"],
    priceNote: "รวมวัคซีนไข้เหลืองและใบรับรองแพทย์",
    tags: ["travel", "vaccine", "lab"],
    hospitalKey: "mcc",
    includes: [
      { name: "Travel Risk Consultation", groupName: "Doctor" },
      { name: "Yellow Fever Vaccine", groupName: "Vaccine" },
      { name: "Typhoid Vaccine", groupName: "Vaccine" },
      { name: "Malaria Prophylaxis Guidance", groupName: "Medication" },
      { name: "Basic Lab Panel", groupName: "Lab" },
      { name: "Fit-to-Fly Certificate", groupName: "Documentation" },
    ],
    histories: [
      { price: 2790, recordedAt: new Date("2024-03-15T00:00:00Z"), notes: "Songkran Promo" },
      { price: 2890, recordedAt: new Date("2024-10-15T00:00:00Z") },
    ],
  },
  {
    slug: "srn-kids-focus",
    title: "Kids Focus Neuro-Development",
    basePrice: 3690,
    gender: "any",
    category: ["pediatric"],
    priceNote: "เหมาะสำหรับเด็กอายุ 4-10 ปี",
    tags: ["kid", "adhd", "therapy"],
    hospitalKey: "srn",
    includes: [
      { name: "Developmental Screening", groupName: "Screening" },
      { name: "ADHD/ADD Assessment", groupName: "Screening" },
      { name: "Sensory Processing Profile", groupName: "Screening" },
      { name: "Occupational Therapy Session", groupName: "Therapy" },
      { name: "Parent Coaching", groupName: "Therapy" },
    ],
    histories: [
      { price: 3490, recordedAt: new Date("2024-04-01T00:00:00Z"), notes: "Summer Camp" },
      { price: 3690, recordedAt: new Date("2024-09-01T00:00:00Z") },
    ],
  },
  {
    slug: "cmr-liver-care",
    title: "Liver Care Clinic",
    basePrice: 4590,
    gender: "any",
    category: ["hepatology", "chronic"],
    priceNote: "รวม FibroScan ตับและอัลตร้าซาวด์",
    tags: ["liver", "hepatitis", "ultrasound"],
    hospitalKey: "cmr",
    includes: [
      { name: "Liver Function Test", groupName: "Lab" },
      { name: "Hepatitis B/C Panel", groupName: "Lab" },
      { name: "Alpha-Fetoprotein", groupName: "Lab" },
      { name: "Abdominal Ultrasound", groupName: "Imaging" },
      { name: "FibroScan", groupName: "Imaging" },
      { name: "Hepatologist Consultation", groupName: "Doctor" },
    ],
    histories: [
      { price: 4490, recordedAt: new Date("2024-05-01T00:00:00Z") },
      { price: 4590, recordedAt: new Date("2024-10-01T00:00:00Z") },
    ],
  },
];

const demoUsers = [
  {
    email: "admin@healthcheck.local",
    name: "Admin Demo",
    role: Role.ADMIN,
    password: "admin1234",
  },
  {
    email: "editor@healthcheck.local",
    name: "Editor Demo",
    role: Role.EDITOR,
    password: "editor1234",
  },
  {
    email: "user@healthcheck.local",
    name: "User Demo",
    role: Role.USER,
    password: "user1234",
  },
  {
    email: "demo@healthcheck.local",
    name: "Demo User",
    role: Role.USER,
    password: "demo1234",
  },
];

async function seedHospitals() {
  const created = new Map();
  for (const hospital of hospitals) {
    const existing = await prisma.hospital.findFirst({ where: { name: hospital.name } });
    let record;
    if (existing) {
      record = await prisma.hospital.update({
        where: { id: existing.id },
        data: {
          shortName: hospital.shortName,
          district: hospital.district,
          phone: hospital.phone,
          website: hospital.website,
          logoUrl: hospital.logoUrl,
        },
      });
    } else {
      record = await prisma.hospital.create({
        data: {
          name: hospital.name,
          shortName: hospital.shortName,
          district: hospital.district,
          phone: hospital.phone,
          website: hospital.website,
          logoUrl: hospital.logoUrl,
        },
      });
    }
    created.set(hospital.key, record);
  }
  return created;
}

async function seedPackages(hospitalMap) {
  for (const pkg of packages) {
    const hospital = hospitalMap.get(pkg.hospitalKey);
    if (!hospital) {
      console.warn(`Hospital key ${pkg.hospitalKey} not found for package ${pkg.slug}`);
      continue;
    }

    const record = await prisma.healthPackage.upsert({
      where: { slug: pkg.slug },
      update: {
        hospitalId: hospital.id,
        title: pkg.title,
        basePrice: pkg.basePrice,
        gender: pkg.gender,
        category: pkg.category,
        priceNote: pkg.priceNote,
        status: "APPROVED",
        tags: pkg.tags,
      },
      create: {
        hospitalId: hospital.id,
        title: pkg.title,
        slug: pkg.slug,
        basePrice: pkg.basePrice,
        gender: pkg.gender,
        category: pkg.category,
        priceNote: pkg.priceNote,
        status: "APPROVED",
        tags: pkg.tags,
      },
    });

    await prisma.packageItem.deleteMany({ where: { packageId: record.id } });
    if (pkg.includes?.length) {
      await prisma.packageItem.createMany({
        data: pkg.includes.map((item) => ({
          packageId: record.id,
          name: item.name,
          groupName: item.groupName ?? null,
          isOptional: item.isOptional ?? false,
        })),
      });
    }

    await prisma.priceHistory.deleteMany({ where: { packageId: record.id } });
    if (pkg.histories?.length) {
      await prisma.priceHistory.createMany({
        data: pkg.histories.map((history) => ({
          packageId: record.id,
          price: history.price,
          recordedAt: history.recordedAt,
          notes: history.notes ?? null,
        })),
      });
    }

    await prisma.packageMetric.upsert({
      where: { packageId: record.id },
      update: {
        viewCount: { increment: 25 },
        compareCount: { increment: 5 },
        bookmarkCount: { increment: 2 },
      },
      create: {
        packageId: record.id,
        viewCount: 25,
        compareCount: 5,
        bookmarkCount: 2,
      },
    });
  }
}

async function seedUsers() {
  for (const user of demoUsers) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        passwordHash,
      },
      create: {
        email: user.email,
        name: user.name,
        role: user.role,
        passwordHash,
      },
    });
  }
}

async function main() {
  console.info("Seeding hospitals...");
  const hospitalMap = await seedHospitals();
  console.info(`Seeded ${hospitalMap.size} hospitals`);

  console.info("Seeding packages...");
  await seedPackages(hospitalMap);
  console.info(`Seeded ${packages.length} packages with includes & histories`);

  console.info("Seeding demo users...");
  await seedUsers();
  console.info(`Seeded ${demoUsers.length} demo users`);
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
