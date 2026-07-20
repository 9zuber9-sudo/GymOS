import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-12">
      <Link href="/login" className="flex items-center gap-2 text-xs text-orange-500">
        <ArrowLeft size={14} /> Back to GymOS
      </Link>
      <h1 className="mt-10 text-3xl font-bold">Terms of Service</h1>
      <div className="mt-8 space-y-6 text-sm leading-7 text-zinc-400">
        <p>
          GymOS is a fitness planning and logging tool. It is not a medical
          service and Gymmi does not diagnose, treat or replace a qualified
          professional.
        </p>
        <p>
          You are responsible for choosing loads, exercises and nutrition
          decisions appropriate for your health and experience. Stop training
          and seek professional help if you experience pain, injury or concerning
          symptoms.
        </p>
        <p>
          Do not use community features for harassment, spam, impersonation or
          sharing another person’s private information. Accounts that abuse the
          service may be restricted.
        </p>
        <p>
          These launch-ready terms are a product template and should be reviewed
          with the operator’s legal details before a public commercial release.
        </p>
      </div>
    </main>
  );
}
