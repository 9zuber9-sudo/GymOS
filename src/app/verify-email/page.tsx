"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { LoaderCircle, MailCheck, RefreshCw } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { showToast } from "@/components/toast-provider";
import { hasSupabase, supabase } from "@/lib/supabase";

function VerifyContent() {
  const email = useSearchParams().get("email");
  const [resending, setResending] = useState(false);

  async function resendConfirmation() {
    if (!email) {
      showToast({
        title: "Email address missing",
        description: "Return to sign up and enter your email again.",
        tone: "error",
      });
      return;
    }

    if (!hasSupabase) {
      showToast({
        title: "Email service is unavailable",
        description: "Supabase is not configured for this deployment.",
        tone: "error",
      });
      return;
    }

    setResending(true);
    try {
      const { error } = await supabase!.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;

      showToast({
        title: "Confirmation email resent",
        description: "Check your inbox and spam folder. It may take a minute.",
        tone: "success",
      });
    } catch (error) {
      showToast({
        title: "Could not resend email",
        description:
          error instanceof Error ? error.message : "Please try again shortly.",
        tone: "error",
      });
    } finally {
      setResending(false);
    }
  }

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
        <button
          type="button"
          disabled={resending}
          onClick={resendConfirmation}
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#27272A] bg-[#09090B] px-4 text-xs font-semibold text-white transition hover:border-orange-500/50 hover:text-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {resending ? (
            <LoaderCircle size={15} className="animate-spin" />
          ) : (
            <RefreshCw size={15} />
          )}
          {resending ? "Sending..." : "Resend confirmation email"}
        </button>
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
