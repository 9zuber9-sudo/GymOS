import Link from "next/link";
import { Dumbbell, RefreshCcw, WifiOff } from "lucide-react";
import { Logo } from "@/components/logo";

export default function OfflinePage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#09090B] p-5">
      <div className="surface w-full max-w-md p-7 text-center">
        <div className="flex justify-center"><Logo /></div>
        <div className="mx-auto mt-8 grid size-14 place-items-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-500">
          <WifiOff size={24} />
        </div>
        <h1 className="mt-5 text-2xl font-bold">You’re offline</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-500">
          If a workout was already open, return to that tab—your active sets are saved on this device. Connect once to load a new page or sync finished sessions.
        </p>
        <div className="mt-6 grid gap-2">
          <Link href="/dashboard/gymmi" className="primary-button flex h-11 items-center justify-center gap-2 text-xs"><Dumbbell size={14} /> Return to workout</Link>
          <Link href="/dashboard" className="ghost-button flex h-11 items-center justify-center gap-2 text-xs"><RefreshCcw size={14} /> Try again</Link>
        </div>
      </div>
    </main>
  );
}
