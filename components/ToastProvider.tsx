"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  push: (toast: { title: string; description?: string; variant?: ToastVariant }) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: "border-emerald-300/60 bg-emerald-500/10 text-emerald-200",
  error: "border-rose-300/60 bg-rose-500/10 text-rose-200",
  info: "border-slate-300/60 bg-slate-800/60 text-slate-100",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    ({ title, description, variant = "info" }: { title: string; description?: string; variant?: ToastVariant }) => {
      const id =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, title, description, variant }]);
      (typeof window !== "undefined" ? window.setTimeout : setTimeout)(() => remove(id), 4200);
    },
    [remove]
  );

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-5 z-50 flex justify-center px-4">
        <div className="flex w-full max-w-sm flex-col gap-3">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-lg border px-4 py-3 shadow-lg backdrop-blur dark:bg-slate-900/80 ${VARIANT_STYLES[toast.variant]}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">{toast.title}</div>
                  {toast.description && <div className="mt-1 text-xs opacity-90">{toast.description}</div>}
                </div>
                <button
                  type="button"
                  onClick={() => remove(toast.id)}
                  className="-mr-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200/40 text-xs text-slate-200 transition hover:bg-white/10"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
