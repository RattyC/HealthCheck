import { PaymentStatus } from "@prisma/client";

export type PaymentInstruction = {
  method: string;
  status: PaymentStatus;
  amount: number;
  reference: string;
  expiresAt: string;
  note: string;
};

export function buildPaymentInstructions(method: string, status: PaymentStatus, amount: number, reference: string): PaymentInstruction {
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  switch (method) {
    case "bank_transfer":
      return {
        method,
        status,
        amount,
        reference,
        expiresAt,
        note: "โอนเข้าบัญชีธนาคารกรุงเทพ 123-456789-0 พร้อมระบุรหัสอ้างอิง และอัปโหลดหลักฐานให้เจ้าหน้าที่",
      } satisfies PaymentInstruction;
    case "credit_card":
      return {
        method,
        status,
        amount,
        reference,
        expiresAt,
        note: "ทีมงานจะส่งลิงก์ชำระเงินผ่านบัตรเครดิตให้ภายใน 1 ชั่วโมง",
      } satisfies PaymentInstruction;
    case "cash":
      return {
        method,
        status,
        amount,
        reference,
        expiresAt,
        note: "ชำระเงินสดที่จุดบริการในวันตรวจสุขภาพ โดยแจ้งรหัสอ้างอิงนี้ที่เคาน์เตอร์",
      } satisfies PaymentInstruction;
    case "promptpay":
    default:
      return {
        method: "promptpay",
        status,
        amount,
        reference,
        expiresAt,
        note: "สแกน PromptPay หมายเลข 089-xxx-xxxx ระบุรหัสอ้างอิงลงในสลิป และส่งหลักฐานให้ทีมดูแล",
      } satisfies PaymentInstruction;
  }
}
