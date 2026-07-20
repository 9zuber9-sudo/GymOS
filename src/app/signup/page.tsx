"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { showToast } from "@/components/toast-provider";
import { hasSupabase, supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    trainingSpace: "",
    fullName: "",
    email: "",
    password: "",
    terms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.terms) return setError("Please accept the terms to continue.");
    setLoading(true);
    setError("");
    try {
      if (hasSupabase) {
        const result = await supabase!.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              training_space: form.trainingSpace,
              full_name: form.fullName,
            },
          },
        });
        if (result.error) throw result.error;
        showToast({
          title: "Account created",
          description: result.data.session
            ? "Your GymOS workspace is ready."
            : "Check your inbox to confirm your email.",
          tone: "success",
        });
        router.push(
          result.data.session
            ? "/dashboard"
            : `/verify-email?email=${encodeURIComponent(form.email)}`,
        );
      } else {
        window.localStorage.setItem(
          "gymos-user",
          JSON.stringify({
            full_name: form.fullName,
            email: form.email,
            training_space: form.trainingSpace,
          }),
        );
        showToast({
          title: "Profile created",
          description: "Welcome to your GymOS demo workspace.",
          tone: "success",
        });
        router.push("/dashboard");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not create your account.";
      setError(message);
      showToast({
        title: "Signup failed",
        description: message,
        tone: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  function update(key: keyof typeof form, value: string | boolean) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <AuthShell
      title="Build your training system"
      subtitle="One account for your plans, sessions, notes, and progress."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-orange-500 hover:text-orange-400">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="mb-2 block text-xs font-semibold text-zinc-400">
              Where do you train?
            </span>
            <select
              required
              value={form.trainingSpace}
              onChange={(event) => update("trainingSpace", event.target.value)}
              className="input h-12 px-4 text-sm"
            >
              <option value="" disabled>
                Select one
              </option>
              <option value="home">Home</option>
              <option value="gym">Gym</option>
              <option value="home_and_gym">Home + Gym</option>
              <option value="outdoors_or_other">Outdoors / Other</option>
            </select>
          </label>
          <label>
            <span className="mb-2 block text-xs font-semibold text-zinc-400">Your name</span>
            <input
              required
              value={form.fullName}
              onChange={(event) => update("fullName", event.target.value)}
              placeholder="Zubair"
              className="input h-12 px-4 text-sm"
            />
          </label>
        </div>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold text-zinc-400">Email address</span>
          <input
            type="email"
            required
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            placeholder="you@example.com"
            className="input h-12 px-4 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold text-zinc-400">Password</span>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              minLength={8}
              required
              value={form.password}
              onChange={(event) => update("password", event.target.value)}
              placeholder="At least 8 characters"
              className="input h-12 px-4 pr-11 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300"
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </label>
        <label className="flex items-start gap-3 py-1 text-xs leading-5 text-zinc-500">
          <input
            type="checkbox"
            checked={form.terms}
            onChange={(event) => update("terms", event.target.checked)}
            className="mt-1 accent-orange-500"
          />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="text-orange-500">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-orange-500">
              Privacy Policy
            </Link>
            , and understand that Gymmi is a fitness assistant, not a medical
            professional.
          </span>
        </label>
        <button type="submit" disabled={loading} className="primary-button flex h-12 w-full items-center justify-center gap-2 text-sm">
          {loading && <LoaderCircle size={17} className="animate-spin" />}
          {loading ? "Creating account…" : "Create my account"}
        </button>
      </form>
    </AuthShell>
  );
}
