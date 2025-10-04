import { PaymentStatus } from "@prisma/client";

export type PaymentMethod = "promptpay" | "bank_transfer" | "credit_card" | "cash";

export type PaymentInstruction = {
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  reference: string;
  expiresAt: string;
  note: string;
};

type PaymentGuide = {
  label: string;
  summary: string;
  highlight?: string;
  steps: string[];
};

const PAYMENT_META: Record<PaymentMethod, PaymentGuide> = {
  promptpay: {
    label: "PromptPay",
    summary: "ชำระรวดเร็วผ่าน QR พร้อมเพย์พร้อมยืนยันในไม่กี่นาที",
    highlight: "แนะนำสำหรับการจองที่ต้องการยืนยันทันที",
    steps: [
      "สแกน QR PromptPay 089-XXX-XXXX",
      "ระบุรหัสอ้างอิงคำสั่งซื้อในช่องหมายเหตุ",
      "ส่งสลิปให้เจ้าหน้าที่ผ่านไลน์หรืออีเมล",
    ],
  },
  bank_transfer: {
    label: "โอนผ่านธนาคาร",
    summary: "รองรับทุกธนาคาร ใช้เวลาตรวจสอบหลักฐานไม่เกิน 1 ชั่วโมง",
    steps: [
      "โอนเข้าบัญชีธนาคารกรุงเทพ 123-456789-0 ชื่อบัญชี HealthCheck Chiang Mai",
      "ระบุรหัสอ้างอิงในหลักฐานการโอน",
      "อัปโหลดสลิปผ่านแดชบอร์ดหรือส่งให้เจ้าหน้าที่",
    ],
  },
  credit_card: {
    label: "บัตรเครดิต",
    summary: "ชำระผ่านลิงก์ที่ทีมงานส่งให้ ปลอดภัยและสามารถผ่อนชำระได้",
    steps: [
      "ทีมงานจะส่งลิงก์ชำระเงินผ่านอีเมล/ไลน์",
      "กรอกข้อมูลบัตรในหน้าชำระเงินที่ปลอดภัย",
      "รับอีเมลยืนยันเมื่อการชำระเรียบร้อย",
    ],
  },
  cash: {
    label: "ชำระเงินสดหน้าร้าน",
    summary: "จ่ายในวันที่รับบริการ เหมาะสำหรับผู้ที่ต้องการดูผลก่อนตัดสินใจ",
    steps: [
      "แจ้งรหัสอ้างอิงคำสั่งซื้อที่เคาน์เตอร์โรงพยาบาล",
      "ชำระเงินสดกับเจ้าหน้าที่",
      "รับใบเสร็จและยืนยันสิทธิ์ก่อนตรวจ",
    ],
  },
};

export function listPaymentOptions() {
  return Object.entries(PAYMENT_META).map(([value, meta]) => ({
    value: value as PaymentMethod,
    label: meta.label,
    summary: meta.summary,
    highlight: meta.highlight,
  }));
}

export function getPaymentGuide(method: PaymentMethod): PaymentGuide {
  return PAYMENT_META[method];
}

export function resolvePaymentMethod(method: string | null | undefined): PaymentMethod {
  if (!method) return "promptpay";
  return (Object.prototype.hasOwnProperty.call(PAYMENT_META, method) ? method : "promptpay") as PaymentMethod;
}

export function buildPaymentInstructions(method: PaymentMethod, status: PaymentStatus, amount: number, reference: string): PaymentInstruction {
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const resolvedMethod: PaymentMethod = method ?? "promptpay";
  let note = "";
  switch (resolvedMethod) {
    case "bank_transfer":
      note = "โอนเข้าบัญชีธนาคารกรุงเทพ 123-456789-0 พร้อมระบุรหัสอ้างอิง และอัปโหลดหลักฐานให้เจ้าหน้าที่";
      break;
    case "credit_card":
      note = "ทีมงานจะส่งลิงก์ชำระเงินผ่านบัตรเครดิตให้ภายใน 1 ชั่วโมง";
      break;
    case "cash":
      note = "ชำระเงินสดที่จุดบริการในวันตรวจสุขภาพ โดยแจ้งรหัสอ้างอิงนี้ที่เคาน์เตอร์";
      break;
    case "promptpay":
    default:
      note = "สแกน PromptPay หมายเลข 089-xxx-xxxx ระบุรหัสอ้างอิงลงในสลิป และส่งหลักฐานให้ทีมดูแล";
      break;
  }

  return {
    method: resolvedMethod,
    status,
    amount,
    reference,
    expiresAt,
    note,
  } satisfies PaymentInstruction;
}
