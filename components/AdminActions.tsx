"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import type { PackageStatus } from "@prisma/client";
import { useToast } from "@/components/ToastProvider";

type Action = "approve" | "reject" | "archive";

const SUCCESS_LABEL: Record<Action, string> = {
  approve: "อนุมัติแพ็กเกจแล้ว",
  reject: "ส่งกลับเป็น Draft แล้ว",
  archive: "เก็บแพ็กเกจเข้าคลังแล้ว",
};

const ACTION_CONFIG: Record<
  Action,
  {
    title: string;
    description: string;
    confirmLabel: string;
    requireReason: boolean;
    placeholder: string;
  }
> = {
  approve: {
    title: "ยืนยันการอนุมัติ",
    description: "แพ็กเกจจะเผยแพร่ให้ผู้ใช้เห็นทันที ตรวจสอบราคาและรายละเอียดให้ครบก่อนอนุมัติ",
    confirmLabel: "อนุมัติทันที",
    requireReason: false,
    placeholder: "หมายเหตุเพิ่มเติม (ถ้ามี)",
  },
  reject: {
    title: "ส่งกลับให้แก้ไข",
    description: "ระบุเหตุผลสั้น ๆ เพื่อให้ทีมเนื้อหาแก้ไขได้ถูกต้อง",
    confirmLabel: "ส่งกลับ",
    requireReason: true,
    placeholder: "ระบุสิ่งที่ต้องแก้ เช่น ราคาไม่ตรง เอกสารอ้างอิงไม่ครบ...",
  },
  archive: {
    title: "เก็บเข้าคลัง",
    description: "แพ็กเกจจะถูกซ่อนจากผู้ใช้ แต่ยังดูย้อนหลังได้ในระบบหลังบ้าน",
    confirmLabel: "เก็บเข้าคลัง",
    requireReason: true,
    placeholder: "แจ้งเหตุผล เช่น โปรโมชันหมดอายุ หรือรอข้อมูลเพิ่มเติม",
  },
};

const BUTTON_STYLE: Record<Action, string> = {
  approve:
    "border border-emerald-500/70 px-2 py-1 text-xs text-emerald-700 transition hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-400/70 dark:text-emerald-300 dark:hover:bg-emerald-400/10",
  reject:
    "border border-amber-500/70 px-2 py-1 text-xs text-amber-700 transition hover:bg-amber-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-400/70 dark:text-amber-300 dark:hover:bg-amber-400/10",
  archive:
    "border border-slate-300 px-2 py-1 text-xs text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800",
};

export default function AdminActions({
  id,
  status,
  disabled,
}: {
  id: string;
  status: PackageStatus;
  disabled?: boolean;
}) {
  const [pending, start] = useTransition();
  const [activeAction, setActiveAction] = useState<Action | null>(null);
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();
  const { push } = useToast();

  const eligibility = useMemo(
    () => ({
      approve: status === "DRAFT",
      reject: status === "APPROVED",
      archive: status !== "ARCHIVED",
    }),
    [status]
  );

  async function call(action: Action, note?: string) {
    try {
      const res = await fetch(`/api/v1/admin/packages/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action, reason: note && note.trim().length ? note.trim() : undefined }),
      });
      if (!res.ok) {
        const raw = await res.text();
        let message = raw || "ไม่สามารถอัปเดตสถานะได้";
        try {
          const parsed = JSON.parse(raw);
          message = parsed?.error ?? message;
        } catch {}
        throw new Error(message);
      }
      push({ title: SUCCESS_LABEL[action], variant: "success" });
      router.refresh();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "ลองใหม่อีกครั้ง";
      push({
        title: "อัปเดตสถานะไม่สำเร็จ",
        description: message,
        variant: "error",
      });
    }
  }

  function openDialog(action: Action) {
    setReason("");
    setFormError(null);
    setActiveAction(action);
  }

  const dialogConfig = activeAction ? ACTION_CONFIG[activeAction] : null;
  const trimmedReason = reason.trim();

  function handleConfirm() {
    if (!activeAction) return;
    if (dialogConfig?.requireReason && trimmedReason.length < 3) {
      setFormError("กรุณาระบุเหตุผลอย่างน้อย 3 ตัวอักษร");
      return;
    }
    setFormError(null);
    start(async () => {
      await call(activeAction, trimmedReason);
      setActiveAction(null);
      setReason("");
    });
  }

  return (
    <div className="flex items-center gap-1">
      {(["approve", "reject", "archive"] as Action[]).map((action) => {
        const buttonDisabled = pending || disabled || eligibility[action] === false;
        const label = action.charAt(0).toUpperCase() + action.slice(1);
        const requiresDialog = action !== "approve";

        return (
          <button
            key={action}
            type="button"
            disabled={buttonDisabled}
            onClick={() => {
              if (requiresDialog) {
                openDialog(action);
              } else {
                start(async () => {
                  await call(action);
                });
              }
            }}
            className={`rounded ${BUTTON_STYLE[action]}`}
          >
            {label}
          </button>
        );
      })}

      <Dialog.Root open={Boolean(activeAction)} onOpenChange={(open) => (!open ? setActiveAction(null) : null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm" />
          <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <Dialog.Title className="text-lg font-semibold text-slate-900 dark:text-white">
                {dialogConfig?.title}
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {dialogConfig?.description}
              </Dialog.Description>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder={dialogConfig?.placeholder}
                rows={4}
                className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
              />
              {formError ? <p className="mt-2 text-xs text-rose-500">{formError}</p> : null}
              <div className="mt-5 flex justify-end gap-2 text-sm">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    disabled={pending}
                    className="rounded-full border border-slate-300 px-4 py-2 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    ยกเลิก
                  </button>
                </Dialog.Close>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={pending}
                  className="rounded-full bg-brand px-4 py-2 font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pending ? "กำลังบันทึก..." : dialogConfig?.confirmLabel ?? "ยืนยัน"}
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
