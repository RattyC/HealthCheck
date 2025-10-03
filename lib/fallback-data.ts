// Fallback dataset used when the Postgres connection is not available.
// The data mirrors the shape used on landing and listing pages so that
// the experience remains functional during development without a database.

import type { PackageSearchInput } from "@/lib/validators";

type FallbackHospital = {
  id: string;
  name: string;
  shortName: string;
  district: string;
  logoUrl: string | null;
};

type FallbackMetrics = {
  viewCount: number;
  compareCount: number;
  bookmarkCount: number;
};

export type FallbackPromotion = {
  code: string;
  label: string;
  description?: string;
  discountLabel?: string;
  eligibilityNote?: string;
  recommended?: boolean;
};

export type FallbackPackage = {
  id: string;
  slug: string;
  title: string;
  description: string;
  basePrice: number;
  priceNote?: string;
  gender: "any" | "male" | "female";
  category: string[];
  tags: string[];
  includes: string[];
  hospitalId: string;
  hospitalName: string;
  hospitalLogoUrl: string | null;
  updatedAt: Date;
  metrics: FallbackMetrics;
  promotions: FallbackPromotion[];
};

const FALLBACK_HOSPITALS: FallbackHospital[] = [
  {
    id: "cjld2cjxh0000qzrmn831i7rn",
    name: "โรงพยาบาลเชียงใหม่ราม",
    shortName: "CMR",
    district: "เมืองเชียงใหม่",
    logoUrl: "https://images.healthcheck.cm/hospitals/cmr.png",
  },
  {
    id: "cjld2cjxh0001qzrmn831i7rn",
    name: "โรงพยาบาลแมคคอร์มิค",
    shortName: "MCC",
    district: "เมืองเชียงใหม่",
    logoUrl: "https://images.healthcheck.cm/hospitals/mcc.png",
  },
  {
    id: "cjld2cjxh0002qzrmn831i7rn",
    name: "โรงพยาบาลสวนปรุง",
    shortName: "SRN",
    district: "เมืองเชียงใหม่",
    logoUrl: "https://images.healthcheck.cm/hospitals/srn.png",
  },
  {
    id: "cjld2cjxh0003qzrmn831i7rn",
    name: "โรงพยาบาลกรุงเทพเชียงใหม่",
    shortName: "BCH",
    district: "หางดง",
    logoUrl: "https://images.healthcheck.cm/hospitals/bkk.png",
  },
];

const packageDescription = {
  basicMale:
    "โปรแกรมตรวจพื้นฐานสำหรับผู้ชายวัยทำงาน ครอบคลุม CBC, น้ำตาล, ไขมัน และเอ็กซเรย์ปอด พร้อมสรุปผลโดยแพทย์อายุรกรรม",
  executiveFemale:
    "แพ็กเกจระดับผู้บริหารสำหรับผู้หญิง เพิ่มเติมการตรวจฮอร์โมน มะเร็งเต้านม มดลูก และอัลตร้าซาวด์ช่องท้อง",
  senior:
    "ออกแบบสำหรับผู้สูงอายุ ตรวจสุขภาพทั่วไป พร้อมตรวจสมอง เบาหวาน ไต หัวใจ และเวชศาสตร์ฟื้นฟู",
  mental:
    "คัดกรองภาวะซึมเศร้าและความเครียดด้วยแบบประเมินมาตรฐาน พร้อมจิตแพทย์และเวิร์กช็อปผ่อนคลาย",
  family:
    "แพ็กเกจครอบครัวรวมตรวจเลือด อัลตร้าซาวด์ วัคซีนเด็ก และตรวจฟัน ในครั้งเดียวสำหรับครอบครัว",
  heart:
    "โฟกัสการตรวจหัวใจขั้นสูงด้วย EKG, Echocardiogram, Cardiac Enzymes และคำปรึกษาเชี่ยวชาญ",
} as const;

