"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, LoaderCircle, Mail } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { showToast } from "@/components/toast-provider";
import { hasSupabase, supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      if (!hasSupabase) throw new Error("Password reset requires Supabase.");
      const redirectTo = `${window.location.origin}/reset-password`;
      const result = await supabase!.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (result.error) throw result.error;
      setSent(true);
      showToast({
        title: "Reset link sent",
        description: "Check your inbox and follow the secure link.",
        tone: "success",
      });
    } catch (error) {
      showToast({
        title: "Could not send reset link",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={sent ? "Check your inbox" : "Reset your password"}
      subtitle={
        sent
          ? `We sent password recovery instructions to ${email}.`
          : "Enter your account email and we’ll send you a secure recovery link."
      }
      footer={
        <Link
          href="/login"
          className="inline-flex items-center gap-2 font-semibold text-orange-500"
        >
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="surface p-5 text-sm leading-6 text-zinc-400">
          The link may take a minute to arrive. Check spam if you do not see it.
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-zinc-400">
              Email address
            </span>
            <div className="relative">
              <Mail
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
                size={17}
              />
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="input h-12 pl-11 pr-4 text-sm"
              />
            </div>
          </label>
          <button
            disabled={loading}
            className="primary-button flex h-12 w-full items-center justify-center gap-2 text-sm"
          >
            {loading && <LoaderCircle size={16} className="animate-spin" />}
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
