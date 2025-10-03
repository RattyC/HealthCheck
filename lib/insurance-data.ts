export type InsuranceBundle = {
  id: string;
  name: string;
  price: number;
  coverage: string;
  partner: string;
  highlight: string;
  idealFor: string;
  responseTimeHours: number;
  perks: string[];
  qualifyingPackages: Array<{ slug: string; label: string }>;
};

const INSURANCE_BUNDLES: InsuranceBundle[] = [
  {
    id: "health-protect",
    name: "Health Protect Plus",
    price: 890,
    coverage: "คุ้มครองค่ารักษาพยาบาล 200,000 บาท/ปี + ตรวจสุขภาพประจำปี",
    partner: "Allianz Ayudhya",
    highlight: "ลด 10% เมื่อซื้อคู่กับแพ็กเกจ Premium Checkup",
    idealFor: "พนักงานวัยทำงานที่ต้องการความคุ้มครอง OPD/IPD พร้อมตรวจสุขภาพทุกปี",
    responseTimeHours: 24,
    perks: [
      "มีผู้ช่วยเคลม 24 ชั่วโมงผ่าน LINE OA",
      "วิเคราะห์ผลตรวจโดยแพทย์เวชศาสตร์ครอบครัว",
      "ได้รับคูปองตรวจเลือดเพิ่มเติมฟรี 1 รายการ",
    ],
    qualifyingPackages: [
      { slug: "cmr-executive-female", label: "Executive Premium (หญิง) - CMR" },
      { slug: "bkk-heart-elite", label: "Heart Elite Screening - BCH" },
    ],
  },
  {
    id: "senior-care",
    name: "Senior Care Combo",
    price: 1290,
    coverage: "ประกันอุบัติเหตุ + ตรวจสุขภาพผู้สูงอายุ (เฉพาะ 55+)",
    partner: "เมืองไทยประกันภัย",
    highlight: "แนะนำสำหรับครอบครัวดูแลผู้สูงวัย",
    idealFor: "ผู้ดูแลและครอบครัวที่ต้องการติดตามสุขภาพผู้สูงอายุแบบใกล้ชิด",
    responseTimeHours: 12,
    perks: [
      "บริการรับ-ส่งถึงบ้านในเขตตัวเมือง",
      "โทรติดตามอาการภายใน 48 ชั่วโมงหลังตรวจ",
      "สิทธิ์เบิกค่ารักษาอุบัติเหตุสูงสุด 300,000 บาท",
    ],
    qualifyingPackages: [
      { slug: "mcc-senior-60", label: "Senior Care 60+ - MCC" },
      { slug: "cmr-basic-male", label: "Basic Health Check (ชาย) - CMR" },
    ],
  },
  {
    id: "family-shield",
    name: "Family Shield Plan",
    price: 1590,
    coverage: "ตรวจสุขภาพผู้ปกครอง + คุ้มครองลูกเล็กจากอุบัติเหตุ",
    partner: "AXA",
    highlight: "แบ่งจ่าย 0% 6 เดือน 💳",
    idealFor: "ครอบครัวที่ต้องการดูแลทุกคนในบ้านด้วยแพ็กเกจเดียว",
    responseTimeHours: 6,
    perks: [
      "ช่องทางด่วนแจ้งเคลมสำหรับเด็ก",
      "เจ้าหน้าที่ช่วยประสานโรงพยาบาล 7 วัน/สัปดาห์",
      "ฟรีคูปองวัคซีนไข้หวัดใหญ่สำหรับเด็ก 1 เข็ม",
    ],
    qualifyingPackages: [
      { slug: "bkk-family-shield", label: "Family Shield Combo - BCH" },
      { slug: "srn-mental-wellness", label: "Mental Wellness Assessment - SRN" },
    ],
  },
];

export function getInsuranceBundles() {
  return INSURANCE_BUNDLES.slice();
}

export function findInsuranceBundle(id: string) {
  return INSURANCE_BUNDLES.find((bundle) => bundle.id === id) ?? null;
}
