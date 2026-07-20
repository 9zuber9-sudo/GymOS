"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Database,
  Download,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { PageHeader } from "@/components/ui";
import { showToast } from "@/components/toast-provider";
import { PwaInstallCard } from "@/components/pwa-install-card";
import { getData, resetDemoData } from "@/lib/data";
import { getTrainingSystem } from "@/lib/training-system";
import { hasSupabase, supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const router = useRouter();
  const [name, setName] = useState("Athlete");
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      if (hasSupabase) {
        const result = await supabase!.auth.getUser();
        setName(result.data.user?.user_metadata?.full_name || "Athlete");
        setEmail(result.data.user?.email || "");
      } else {
        const raw = window.localStorage.getItem("gymos-user");
        if (raw) {
          try {
            const profile = JSON.parse(raw);
            setName(profile.full_name || "Athlete");
            setEmail(profile.email || "");
          } catch {}
        }
      }
    }
    load();
  }, []);

  async function save() {
    try {
      if (hasSupabase) {
        const result = await supabase!.auth.updateUser({
          data: { full_name: name },
        });
        if (result.error) throw result.error;
      } else {
        const raw = window.localStorage.getItem("gymos-user");
        const profile = raw ? JSON.parse(raw) : {};
        window.localStorage.setItem(
          "gymos-user",
          JSON.stringify({ ...profile, full_name: name, email }),
        );
      }
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
      showToast({
        title: "Profile updated",
        description: "Your personal details were saved.",
        tone: "success",
      });
    } catch (err) {
      showToast({
        title: "Profile not updated",
        description: err instanceof Error ? err.message : "Please try again.",
        tone: "error",
      });
    }
  }

  async function exportData() {
    try {
      const data = await getData();
      const trainingSystem = await getTrainingSystem();
      const profile = { name, email, exported_at: new Date().toISOString() };
      let connectedData = {};
      if (hasSupabase) {
        const [chats, friendships, messages, sharedWorkouts, socialProfile] =
          await Promise.all([
            supabase!.from("gymmi_chats").select("*"),
            supabase!.from("friendships").select("*"),
            supabase!.from("direct_messages").select("*"),
            supabase!.from("shared_workouts").select("*"),
            supabase!.from("profiles").select("*").maybeSingle(),
          ]);
        connectedData = {
          gymmi_chats: chats.data || [],
          friendships: friendships.data || [],
          direct_messages: messages.data || [],
          shared_workouts: sharedWorkouts.data || [],
          social_profile: socialProfile.data || null,
        };
      }
      const blob = new Blob(
        [JSON.stringify({ profile, training_system: trainingSystem, ...data, ...connectedData }, null, 2)],
        {
        type: "application/json",
        },
      );
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = `gymos-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(href);
      showToast({
        title: "Data exported",
        description: "Your private GymOS JSON backup was downloaded.",
        tone: "success",
      });
    } catch (error) {
      showToast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "error",
      });
    }
  }

  async function deleteAccount() {
    if (deleteText !== "DELETE") return;
    setDeleting(true);
    try {
      if (!hasSupabase) {
        window.localStorage.clear();
      } else {
        const session = await supabase!.auth.getSession();
        const token = session.data.session?.access_token;
        if (!token) throw new Error("Please sign in again.");
        const response = await fetch("/api/account/delete", {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        await supabase!.auth.signOut();
      }
      showToast({
        title: "Account deleted",
        description: "Your GymOS account and owned data were removed.",
        tone: "success",
      });
      router.push("/signup");
    } catch (error) {
      showToast({
        title: "Account not deleted",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fade-up">
      <PageHeader
        eyebrow="Your GymOS"
        title="Settings"
        description="Manage your profile and see which services are powering this installation."
      />
      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <section className="surface p-5">
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
            <div className="grid size-10 place-items-center rounded-xl bg-orange-500/10 text-orange-500">
              <UserRound size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Profile</h2>
              <p className="mt-1 text-[11px] text-zinc-600">Used in your dashboard greeting.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label>
              <span className="mb-2 block text-xs font-semibold text-zinc-500">Full name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} className="input h-11 px-3 text-sm" />
            </label>
            <label>
              <span className="mb-2 block text-xs font-semibold text-zinc-500">Email</span>
              <input
                type="email"
                value={email}
                disabled={hasSupabase}
                onChange={(event) => setEmail(event.target.value)}
                className="input h-11 px-3 text-sm disabled:text-zinc-600"
              />
            </label>
          </div>
          <button onClick={save} className="primary-button mt-5 flex h-10 items-center gap-2 px-4 text-xs">
            {saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
            {saved ? "Saved" : "Save profile"}
          </button>
        </section>

        <section className="surface p-5">
          <div className="eyebrow mb-4">Connection status</div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
              <Database size={17} className={hasSupabase ? "text-green-500" : "text-orange-500"} />
              <div className="flex-1">
                <div className="text-xs font-semibold text-zinc-300">Data storage</div>
                <div className="mt-1 text-[10px] text-zinc-600">{hasSupabase ? "Supabase connected" : "Local demo mode"}</div>
              </div>
              <span className={`size-2 rounded-full ${hasSupabase ? "bg-green-500" : "bg-orange-500"}`} />
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
              <ShieldCheck size={17} className="text-green-500" />
              <div>
                <div className="text-xs font-semibold text-zinc-300">Privacy</div>
                <div className="mt-1 text-[10px] text-zinc-600">Personal by default</div>
              </div>
            </div>
          </div>
          {!hasSupabase && (
            <button
              onClick={() => {
                if (window.confirm("Reset all demo workouts, notes, templates and weight entries?")) {
                  resetDemoData();
                  showToast({
                    title: "Demo data reset",
                    description: "The sample workspace was restored.",
                    tone: "success",
                  });
                  window.setTimeout(() => window.location.reload(), 500);
                }
              }}
              className="ghost-button mt-4 flex h-10 w-full items-center justify-center gap-2 text-xs text-zinc-500"
            >
              <RotateCcw size={14} /> Reset demo data
            </button>
          )}
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <PwaInstallCard />
        <section className="surface p-5">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-orange-500/10 text-orange-500">
              <Download size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Export your data</h2>
              <p className="mt-1 text-[11px] text-zinc-600">
                Download workouts, notes, templates and weight logs as JSON.
              </p>
            </div>
          </div>
          <button
            onClick={exportData}
            className="ghost-button mt-5 flex h-10 items-center gap-2 px-4 text-xs"
          >
            <Download size={14} /> Download my data
          </button>
        </section>

        <section className="surface border-red-500/15 p-5">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-red-500/10 text-red-400">
              <Trash2 size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Delete account</h2>
              <p className="mt-1 text-[11px] text-zinc-600">
                Permanent and irreversible. Type DELETE to confirm.
              </p>
            </div>
          </div>
          <div className="mt-5 flex gap-2">
            <input
              value={deleteText}
              onChange={(event) => setDeleteText(event.target.value)}
              placeholder="Type DELETE"
              className="input h-10 px-3 text-xs"
            />
            <button
              disabled={deleteText !== "DELETE" || deleting}
              onClick={deleteAccount}
              className="h-10 shrink-0 rounded-xl border border-red-500/25 bg-red-500/10 px-4 text-xs font-semibold text-red-400 disabled:opacity-40"
            >
              {deleting ? "Deleting…" : "Delete forever"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
