"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { showToast } from "@/components/toast-provider";
import { hasSupabase, supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (hasSupabase) {
        const result = await supabase!.auth.signInWithPassword({ email, password });
        if (result.error) throw result.error;
      } else {
        if (!email || !password) throw new Error("Enter an email and password to continue.");
        window.localStorage.setItem(
          "gymos-user",
          JSON.stringify({ full_name: email.split("@")[0] || "Athlete", email, remember }),
        );
      }
      showToast({
        title: "Welcome back",
        description: "Your GymOS workspace is ready.",
        tone: "success",
      });
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed.";
      setError(message);
      showToast({ title: "Could not sign in", description: message, tone: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in and pick up exactly where you left off."
      footer={
        <>
          New to GymOS?{" "}
          <Link href="/signup" className="font-semibold text-orange-500 hover:text-orange-400">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}
        {!hasSupabase && (
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/7 px-4 py-3 text-xs leading-5 text-orange-200/75">
            Demo mode is active. Use any email and password to enter.
          </div>
        )}
        <label className="block">
          <span className="mb-2 block text-xs font-semibold text-zinc-400">Email address</span>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={17} />
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
        <label className="block">
          <span className="mb-2 block text-xs font-semibold text-zinc-400">Password</span>
          <div className="relative">
            <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={17} />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              className="input h-12 px-11 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </label>
        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-zinc-500">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="accent-orange-500"
            />
            Remember this device
          </label>
          <Link
            href="/forgot-password"
            className="font-medium text-zinc-500 transition hover:text-orange-400"
          >
            Forgot password?
          </Link>
        </div>
        <button type="submit" disabled={loading} className="primary-button flex h-12 w-full items-center justify-center gap-2 text-sm">
          {loading && <LoaderCircle size={17} className="animate-spin" />}
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
