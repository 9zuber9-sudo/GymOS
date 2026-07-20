"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { MailCheck } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";

function VerifyContent() {
  const email = useSearchParams().get("email");
  return (
    <AuthShell
      title="Confirm your email"
      subtitle="One quick verification keeps your training data protected."
      footer={
        <Link href="/login" className="font-semibold text-orange-500">
          I’ve confirmed it — sign in
        </Link>
      }
    >
      <div className="surface p-6 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl border border-green-500/20 bg-green-500/10 text-green-400">
          <MailCheck size={22} />
        </div>
        <p className="mt-4 text-sm leading-6 text-zinc-400">
          We sent a confirmation link{email ? ` to ${email}` : ""}. Open it on
          this device, then return to sign in.
        </p>
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  );
}