const FALLBACK_PACKAGES: FallbackPackage[] = [
  {
    id: "demo-cmr-basic-male",
    slug: "cmr-basic-male",
    title: "Basic Health Check (ชาย)",
    description: packageDescription.basicMale,
    basePrice: 1990,
    priceNote: "รวมค่าแพทย์และค่าบริการแล้ว",
    gender: "male",
    category: ["basic"],
    tags: ["blood", "xray", "urine"],
    includes: ["CBC", "FBS", "Lipid Profile", "Chest X-ray", "Urinalysis"],
    hospitalId: FALLBACK_HOSPITALS[0].id,
    hospitalName: FALLBACK_HOSPITALS[0].name,
    hospitalLogoUrl: FALLBACK_HOSPITALS[0].logoUrl,
    updatedAt: new Date("2024-10-10T00:00:00Z"),
    metrics: { viewCount: 182, compareCount: 46, bookmarkCount: 21 },
    promotions: [
      {
        code: "CMR-WKD",
        label: "Weekend Saver",
        description: "ลด 10% เมื่อตรวจวันเสาร์-อาทิตย์",
        discountLabel: "ลด 10%",
        recommended: true,
      },
      {
        code: "CMR-CORP",
        label: "Corporate Wellness",
        description: "สำหรับพนักงานบริษัทคู่สัญญา ตรวจฟรี X-ray เพิ่มเติม",
        eligibilityNote: "แสดงบัตรพนักงานในวันตรวจ",
      },
    ],
  },
  {
    id: "demo-cmr-executive-female",
    slug: "cmr-executive-female",
    title: "Executive Premium (หญิง)",
    description: packageDescription.executiveFemale,
    basePrice: 5990,
    priceNote: "แถมตรวจ Pap Smear",
    gender: "female",
    category: ["executive"],
    tags: ["blood", "ultrasound", "heart", "gyne"],
    includes: [
      "CBC",
      "Liver Function Test",
      "Kidney Function Test",
      "Abdominal Ultrasound",
      "Chest X-ray",
      "Mammogram",
      "Pap Smear",
      "EKG",
    ],
    hospitalId: FALLBACK_HOSPITALS[0].id,
    hospitalName: FALLBACK_HOSPITALS[0].name,
    hospitalLogoUrl: FALLBACK_HOSPITALS[0].logoUrl,
    updatedAt: new Date("2024-10-15T00:00:00Z"),
    metrics: { viewCount: 146, compareCount: 38, bookmarkCount: 17 },
    promotions: [
      {
        code: "CMR-PREMIUM",
        label: "Premium Duo",
        description: "จอง 2 คนพร้อมกัน รับส่วนลดรวม 1,000 บาท",
        discountLabel: "ลด 1,000",
        recommended: true,
      },
      {
        code: "CMR-PINK",
        label: "Pink October",
        description: "บริจาค 5% ให้มูลนิธิมะเร็งเต้านม",
      },
    ],
  },
  {
    id: "demo-mcc-senior",
    slug: "mcc-senior-60",
    title: "Senior Care 60+",
    description: packageDescription.senior,
    basePrice: 3490,
    priceNote: "รวมตรวจสมรรถภาพหัวใจและสมอง",
    gender: "any",
    category: ["senior"],
    tags: ["blood", "brain", "heart"],
    includes: [
      "CBC",
      "HbA1c",
      "Kidney Function Test",
      "Chest X-ray",
      "Bone Density",
      "EKG",
      "Carotid Ultrasound",
    ],
    hospitalId: FALLBACK_HOSPITALS[1].id,
    hospitalName: FALLBACK_HOSPITALS[1].name,
    hospitalLogoUrl: FALLBACK_HOSPITALS[1].logoUrl,
    updatedAt: new Date("2024-10-05T00:00:00Z"),
    metrics: { viewCount: 128, compareCount: 29, bookmarkCount: 12 },
    promotions: [
      {
        code: "MCC-SENIOR",
        label: "Senior Week",
        description: "ผู้สูงอายุ 60+ ลดพิเศษ 500 บาท",
        discountLabel: "ลด 500",
        recommended: true,
      },
      {
        code: "MCC-CARE",
        label: "Caregiver Bonus",
        description: "ผู้ดูแลร่วมตรวจ Vital Sign ฟรี",
      },
    ],
  },
  {
    id: "demo-srn-mental",
    slug: "srn-mental-wellness",
    title: "Mental Wellness Assessment",
    description: packageDescription.mental,
    basePrice: 2590,
    priceNote: "ปรึกษาจิตแพทย์ 1 ครั้ง",
    gender: "any",
    category: ["mental"],
    tags: ["mental", "counseling"],
    includes: [
      "แบบประเมินภาวะซึมเศร้า",
      "แบบประเมินความเครียด",
      "จิตบำบัดรายบุคคล",
      "เทคนิคผ่อนคลาย",
    ],
    hospitalId: FALLBACK_HOSPITALS[2].id,
    hospitalName: FALLBACK_HOSPITALS[2].name,
    hospitalLogoUrl: FALLBACK_HOSPITALS[2].logoUrl,
    updatedAt: new Date("2024-10-08T00:00:00Z"),
    metrics: { viewCount: 94, compareCount: 18, bookmarkCount: 9 },
    promotions: [
      {
        code: "SRN-MIND",
        label: "Mindful Monday",
        description: "รับส่วนลด 15% เมื่อจองวันจันทร์",
        discountLabel: "ลด 15%",
        recommended: true,
      },
      {
        code: "SRN-TEAM",
        label: "Group Therapy",
        description: "จอง 3 คนขึ้นไป ฟรีเวิร์กช็อปเสริม",
      },
    ],
  },
  {
    id: "demo-bkk-family",
    slug: "bkk-family-shield",
    title: "Family Shield Combo",
    description: packageDescription.family,
    basePrice: 8990,
    priceNote: "ตรวจ 2 ผู้ใหญ่ + 1 เด็ก",
    gender: "any",
    category: ["family", "premium"],
    tags: ["family", "pediatric", "cardio"],
    includes: [
      "CBC",
      "Lipid Profile",
      "Abdominal Ultrasound",
      "Dental Screening",
      "Child Vaccine",
      "EKG",
      "Vision Screening",
    ],
    hospitalId: FALLBACK_HOSPITALS[3].id,
    hospitalName: FALLBACK_HOSPITALS[3].name,
    hospitalLogoUrl: FALLBACK_HOSPITALS[3].logoUrl,
    updatedAt: new Date("2024-10-12T00:00:00Z"),
    metrics: { viewCount: 167, compareCount: 41, bookmarkCount: 19 },
    promotions: [
      {
        code: "BKK-FAMILY",
        label: "Family Day",
        description: "เด็กอายุไม่เกิน 12 ปี ตรวจฟรี 1 คน",
        recommended: true,
      },
      {
        code: "BKK-SPLIT",
        label: "0% Installment",
        description: "ผ่อน 0% สูงสุด 6 เดือนทุกบัตร",
      },
    ],
  },
  {
    id: "demo-bkk-heart",
    slug: "bkk-heart-elite",
    title: "Heart Elite Screening",
    description: packageDescription.heart,
    basePrice: 12900,
    priceNote: "พร้อมคำปรึกษาจากแพทย์เฉพาะทางหัวใจ",
    gender: "any",
    category: ["premium", "cardio"],
    tags: ["heart", "executive"],
    includes: [
      "CBC",
      "Cardiac Enzymes",
      "Echocardiogram",
      "Exercise Stress Test",
      "EKG",
      "Coronary Calcium Score",
    ],
    hospitalId: FALLBACK_HOSPITALS[3].id,
    hospitalName: FALLBACK_HOSPITALS[3].name,
    hospitalLogoUrl: FALLBACK_HOSPITALS[3].logoUrl,
    updatedAt: new Date("2024-10-18T00:00:00Z"),
    metrics: { viewCount: 98, compareCount: 25, bookmarkCount: 14 },
    promotions: [
      {
        code: "BKK-CARDIO",
        label: "Cardio VIP",
        description: "รับสิทธิ์ปรึกษาแพทย์หัวใจแบบ Fast Track",
        recommended: true,
      },
      {
        code: "BKK-FIT",
        label: "Fitness Partner",
        description: "จับคู่กับโค้ชฟิตเนสครบ 3 เดือน",
      },
    ],
  },
];

