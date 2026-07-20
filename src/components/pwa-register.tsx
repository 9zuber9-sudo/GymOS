"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { getTrainingSystem } from "@/lib/training-system";

export type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    gymosInstallPrompt?: InstallPromptEvent;
  }
}

export function PwaRegister() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const initialStatus = window.setTimeout(() => setOnline(navigator.onLine), 0);
    const onlineHandler = () => setOnline(true);
    const offlineHandler = () => setOnline(false);
    const installHandler = (event: Event) => {
      event.preventDefault();
      window.gymosInstallPrompt = event as InstallPromptEvent;
      window.dispatchEvent(new Event("gymos:install-ready"));
    };

    window.addEventListener("online", onlineHandler);
    window.addEventListener("offline", offlineHandler);
    window.addEventListener("beforeinstallprompt", installHandler);

    if ("serviceWorker" in navigator && window.isSecureContext) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    async function checkReminder() {
      if (
        !window.isSecureContext ||
        !("Notification" in window) ||
        Notification.permission !== "granted"
      ) {
        return;
      }
      try {
        const system = await getTrainingSystem();
        if (!system.remindersEnabled) return;
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const today = now.toISOString().slice(0, 10);
        for (const item of system.schedule.filter(
          (entry) => entry.enabled && entry.weekday === now.getDay(),
        )) {
          const [hours, minutes] = item.time.split(":").map(Number);
          const scheduled = hours * 60 + minutes;
          const key = `gymos-reminder-${today}-${item.id}`;
          if (
            currentMinutes >= scheduled - 30 &&
            currentMinutes <= scheduled + 15 &&
            !window.localStorage.getItem(key)
          ) {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification(`GymOS · ${item.title}`, {
              body: "Your planned session is coming up. Open GymOS when you are ready.",
              icon: "/icon.svg",
              tag: key,
            });
            window.localStorage.setItem(key, "sent");
          }
        }
      } catch {
        // Reminder checks are optional and must never interrupt the app.
      }
    }

    checkReminder();
    const reminderTimer = window.setInterval(checkReminder, 60_000);
    return () => {
      window.clearTimeout(initialStatus);
      window.removeEventListener("online", onlineHandler);
      window.removeEventListener("offline", offlineHandler);
      window.removeEventListener("beforeinstallprompt", installHandler);
      window.clearInterval(reminderTimer);
    };
  }, []);

  if (online) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-[110] flex items-center justify-center gap-2 bg-orange-500 px-3 py-2 text-[10px] font-bold text-black">
      <WifiOff size={13} /> OFFLINE — ACTIVE WORKOUT CHANGES STAY ON THIS DEVICE
    </div>
  );
}
