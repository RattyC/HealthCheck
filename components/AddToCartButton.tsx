"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Check, Loader2 } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

type PromotionPayload = {
  code: string;
  label: string;
};

type Props = {
  packageId: string;
  initialInCart: boolean;
  promotion?: PromotionPayload | null;
  scheduledFor?: string | null;
  requiresSchedule?: boolean;
  requiresPromotion?: boolean;
};

export default function AddToCartButton({
  packageId,
  initialInCart,
  promotion,
  scheduledFor,
  requiresSchedule,
  requiresPromotion,
}: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const { push } = useToast();
  const [inCart, setInCart] = useState(initialInCart);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (inCart) {
      router.push("/cart");
      return;
    }
    if (!session) {
      router.push(`/auth/sign-in?callbackUrl=/packages/${packageId}`);
      return;
    }
    if (requiresPromotion && !promotion) {
      push({ title: "กรุณาเลือกโปรโมชั่นก่อนเพิ่มลงตะกร้า", variant: "info" });
      return;
    }
    if (requiresSchedule && !scheduledFor) {
      push({ title: "กรุณาเลือกวันที่ต้องการเข้ารับบริการ", variant: "info" });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/v1/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId,
          promotion: promotion ?? undefined,
          scheduledFor: scheduledFor ?? undefined,
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "ไม่สามารถเพิ่มลงตะกร้าได้");
      }
      setInCart(true);
      push({
        title: "เพิ่มแพ็กเกจลงตะกร้าแล้ว",
        description: "ตะกร้าถูกอัปเดต เริ่มขั้นตอนชำระเงินได้ทุกเมื่อ",
        variant: "success",
      });
      router.refresh();
      router.prefetch("/cart");
      router.prefetch("/checkout");
    } catch (error) {
      const message = error instanceof Error ? error.message : "ไม่สามารถเพิ่มลงตะกร้าได้";
      push({ title: message, variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-70 ${
        inCart
          ? "border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-400 dark:text-emerald-300 dark:hover:bg-emerald-400/10"
          : "border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      }`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : inCart ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
      {inCart ? "อยู่ในตะกร้า" : "เพิ่มลงตะกร้า"}
    </button>
  );
}