function matchTokens(haystack: string, tokens: string[]) {
  if (tokens.length === 0) return true;
  const normalized = haystack.toLowerCase();
  return tokens.every((token) => normalized.includes(token));
}

export function getFallbackHospitals() {
  return FALLBACK_HOSPITALS.slice();
}

export function getFallbackHospitalSummaries() {
  return FALLBACK_HOSPITALS.map((hospital) => {
    const packageCount = FALLBACK_PACKAGES.filter((pkg) => pkg.hospitalId === hospital.id).length;
    return { ...hospital, packageCount };
  });
}

export function getFallbackPackages() {
  return FALLBACK_PACKAGES.slice();
}

export function getFallbackPromotions(packageId: string) {
  const target = FALLBACK_PACKAGES.find((pkg) => pkg.id === packageId || pkg.slug === packageId);
  return target?.promotions ?? [];
}

export function filterFallbackPackages(input: PackageSearchInput) {
  const tokens = input.q?.toLowerCase().split(/\s+/).filter(Boolean) ?? [];

  const filtered = FALLBACK_PACKAGES.filter((pkg) => {
    if (input.hospitalId && pkg.hospitalId !== input.hospitalId) return false;
    if (input.minPrice !== undefined && pkg.basePrice < input.minPrice) return false;
    if (input.maxPrice !== undefined && pkg.basePrice > input.maxPrice) return false;
    if (input.gender && input.gender !== "any" && pkg.gender !== "any" && pkg.gender !== input.gender) return false;
    if (input.category && !pkg.category.includes(input.category)) return false;
    if (tokens.length) {
      const haystack = [
        pkg.title,
        pkg.description,
        pkg.hospitalName,
        pkg.tags.join(" "),
        pkg.includes.join(" "),
      ].join(" ");
      if (!matchTokens(haystack, tokens)) return false;
    }
    return true;
  });

  const sorted = filtered.sort((a, b) => {
    switch (input.sort) {
      case "priceDesc":
        return b.basePrice - a.basePrice;
      case "updated":
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      case "priceAsc":
      default:
        return a.basePrice - b.basePrice;
    }
  });

  return sorted;
}

export function getTopFallbackPackages(limit = 6) {
  return FALLBACK_PACKAGES.slice()
    .sort((a, b) => {
      if (b.metrics.viewCount === a.metrics.viewCount) {
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      }
      return b.metrics.viewCount - a.metrics.viewCount;
    })
    .slice(0, limit);
}
