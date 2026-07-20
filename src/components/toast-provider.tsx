"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  CircleAlert,
  Info,
  X,
} from "lucide-react";
import { cn, uid } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";

type ToastPayload = {
  title: string;
  description?: string;
  tone?: ToastTone;
};

type ToastItem = ToastPayload & {
  id: string;
  tone: ToastTone;
};

const TOAST_EVENT = "gymos:toast";

export function showToast(payload: ToastPayload) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ToastPayload>(TOAST_EVENT, { detail: payload }),
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    function receive(event: Event) {
      const payload = (event as CustomEvent<ToastPayload>).detail;
      const id = uid();
      setToasts((current) => [
        ...current.slice(-2),
        { ...payload, id, tone: payload.tone || "success" },
      ]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, 4200);
    }

    window.addEventListener(TOAST_EVENT, receive);
    return () => window.removeEventListener(TOAST_EVENT, receive);
  }, []);

  function dismiss(id: string) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  return (
    <>
      {children}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 sm:right-6 sm:top-6"
      >
        {toasts.map((toast) => {
          const Icon =
            toast.tone === "success"
              ? CheckCircle2
              : toast.tone === "error"
                ? CircleAlert
                : Info;
          return (
            <div
              key={toast.id}
              className="pointer-events-auto relative overflow-hidden rounded-2xl border border-[#27272A] bg-[#18181B] p-4 shadow-[0_24px_70px_rgba(0,0,0,.55)] [animation:toast-in_.28s_ease-out_both]"
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl border",
                    toast.tone === "success" &&
                      "border-green-500/25 bg-green-500/10 text-green-400",
                    toast.tone === "error" &&
                      "border-red-500/25 bg-red-500/10 text-red-400",
                    toast.tone === "info" &&
                      "border-orange-500/25 bg-orange-500/10 text-[#F97316]",
                  )}
                >
                  <Icon size={17} strokeWidth={2.2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white">
                    {toast.title}
                  </div>
                  {toast.description && (
                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      {toast.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => dismiss(toast.id)}
                  aria-label="Dismiss notification"
                  className="grid size-7 shrink-0 place-items-center rounded-lg text-zinc-600 transition hover:bg-zinc-800 hover:text-white"
                >
                  <X size={13} />
                </button>
              </div>
              <div
                className={cn(
                  "absolute bottom-0 left-0 h-0.5 w-full origin-left [animation:toast-life_4.2s_linear_forwards]",
                  toast.tone === "success" && "bg-green-500",
                  toast.tone === "error" && "bg-red-500",
                  toast.tone === "info" && "bg-[#F97316]",
                )}
              />
            </div>
          );
        })}
      </div>
    </>
  );
}
