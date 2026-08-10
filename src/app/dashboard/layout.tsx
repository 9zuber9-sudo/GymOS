"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Apple,
  Bot,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronRight,
  Dumbbell,
  FileText,
  Home,
  LoaderCircle,
  LogOut,
  Menu,
  Settings,
  Trophy,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { showToast } from "@/components/toast-provider";
import { hasSupabase, supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/plan", label: "Plan", icon: CalendarDays },
  { href: "/dashboard/gymmi", label: "Gymmi", icon: Bot },
  { href: "/dashboard/notes", label: "Notes", icon: FileText },
  { href: "/dashboard/progress", label: "Progress", icon: ChartNoAxesCombined },
  { href: "/dashboard/workouts", label: "Workouts", icon: Dumbbell },
  { href: "/dashboard/exercises", label: "Exercises", icon: UserRound },
  { href: "/dashboard/achievements", label: "Achievements", icon: Trophy },
  { href: "/dashboard/community", label: "Community", icon: Users },
  { href: "/dashboard/nutrition", label: "Nutrition", icon: Apple },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Athlete");
  const [authReady, setAuthReady] = useState(!hasSupabase);

  useEffect(() => {
    if (!hasSupabase) {
      const timer = window.setTimeout(() => {
        const raw = window.localStorage.getItem("gymos-user");
        if (raw) {
          try {
            setName(JSON.parse(raw).full_name || "Athlete");
          } catch {}
        }
      }, 0);
      return () => window.clearTimeout(timer);
    }

    const {
      data: { subscription },
    } = supabase!.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setAuthReady(false);
        router.replace("/login");
        return;
      }

      if (
        event === "INITIAL_SESSION" ||
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        if (!session?.user) {
          setAuthReady(false);
          router.replace("/login");
          return;
        }

        const fullName = session.user.user_metadata?.full_name;
        if (fullName) setName(fullName);
        setAuthReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  async function signOut() {
    if (hasSupabase) await supabase!.auth.signOut();
    else window.localStorage.removeItem("gymos-user");
    showToast({
      title: "Signed out",
      description: "Your training data is safe.",
      tone: "info",
    });
    router.push("/login");
  }

  const sidebar = (
    <aside className="flex h-full flex-col bg-[#111113] px-4 py-6">
      <div className="px-2">
        <Logo />
      </div>
      <div className="eyebrow mb-3 mt-9 px-3">Workspace</div>
      <nav className="space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-500 transition",
                active
                  ? "bg-orange-500/10 text-orange-400"
                  : "hover:bg-zinc-900 hover:text-zinc-200",
              )}
            >
              <Icon size={18} strokeWidth={active ? 2.4 : 1.8} />
              <span>{label}</span>
              {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto">
        <div className="mb-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
          <div className="flex items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-700 text-sm font-black text-black">
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-zinc-200">{name}</div>
              <div className="mt-0.5 text-[10px] text-zinc-600">Keep showing up.</div>
            </div>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-600 transition hover:bg-zinc-900 hover:text-zinc-300"
        >
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#09090b]">
      <div className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-[#27272a] md:block">
        {sidebar}
      </div>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative h-full w-[82%] max-w-72 border-r border-zinc-800">
            {sidebar}
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 grid size-9 place-items-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400"
            >
              <X size={17} />
            </button>
          </div>
        </div>
      )}
      <div className="md:pl-64">
        <div className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-zinc-800/80 bg-[#09090b]/90 px-5 backdrop-blur-xl md:hidden">
          <Logo />
          <button
            onClick={() => setOpen(true)}
            className="grid size-10 place-items-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300"
          >
            <Menu size={19} />
          </button>
        </div>
        <main className="mx-auto min-h-screen max-w-[1500px] px-4 pb-28 pt-5 sm:px-7 sm:pt-7 md:pb-9 lg:px-10 lg:py-9">
          {authReady ? (
            children
          ) : (
            <div className="surface grid min-h-56 place-items-center">
              <div className="flex items-center gap-3 text-sm text-zinc-500">
                <LoaderCircle className="animate-spin text-orange-500" size={18} />
                Securing your GymOS session
              </div>
            </div>
          )}
        </main>
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[#27272A] bg-[#111113]/95 px-2 pb-[max(.55rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden">
          {[
            { href: "/dashboard", label: "Home", icon: Home },
            { href: "/dashboard/gymmi", label: "Gymmi", icon: Bot },
            { href: "/dashboard/workouts", label: "Train", icon: Dumbbell },
            {
              href: "/dashboard/progress",
              label: "Progress",
              icon: ChartNoAxesCombined,
            },
            { href: "/dashboard/community", label: "Social", icon: Users },
          ].map(({ href, label, icon: Icon }) => {
            const active =
              href === "/dashboard"
                ? pathname === href
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl py-1.5 text-[9px] font-semibold text-zinc-600",
                  active && "bg-orange-500/8 text-orange-400",
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
