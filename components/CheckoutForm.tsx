"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

type CheckoutFormProps = {
  defaultFullName: string;
  defaultEmail: string;
  defaultPhone?: string | null;
};

const paymentOptions = [
  { value: "promptpay", label: "PromptPay" },
  { value: "bank_transfer", label: "โอนผ่านธนาคาร" },
  { value: "credit_card", label: "บัตรเครดิต" },
  { value: "cash", label: "ชำระเงินสดหน้าร้าน" },
];

export default function CheckoutForm({ defaultFullName, defaultEmail, defaultPhone }: CheckoutFormProps) {
  const router = useRouter();
  const { push } = useToast();
  const [fullName, setFullName] = useState(defaultFullName);
  const [email, setEmail] = useState(defaultEmail);
  const [phone, setPhone] = useState(defaultPhone ?? "");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>(paymentOptions[0].value);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/v1/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone, notes, paymentMethod }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "ไม่สามารถยืนยันคำสั่งซื้อได้");
      }

      const payload = await response.json();
      const orderId = payload?.order?.id as string | undefined;
      const referenceCode = payload?.order?.referenceCode as string | undefined;
      push({ title: "สร้างคำสั่งซื้อเรียบร้อย", variant: "success" });
      router.refresh();
      if (orderId) {
        const params = new URLSearchParams({ orderId });
        if (referenceCode) params.set("ref", referenceCode);
        params.set("method", paymentMethod);
        router.push(`/checkout/success?${params.toString()}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "ไม่สามารถยืนยันคำสั่งซื้อได้";
      push({ title: message, variant: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">ชื่อ-นามสกุล</span>
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">อีเมลสำหรับติดต่อ</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">เบอร์โทรศัพท์</span>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="080-000-0000"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">ช่องทางชำระเงิน</span>
          <select
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            {paymentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-200">รายละเอียดเพิ่มเติม (ถ้ามี)</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={4}
          placeholder="แจ้งช่วงเวลาที่สะดวกหรือแพ็กเกจประกันเสริมที่สนใจ"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        ยืนยันคำสั่งซื้อและรับคำแนะนำ
      </button>
    </form>
  );
}
