"use client";

import Link from "next/link";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Logo } from "./logo";

export function AuthShell({
  children,
  title,
  subtitle,
  footer,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  footer: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#09090b] lg:grid lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden min-h-screen overflow-hidden border-r border-[#27272a] bg-[#101012] p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="display-font absolute -right-10 top-4 text-[19rem] leading-none text-white/[0.025]">45</div>
          <div className="display-font absolute -left-12 top-[36%] text-[17rem] leading-none text-white/[0.02]">25</div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_90%,rgba(249,115,22,.15),transparent_32%)]" />
        </div>
        <div className="relative">
          <Logo />
        </div>
        <div className="relative max-w-xl">
          <div className="eyebrow mb-5 text-orange-500">Your training operating system</div>
          <h2 className="text-5xl font-bold leading-[1.04] tracking-[-0.055em]">
            Less logging.
            <br />
            <span className="text-zinc-500">More lifting.</span>
          </h2>
          <p className="mt-6 max-w-md text-base leading-7 text-zinc-500">
            Plan with Gymmi, track every set, and see your progress without turning fitness into admin work.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            {["AI-built sessions", "Real progress data", "Your routines, saved"].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-xs text-zinc-400"
              >
                <CheckCircle2 size={14} className="text-orange-500" />
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="relative grid grid-cols-3 border-t border-zinc-800/80 pt-7">
          {[
            ["12", "WEEK STREAK"],
            ["48", "SESSIONS"],
            ["92%", "PLAN COMPLETE"],
          ].map(([value, label]) => (
            <div key={label}>
              <div className="mono-font text-xl font-semibold text-zinc-200">{value}</div>
              <div className="mono-font mt-1 text-[9px] tracking-[0.12em] text-zinc-600">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>
          <div className="mb-8">
            <div className="eyebrow mb-3 text-orange-500">Welcome to GymOS</div>
            <h1 className="text-3xl font-bold tracking-[-0.04em]">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-500">{subtitle}</p>
          </div>
          {children}
          <div className="mt-8 text-center text-sm text-zinc-500">{footer}</div>
          <Link
            href="/dashboard"
            className="mt-5 flex items-center justify-center gap-1.5 text-xs text-zinc-600 transition hover:text-zinc-400"
          >
            Preview with demo data <ArrowUpRight size={13} />
          </Link>
        </div>
      </section>
    </main>
  );
}
