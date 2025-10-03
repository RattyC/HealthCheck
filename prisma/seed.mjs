import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const toDate = (value) => new Date(value);

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
        description:
      "โปรแกรมตรวจพื้นฐานสำหรับผู้ชายวัยทำงาน ครอบคลุม CBC, น้ำตาล, ไขมัน และเอ็กซเรย์ปอด พร้อมสรุปผลโดยแพทย์อายุรกรรม",
    sourceUrl: "https://www.chiangmairam.com/packages/basic-checkup-male",
    validFrom: toDate("2024-01-01T00:00:00Z"),
    lastChecked: toDate("2024-10-10T00:00:00Z"),
    metrics: {
      viewCount: 182,
      compareCount: 46,
      bookmarkCount: 21,
      lastViewedAt: toDate("2024-10-18T09:12:00Z"),
      lastComparedAt: toDate("2024-10-16T04:05:00Z"),
    },
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
    description:
      "โปรแกรมตรวจสุขภาพระดับผู้บริหารสำหรับผู้หญิง เพิ่มเติมการตรวจฮอร์โมน มะเร็งเต้านม และมดลูก พร้อมอัลตร้าซาวด์ช่องท้อง",
    sourceUrl: "https://www.chiangmairam.com/packages/executive-premium-female",
    validFrom: toDate("2024-02-01T00:00:00Z"),
    lastChecked: toDate("2024-10-15T00:00:00Z"),
    metrics: {
      viewCount: 146,
      compareCount: 38,
      bookmarkCount: 17,
      lastViewedAt: toDate("2024-10-19T13:35:00Z"),
      lastComparedAt: toDate("2024-10-14T08:45:00Z"),
    },
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
      { price: 6290, recordedAt: toDate("2024-03-01T00:00:00Z") },
      { price: 5990, recordedAt: toDate("2024-09-01T00:00:00Z"), notes: "ลดราคา" },
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
    description:
      "ออกแบบสำหรับผู้สูงอายุ ตรวจสุขภาพทั่วไป พร้อมตรวจสมอง เบาหวาน ไต และหัวใจ มีเวชศาสตร์ฟื้นฟูให้คำแนะนำ",
    sourceUrl: "https://www.mccormick.in.th/packages/senior-care-60",
    validFrom: toDate("2023-12-01T00:00:00Z"),
    lastChecked: toDate("2024-10-05T00:00:00Z"),
    metrics: {
      viewCount: 128,
      compareCount: 29,
      bookmarkCount: 12,
      lastViewedAt: toDate("2024-10-17T07:10:00Z"),
      lastComparedAt: toDate("2024-10-12T09:00:00Z"),
    },
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
      { price: 3290, recordedAt: toDate("2023-12-01T00:00:00Z") },
      { price: 3490, recordedAt: toDate("2024-07-01T00:00:00Z") },
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
    description:
      "คัดกรองภาวะซึมเศร้าและความเครียดด้วยแบบประเมินมาตรฐาน พร้อมเวลากับจิตแพทย์และเวิร์กช็อปผ่อนคลาย",
    sourceUrl: "https://www.suanprung.go.th/packages/mental-wellness",
    validFrom: toDate("2024-01-15T00:00:00Z"),
    lastChecked: toDate("2024-10-08T00:00:00Z"),
    metrics: {
      viewCount: 94,
      compareCount: 18,
      bookmarkCount: 9,
      lastViewedAt: toDate("2024-10-16T11:22:00Z"),
      lastComparedAt: toDate("2024-10-11T03:55:00Z"),
    },
    includes: [
      { name: "แบบประเมินภาวะซึมเศร้า", groupName: "Screening" },
      { name: "แบบประเมินความเครียด", groupName: "Screening" },
      { name: "จิตบำบัดรายบุคคล", groupName: "Therapy" },
      { name: "เทคนิคผ่อนคลาย", groupName: "Therapy" },
    ],
    histories: [
      { price: 2490, recordedAt: toDate("2024-01-15T00:00:00Z") },
      { price: 2590, recordedAt: toDate("2024-08-15T00:00:00Z") },
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
        description:
      "แพ็กเกจครอบครัวรวมตรวจเลือด อัลตร้าซาวด์ วัคซีนเด็ก และตรวจฟัน ในครั้งเดียวสำหรับครอบครัว",
    sourceUrl: "https://www.bangkokhospital-chiangmai.com/packages/family-shield-combo",
    validFrom: toDate("2024-05-01T00:00:00Z"),
    lastChecked: toDate("2024-10-12T00:00:00Z"),
    metrics: {
      viewCount: 167,
      compareCount: 41,
      bookmarkCount: 19,
      lastViewedAt: toDate("2024-10-19T04:45:00Z"),
      lastComparedAt: toDate("2024-10-15T06:20:00Z"),
    },
    includes: [
      { name: "CBC (ผู้ใหญ่)", groupName: "Adult" },
      { name: "CBC (เด็ก)", groupName: "Child" },
      { name: "Ultrasound ช่องท้อง", groupName: "Adult" },
      { name: "Dental Screening (เด็ก)", groupName: "Child" },
      { name: "Vision Screening", groupName: "Child" },
      { name: "EKG", groupName: "Adult" },
      { name: "Echocardiogram", groupName: "Adult" },
    ],
        histories: [{ price: 8990, recordedAt: toDate("2024-07-01T00:00:00Z") }],
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
    description:
      "ตรวจสุขภาพก่อนเริ่มงาน พร้อมใบรับรองแพทย์ ครอบคลุมเลือด ปัสสาวะ เอ็กซเรย์ปอด การมองเห็น และการได้ยิน",
    sourceUrl: "https://www.chiangmairam.com/packages/pre-employment",
    validFrom: toDate("2023-11-01T00:00:00Z"),
    lastChecked: toDate("2024-10-04T00:00:00Z"),
    metrics: {
      viewCount: 153,
      compareCount: 33,
      bookmarkCount: 14,
      lastViewedAt: toDate("2024-10-17T10:18:00Z"),
      lastComparedAt: toDate("2024-10-13T02:15:00Z"),
    },
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
    description:
      "ควบคุมเบาหวานอย่างรอบด้าน ทั้งตรวจเลือด HbA1c, ไต, ไขมัน พร้อมปรึกษาอายุรแพทย์และนักโภชนาการ",
    sourceUrl: "https://www.mccormick.in.th/packages/diabetes-care",
    validFrom: toDate("2024-02-01T00:00:00Z"),
    lastChecked: toDate("2024-10-09T00:00:00Z"),
    metrics: {
      viewCount: 121,
      compareCount: 27,
      bookmarkCount: 13,
      lastViewedAt: toDate("2024-10-16T15:40:00Z"),
      lastComparedAt: toDate("2024-10-12T05:55:00Z"),
    },
    includes: [
      { name: "HbA1c", groupName: "Lab" },
      { name: "FBS", groupName: "Lab" },
      { name: "Lipid Profile", groupName: "Lab" },
      { name: "Kidney Function Test", groupName: "Lab" },
      { name: "Consultation with Endocrinologist", groupName: "Doctor" },
      { name: "Dietitian Counseling", groupName: "Doctor" },
    ],
    histories: [
      { price: 3190, recordedAt: toDate("2024-02-01T00:00:00Z"), notes: "โปรเปิดตัว" },
      { price: 3290, recordedAt: toDate("2024-08-01T00:00:00Z") },
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
      description:
      "ดูแลหัวใจแบบครบวงจร ทั้ง Echocardiogram, Stress Test, Calcium Score และปรึกษาแพทย์เฉพาะทางหัวใจ",
    sourceUrl: "https://www.bangkokhospital-chiangmai.com/packages/heart-protect-360",
    validFrom: toDate("2024-04-01T00:00:00Z"),
    lastChecked: toDate("2024-10-18T00:00:00Z"),
    metrics: {
      viewCount: 214,
      compareCount: 62,
      bookmarkCount: 28,
      lastViewedAt: toDate("2024-10-19T14:25:00Z"),
      lastComparedAt: toDate("2024-10-18T07:40:00Z"),
    },
    includes: [
      { name: "EKG", groupName: "Cardio" },
      { name: "Echocardiogram", groupName: "Cardio" },
      { name: "Treadmill Stress Test", groupName: "Cardio" },
      { name: "Cardiac Enzymes", groupName: "Lab" },
      { name: "Chest CT Calcium Scoring", groupName: "Imaging" },
      { name: "Cardiologist Consultation", groupName: "Doctor" },
    ],
    histories: [
      { price: 7490, recordedAt: toDate("2024-04-01T00:00:00Z") },
      { price: 7590, recordedAt: toDate("2024-10-01T00:00:00Z") },
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
    description:
      "สำหรับผู้ที่มีปัญหานอนไม่หลับ รวบรวมการตรวจ Sleep Test, CBT-I, และการโค้ชการนอนหลับแบบส่วนตัว",
    sourceUrl: "https://www.suanprung.go.th/packages/sleep-recharge",
    validFrom: toDate("2024-05-01T00:00:00Z"),
    lastChecked: toDate("2024-10-13T00:00:00Z"),
    metrics: {
      viewCount: 102,
      compareCount: 21,
      bookmarkCount: 11,
      lastViewedAt: toDate("2024-10-15T22:15:00Z"),
      lastComparedAt: toDate("2024-10-13T12:30:00Z"),
    },
    includes: [
      { name: "Sleep Quality Assessment", groupName: "Screening" },
      { name: "Polysomnography (1 คืน)", groupName: "Diagnostics" },
      { name: "CBT-I Session", groupName: "Therapy" },
      { name: "Mindfulness Coaching", groupName: "Therapy" },
    ],
    histories: [
      { price: 3790, recordedAt: toDate("2024-05-01T00:00:00Z") },
      { price: 3990, recordedAt: toDate("2024-09-01T00:00:00Z") },
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
    description:
      "สำหรับคุณแม่ตั้งครรภ์ไตรมาสแรก ครอบคลุมตรวจเลือด คัดกรองโรคติดเชื้อ และอัลตร้าซาวด์โดยสูตินรีแพทย์",
    sourceUrl: "https://www.chiangmairam.com/packages/mom-to-be-trimester1",
    validFrom: toDate("2024-01-01T00:00:00Z"),
    lastChecked: toDate("2024-10-07T00:00:00Z"),
    metrics: {
      viewCount: 137,
      compareCount: 32,
      bookmarkCount: 16,
      lastViewedAt: toDate("2024-10-18T01:05:00Z"),
      lastComparedAt: toDate("2024-10-14T05:35:00Z"),
    },
    includes: [
      { name: "Prenatal Lab Panel", groupName: "Lab" },
      { name: "Blood Type & Rh", groupName: "Lab" },
      { name: "Rubella/Varicella Screening", groupName: "Lab" },
      { name: "Obstetric Ultrasound", groupName: "Imaging" },
      { name: "OB-GYN Consultation", groupName: "Doctor" },
      { name: "Prenatal Vitamin Set", groupName: "Wellness" },
    ],
    histories: [
      { price: 4890, recordedAt: toDate("2024-01-01T00:00:00Z"), notes: "Early bird" },
      { price: 4990, recordedAt: toDate("2024-08-01T00:00:00Z") },
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
    description:
      "มุ่งเน้นการคัดกรองมะเร็งอย่างละเอียด ทั้ง Tumor Marker, CT, MRI, PET-CT และประเมินความเสี่ยงทางพันธุกรรม",
    sourceUrl: "https://www.bangkokhospital-chiangmai.com/packages/onco-guard",
    validFrom: toDate("2024-02-01T00:00:00Z"),
    lastChecked: toDate("2024-10-17T00:00:00Z"),
    metrics: {
      viewCount: 98,
      compareCount: 24,
      bookmarkCount: 10,
      lastViewedAt: toDate("2024-10-19T10:55:00Z"),
      lastComparedAt: toDate("2024-10-17T09:25:00Z"),
    },
    includes: [
      { name: "Comprehensive Tumor Markers", groupName: "Lab" },
      { name: "Low-dose Chest CT", groupName: "Imaging" },
      { name: "Abdominal MRI", groupName: "Imaging" },
      { name: "PET-CT Screening", groupName: "Imaging" },
      { name: "Oncologist Consultation", groupName: "Doctor" },
      { name: "Genetic Risk Assessment", groupName: "Lab" },
    ],
    histories: [
      { price: 13400, recordedAt: toDate("2024-02-01T00:00:00Z"), notes: "ราคาเปิดตัว" },
      { price: 12900, recordedAt: toDate("2024-09-01T00:00:00Z"), notes: "ลดพิเศษปลายปี" },
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
    description:
      "สำหรับนักเดินทางระหว่างประเทศ มีวัคซีนที่จำเป็น ตรวจสุขภาพพื้นฐาน และคำแนะนำการป้องกันโรคในแต่ละประเทศ",
    sourceUrl: "https://www.mccormick.in.th/packages/travel-ready-asia",
    validFrom: toDate("2024-03-15T00:00:00Z"),
    lastChecked: toDate("2024-10-06T00:00:00Z"),
    metrics: {
      viewCount: 109,
      compareCount: 23,
      bookmarkCount: 11,
      lastViewedAt: toDate("2024-10-15T05:48:00Z"),
      lastComparedAt: toDate("2024-10-12T16:25:00Z"),
    },
    includes: [
      { name: "Travel Risk Consultation", groupName: "Doctor" },
      { name: "Yellow Fever Vaccine", groupName: "Vaccine" },
      { name: "Typhoid Vaccine", groupName: "Vaccine" },
      { name: "Malaria Prophylaxis Guidance", groupName: "Medication" },
      { name: "Basic Lab Panel", groupName: "Lab" },
      { name: "Fit-to-Fly Certificate", groupName: "Documentation" },
    ],
    histories: [
      { price: 2790, recordedAt: toDate("2024-03-15T00:00:00Z"), notes: "Songkran Promo" },
      { price: 2890, recordedAt: toDate("2024-10-15T00:00:00Z") },
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
    description:
      "ประเมินพัฒนาการและสมาธิเด็กแบบหลายมิติ พร้อมกิจกรรมบำบัดและโค้ชผู้ปกครองแบบใกล้ชิด",
    sourceUrl: "https://www.suanprung.go.th/packages/kids-focus",
    validFrom: toDate("2024-04-01T00:00:00Z"),
    lastChecked: toDate("2024-10-11T00:00:00Z"),
    metrics: {
      viewCount: 87,
      compareCount: 16,
      bookmarkCount: 8,
      lastViewedAt: toDate("2024-10-16T18:05:00Z"),
      lastComparedAt: toDate("2024-10-10T23:25:00Z"),
    },
    includes: [
      { name: "Developmental Screening", groupName: "Screening" },
      { name: "ADHD/ADD Assessment", groupName: "Screening" },
      { name: "Sensory Processing Profile", groupName: "Screening" },
      { name: "Occupational Therapy Session", groupName: "Therapy" },
      { name: "Parent Coaching", groupName: "Therapy" },
    ],
    histories: [
      { price: 3490, recordedAt: toDate("2024-04-01T00:00:00Z"), notes: "Summer Camp" },
      { price: 3690, recordedAt: toDate("2024-09-01T00:00:00Z") },
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
    description:
      "ดูแลตับครบวงจร ตรวจการทำงานตับ เชื้อไวรัส อัลตร้าซาวด์ และวัดความแข็งของตับ พร้อมพบแพทย์เฉพาะทาง",
    sourceUrl: "https://www.chiangmairam.com/packages/liver-care",
    validFrom: toDate("2024-05-01T00:00:00Z"),
    lastChecked: toDate("2024-10-16T00:00:00Z"),
    metrics: {
      viewCount: 205,
      compareCount: 57,
      bookmarkCount: 24,
      lastViewedAt: toDate("2024-10-19T16:10:00Z"),
      lastComparedAt: toDate("2024-10-17T02:55:00Z"),
    },
    includes: [
      { name: "Liver Function Test", groupName: "Lab" },
      { name: "Hepatitis B/C Panel", groupName: "Lab" },
      { name: "Alpha-Fetoprotein", groupName: "Lab" },
      { name: "Abdominal Ultrasound", groupName: "Imaging" },
      { name: "FibroScan", groupName: "Imaging" },
      { name: "Hepatologist Consultation", groupName: "Doctor" },
    ],
    histories: [
      { price: 4490, recordedAt: toDate("2024-05-01T00:00:00Z") },
      { price: 4590, recordedAt: toDate("2024-10-01T00:00:00Z") },
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
  const createdPackages = new Map();
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
        description: pkg.description,
        sourceUrl: pkg.sourceUrl,
        validFrom: pkg.validFrom,
        validTo: pkg.validTo ?? null,
        lastChecked: pkg.lastChecked ?? null,
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
        description: pkg.description,
        sourceUrl: pkg.sourceUrl,
        validFrom: pkg.validFrom,
        validTo: pkg.validTo ?? null,
        lastChecked: pkg.lastChecked ?? null,
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

    const metrics = pkg.metrics ?? {};
    await prisma.packageMetric.upsert({
      where: { packageId: record.id },
      update: {
        viewCount: metrics.viewCount ?? 40,
        compareCount: metrics.compareCount ?? 8,
        bookmarkCount: metrics.bookmarkCount ?? 4,
        lastViewedAt: metrics.lastViewedAt ?? new Date(),
        lastComparedAt: metrics.lastComparedAt ?? new Date(),
      },
      create: {
        packageId: record.id,
        viewCount: metrics.viewCount ?? 40,
        compareCount: metrics.compareCount ?? 8,
        bookmarkCount: metrics.bookmarkCount ?? 4,
        lastViewedAt: metrics.lastViewedAt ?? new Date(),
        lastComparedAt: metrics.lastComparedAt ?? new Date(),
      },
    }); 
    createdPackages.set(pkg.slug, record);
  }
return createdPackages;
}

async function seedUsers() {
  const created = new Map();
  for (const user of demoUsers) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    const record = await prisma.user.upsert({
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
    created.set(user.email, record);
  }
  return created;
}
async function seedUserContent(userMap, packageMap) {
  const demoUser = userMap.get("demo@healthcheck.local");
  if (!demoUser) return;

  const getPackageId = (slug) => packageMap.get(slug)?.id;
  const packageId = (slug) => {
    const id = getPackageId(slug);
    if (!id) console.warn(`Package ${slug} not found when seeding user content`);
    return id;
  };

  console.info("Seeding dashboard/bookmark/cart data for demo user...");

  await prisma.bookmark.deleteMany({ where: { userId: demoUser.id } });
  const bookmarkData = ["cmr-basic-male", "bkk-heart-protect", "cmr-liver-care"].map((slug, index) => ({
    userId: demoUser.id,
    packageId: packageId(slug),
    createdAt: new Date(Date.now() - (index + 1) * 36e5),
  }));
  await prisma.bookmark.createMany({ data: bookmarkData.filter((item) => item.packageId) });

  await prisma.savedSearch.deleteMany({ where: { userId: demoUser.id } });
  await prisma.savedSearch.createMany({
    data: [
      {
        userId: demoUser.id,
        name: "หัวใจครบวงจร",
        params: {
          priceMin: 5000,
          priceMax: 9000,
          tags: ["cardio"],
        },
        createdAt: toDate("2024-10-14T04:00:00Z"),
      },
      {
        userId: demoUser.id,
        name: "สำหรับครอบครัว",
        params: {
          hospitalIds: [packageId("bkk-family-combo") ? packageMap.get("bkk-family-combo").hospitalId : null].filter(Boolean),
          tags: ["family"],
        },
        createdAt: toDate("2024-10-12T10:30:00Z"),
      },
    ],
  });

  await prisma.searchLog.deleteMany({ where: { userId: demoUser.id } });
  await prisma.searchLog.createMany({
    data: [
      {
        userId: demoUser.id,
        filters: { q: "หัวใจ", sort: "popular" },
        results: 4,
        createdAt: toDate("2024-10-15T06:20:00Z"),
      },
      {
        userId: demoUser.id,
        filters: { priceMax: 4000, gender: "female" },
        results: 6,
        createdAt: toDate("2024-10-14T09:45:00Z"),
      },
      {
        userId: demoUser.id,
        filters: { hospitalId: packageMap.get("cmr-basic-male")?.hospitalId, sort: "updated" },
        results: 5,
        createdAt: toDate("2024-10-13T03:15:00Z"),
      },
    ],
  });

  await prisma.compareSnapshot.deleteMany({ where: { userId: demoUser.id } });
  const snapshotConfigs = [
    {
      slug: "demo-heart-vs-basic",
      packageSlugs: ["bkk-heart-protect", "cmr-basic-male"],
    },
    {
      slug: "demo-family-packages",
      packageSlugs: ["bkk-family-combo", "mcc-travel-asia", "srn-kids-focus"],
    },
  ];
  for (const snapshot of snapshotConfigs) {
    const packageIds = snapshot.packageSlugs.map(packageId).filter(Boolean);
    if (!packageIds.length) continue;
    await prisma.compareSnapshot.upsert({
      where: { slug: snapshot.slug },
      update: {
        packageIds,
        user: { connect: { id: demoUser.id } },
        expiresAt: toDate("2024-12-01T00:00:00Z"),
      },
      create: {
        slug: snapshot.slug,
        packageIds,
        user: { connect: { id: demoUser.id } },
        expiresAt: toDate("2024-12-01T00:00:00Z"),
      },
    });
  }

  await prisma.packageView.deleteMany({ where: { userId: demoUser.id } });
  const viewData = [
    {
      packageId: packageId("cmr-liver-care"),
      userId: demoUser.id,
      type: "VIEW",
      createdAt: toDate("2024-10-19T16:30:00Z"),
    },
    {
      packageId: packageId("bkk-heart-protect"),
      userId: demoUser.id,
      type: "COMPARE",
      createdAt: toDate("2024-10-18T08:10:00Z"),
    },
    {
      packageId: packageId("bkk-family-combo"),
      userId: demoUser.id,
      type: "VIEW",
      createdAt: toDate("2024-10-17T11:45:00Z"),
    },
  ].filter((item) => item.packageId);
  if (viewData.length) {
    await prisma.packageView.createMany({ data: viewData });
  }

  await prisma.notification.deleteMany({ where: { userId: demoUser.id } });
  await prisma.notification.createMany({
    data: [
      {
        userId: demoUser.id,
        type: "PRICE_DROP",
        payload: {
          packageId: packageId("bkk-heart-protect"),
          packageTitle: "Heart Protect 360",
          newPrice: 7590,
        },
        createdAt: toDate("2024-10-18T09:00:00Z"),
      },
      {
        userId: demoUser.id,
        type: "PACKAGE_APPROVED",
        payload: {
          packageId: packageId("cmr-liver-care"),
          packageTitle: "Liver Care Clinic",
        },
        createdAt: toDate("2024-10-16T02:30:00Z"),
      },
    ],
  });

  await prisma.notificationSubscription.deleteMany({ where: { userId: demoUser.id } });
  await prisma.notificationSubscription.createMany({
    data: [
      {
        userId: demoUser.id,
        packageId: packageId("cmr-liver-care"),
        type: "PRICE_DROP",
      },
      {
        userId: demoUser.id,
        packageId: packageId("bkk-heart-protect"),
        type: "PACKAGE_APPROVED",
      },
    ].filter((item) => item.packageId),
  });

  await prisma.savedCompare.deleteMany({ where: { userId: demoUser.id } });
  await prisma.savedCompare.createMany({
    data: [
      {
        userId: demoUser.id,
        packageIds: ["cmr-basic-male", "cmr-pre-employment", "mcc-diabetes-care"].map(packageId).filter(Boolean),
        note: "แพ็กเกจงานบริษัท",
      },
      {
        userId: demoUser.id,
        packageIds: ["cmr-liver-care", "bkk-onco-screen"].map(packageId).filter(Boolean),
        note: "ตรวจเฉพาะทาง",
      },
    ],
  });

  const cart = await prisma.cart.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: { userId: demoUser.id },
  });
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  await prisma.cartItem.createMany({
    data: [
      {
        cartId: cart.id,
        packageId: packageId("cmr-liver-care"),
        quantity: 1,
      },
      {
        cartId: cart.id,
        packageId: packageId("mcc-diabetes-care"),
        quantity: 1,
      },
    ].filter((item) => item.packageId),
  });
}
async function main() {
  console.info("Seeding hospitals...");
  const hospitalMap = await seedHospitals();
  console.info(`Seeded ${hospitalMap.size} hospitals`);

  console.info("Seeding packages...");
  const packageMap = await seedPackages(hospitalMap);
  console.info(`Seeded ${packageMap.size} packages with includes & histories`);

  console.info("Seeding demo users...");
  const userMap = await seedUsers();
  console.info(`Seeded ${userMap.size} demo users`);

  await seedUserContent(userMap, packageMap);
  console.info("Demo user content ready");
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
