"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Download, Smartphone } from "lucide-react";
import { showToast } from "./toast-provider";

export function PwaInstallCard() {
  const [ready, setReady] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const initial = window.setTimeout(() => {
      setInstalled(window.matchMedia("(display-mode: standalone)").matches);
      setReady(Boolean(window.gymosInstallPrompt));
    }, 0);
    const readyHandler = () => setReady(true);
    const installedHandler = () => {
      setInstalled(true);
      setReady(false);
    };
    window.addEventListener("gymos:install-ready", readyHandler);
    window.addEventListener("appinstalled", installedHandler);
    return () => {
      window.clearTimeout(initial);
      window.removeEventListener("gymos:install-ready", readyHandler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  async function install() {
    const prompt = window.gymosInstallPrompt;
    if (!prompt) {
      showToast({
        title: window.isSecureContext ? "Use browser install menu" : "HTTPS required",
        description: window.isSecureContext
          ? "In Chrome, open the menu and choose Install app or Add to Home screen."
          : "Installation becomes available after GymOS is deployed with HTTPS.",
        tone: "info",
      });
      return;
    }
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") {
      setInstalled(true);
      setReady(false);
    }
    window.gymosInstallPrompt = undefined;
  }

  return (
    <section className="surface p-5">
      <div className="flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-xl bg-orange-500/10 text-orange-500">
          <Smartphone size={18} />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Install GymOS</h2>
          <p className="mt-1 text-[11px] text-zinc-600">
            Full-screen app experience with resilient active-workout autosave.
          </p>
        </div>
      </div>
      <button
        onClick={install}
        disabled={installed}
        className="ghost-button mt-5 flex h-10 items-center gap-2 px-4 text-xs disabled:opacity-60"
      >
        {installed ? <CheckCircle2 size={14} className="text-green-400" /> : <Download size={14} />}
        {installed ? "GymOS is installed" : ready ? "Install app" : "Installation help"}
      </button>
    </section>
  );
}
