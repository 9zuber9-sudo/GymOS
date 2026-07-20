import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-12">
      <Link href="/login" className="flex items-center gap-2 text-xs text-orange-500">
        <ArrowLeft size={14} /> Back to GymOS
      </Link>
      <div className="mt-10 flex items-center gap-3">
        <ShieldCheck className="text-orange-500" />
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
      </div>
      <div className="mt-8 space-y-6 text-sm leading-7 text-zinc-400">
        <p>
          GymOS stores account information, workouts, body-weight entries, notes,
          templates and conversations that you choose to create. This data is
          used only to provide your personal fitness experience.
        </p>
        <p>
          Each cloud record is protected by user-scoped database policies.
          Gymmi conversation content is sent to the configured AI provider to
          generate a response. Do not enter medical records or information you
          do not want processed for this purpose.
        </p>
        <p>
          Social sharing is opt-in. Workouts and profile details remain private
          unless you deliberately enable sharing or send them to a friend.
        </p>
        <p>
          You can export your data or request permanent account deletion from
          Settings. This policy should be updated with the operator’s legal
          identity and contact address before commercial launch.
        </p>
      </div>
    </main>
  );
}
