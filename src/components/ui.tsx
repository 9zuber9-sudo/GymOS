import type { LucideIcon } from "lucide-react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <div className="eyebrow mb-2 text-[#f97316]">{eyebrow}</div>}
        <h1 className="text-2xl font-bold tracking-[-0.035em] text-white sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon: LucideIcon;
  accent?: boolean;
}) {
  return (
    <div className={cn("surface relative overflow-hidden p-5", accent && "border-orange-500/30")}>
      {accent && (
        <div className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-orange-500/10 blur-2xl" />
      )}
      <div className="flex items-start justify-between">
        <span className="eyebrow">{label}</span>
        <div
          className={cn(
            "grid size-9 place-items-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-500",
            accent && "border-orange-500/20 bg-orange-500/10 text-orange-400",
          )}
        >
          <Icon size={17} />
        </div>
      </div>
      <div className="mt-5 text-3xl font-bold tracking-[-0.04em]">{value}</div>
      {detail && <div className="mt-2 text-xs text-zinc-500">{detail}</div>}
    </div>
  );
}

export function LoadingState({ label = "Loading your data" }: { label?: string }) {
  return (
    <div className="surface grid min-h-56 place-items-center">
      <div className="flex items-center gap-3 text-sm text-zinc-500">
        <LoaderCircle className="animate-spin text-orange-500" size={18} />
        {label}
      </div>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-300">
      {message}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-52 place-items-center px-6 py-10 text-center">
      <div>
        <div className="mx-auto grid size-11 place-items-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-500">
          <Icon size={19} />
        </div>
        <h3 className="mt-4 text-sm font-semibold text-zinc-200">{title}</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">{text}</p>
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );
}
