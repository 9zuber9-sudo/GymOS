import { Activity } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-10 place-items-center rounded-xl bg-[#f97316] text-black shadow-[0_0_28px_rgba(249,115,22,.24)]">
        <Activity size={21} strokeWidth={2.7} />
      </div>
      {!compact && (
        <span className="display-font text-[1.75rem] tracking-[0.08em] text-white">
          GYM<span className="text-[#f97316]">OS</span>
        </span>
      )}
    </div>
  );
}
