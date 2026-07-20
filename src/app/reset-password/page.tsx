"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { showToast } from "@/components/toast-provider";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      showToast({
        title: "Passwords do not match",
        description: "Enter the same password in both fields.",
        tone: "error",
      });
      return;
    }
    setLoading(true);
    try {
      const result = await supabase!.auth.updateUser({ password });
      if (result.error) throw result.error;
      showToast({
        title: "Password updated",
        description: "You can now continue with your new password.",
        tone: "success",
      });
      router.push("/dashboard");
    } catch (error) {
      showToast({
        title: "Password not updated",
        description: error instanceof Error ? error.message : "Open a fresh reset link.",
        tone: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Use at least eight characters and keep it unique to GymOS."
      footer={<span className="text-zinc-600">Secure account recovery</span>}
    >
      <form onSubmit={submit} className="space-y-4">
        {[
          ["New password", password, setPassword],
          ["Confirm password", confirm, setConfirm],
        ].map(([label, value, setter]) => (
          <label key={String(label)} className="block">
            <span className="mb-2 block text-xs font-semibold text-zinc-400">
              {String(label)}
            </span>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                minLength={8}
                required
                value={String(value)}
                onChange={(event) =>
                  (setter as React.Dispatch<React.SetStateAction<string>>)(
                    event.target.value,
                  )
                }
                className="input h-12 px-4 pr-11 text-sm"
              />
              <button
                type="button"
                onClick={() => setShow((current) => !current)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600"
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>
        ))}
        <button
          disabled={loading}
          className="primary-button flex h-12 w-full items-center justify-center gap-2 text-sm"
        >
          {loading && <LoaderCircle size={16} className="animate-spin" />}
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </AuthShell>
  );
}
