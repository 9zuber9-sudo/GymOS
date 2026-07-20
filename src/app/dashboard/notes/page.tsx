"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  FileText,
  Layers3,
  Pin,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { EmptyState, ErrorState, LoadingState, PageHeader, StatCard } from "@/components/ui";
import { showToast } from "@/components/toast-provider";
import { useGymData } from "@/hooks/use-gym-data";
import { addNote, deleteNote, updateNote } from "@/lib/data";
import type { NoteCategory } from "@/lib/types";
import { cn, relativeDate } from "@/lib/utils";

const categories: NoteCategory[] = [
  "General",
  "Workout",
  "Nutrition",
  "Motivation",
  "Goals",
];

const categoryStyles: Record<NoteCategory, string> = {
  General: "border-zinc-700 bg-zinc-800/60 text-zinc-400",
  Workout: "border-orange-500/20 bg-orange-500/10 text-orange-400",
  Nutrition: "border-green-500/20 bg-green-500/10 text-green-400",
  Motivation: "border-violet-500/20 bg-violet-500/10 text-violet-400",
  Goals: "border-blue-500/20 bg-blue-500/10 text-blue-400",
};

export default function NotesPage() {
  const { data, loading, error, refresh } = useGymData();
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<NoteCategory>("General");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"All" | NoteCategory>("All");
  const [busy, setBusy] = useState("");
  const [actionError, setActionError] = useState("");
  const [openedAt] = useState(() => Date.now());

  const visible = useMemo(() => {
    if (!data) return [];
    return [...data.notes]
      .filter((note) => filter === "All" || note.category === filter)
      .filter((note) => note.content.toLowerCase().includes(search.toLowerCase()))
      .sort(
        (a, b) =>
          Number(b.pinned) - Number(a.pinned) ||
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }, [data, filter, search]);

  async function create() {
    if (!content.trim()) return;
    setBusy("create");
    setActionError("");
    try {
      await addNote(content.trim(), category);
      setContent("");
      await refresh();
      showToast({
        title: "Note added",
        description: `Saved under ${category}.`,
        tone: "success",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not add your note.";
      setActionError(message);
      showToast({ title: "Note not saved", description: message, tone: "error" });
    } finally {
      setBusy("");
    }
  }

  if (error) return <ErrorState message={error} />;
  if (loading || !data) return <LoadingState label="Opening your journal" />;

  const weekAgo = openedAt - 7 * 24 * 60 * 60 * 1000;
  const usedCategories = new Set(data.notes.map((note) => note.category)).size;

  return (
    <div className="fade-up">
      <PageHeader
        eyebrow="Training journal"
        title="Notes"
        description="Capture cues, meals, wins, and the small details your future self will need."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total notes" value={data.notes.length} icon={FileText} detail="Everything captured" />
        <StatCard
          label="Pinned"
          value={data.notes.filter((note) => note.pinned).length}
          icon={Pin}
          detail="Always at the top"
          accent
        />
        <StatCard label="Categories" value={usedCategories} icon={Layers3} detail="Currently in use" />
        <StatCard
          label="This week"
          value={data.notes.filter((note) => new Date(note.created_at).getTime() >= weekAgo).length}
          icon={CalendarDays}
          detail="Fresh observations"
        />
      </div>

      <section className="surface mt-6 p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={15} className="text-orange-500" />
          <span className="text-sm font-semibold text-zinc-300">Quick capture</span>
        </div>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) create();
          }}
          rows={3}
          placeholder="What did you notice today?"
          className="input resize-none px-4 py-3 text-sm leading-6"
        />
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as NoteCategory)}
            className="input h-10 w-full px-3 text-xs sm:w-40"
          >
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <button
            disabled={!content.trim() || busy === "create"}
            onClick={create}
            className="primary-button flex h-10 items-center justify-center gap-2 px-5 text-xs"
          >
            <Plus size={14} /> {busy === "create" ? "Adding…" : "Add note"}
          </button>
        </div>
        {actionError && <div className="mt-3"><ErrorState message={actionError} /></div>}
      </section>

      <section className="mt-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search notes…"
              className="input h-11 pl-10 pr-4 text-xs"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(["All", ...categories] as const).map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-2 text-[10px] font-semibold transition",
                  filter === item
                    ? "border-orange-500/30 bg-orange-500/10 text-orange-400"
                    : "border-zinc-800 bg-zinc-900/60 text-zinc-600 hover:text-zinc-300",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {visible.length ? (
            visible.map((note) => (
              <article
                key={note.id}
                className={cn(
                  "surface group p-4 transition sm:p-5",
                  note.pinned && "border-orange-500/20 bg-[linear-gradient(140deg,rgba(249,115,22,.07),rgba(24,24,27,.95))]",
                )}
              >
                <div className="flex gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className={cn("rounded-full border px-2.5 py-1 text-[9px] font-bold", categoryStyles[note.category])}>
                        {note.category}
                      </span>
                      <span className="text-[10px] text-zinc-700">{relativeDate(note.created_at)}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-300">{note.content}</p>
                  </div>
                  <div className="flex shrink-0 items-start gap-1">
                    <button
                      disabled={busy === note.id}
                      onClick={async () => {
                        setBusy(note.id);
                        try {
                          await updateNote(note.id, { pinned: !note.pinned });
                          await refresh();
                          showToast({
                            title: note.pinned ? "Note unpinned" : "Note pinned",
                            description: note.pinned
                              ? "Moved back into chronological order."
                              : "It will stay at the top.",
                            tone: "success",
                          });
                        } catch (err) {
                          showToast({
                            title: "Could not update note",
                            description:
                              err instanceof Error ? err.message : "Please try again.",
                            tone: "error",
                          });
                        } finally {
                          setBusy("");
                        }
                      }}
                      className={cn(
                        "grid size-8 place-items-center rounded-lg text-zinc-700 transition hover:bg-zinc-800 hover:text-zinc-300",
                        note.pinned && "text-orange-500",
                      )}
                      title={note.pinned ? "Unpin" : "Pin"}
                    >
                      <Pin size={14} className={note.pinned ? "fill-orange-500/40" : ""} />
                    </button>
                    <button
                      disabled={busy === note.id}
                      onClick={async () => {
                        setBusy(note.id);
                        try {
                          await deleteNote(note.id);
                          await refresh();
                          showToast({
                            title: "Note deleted",
                            description: "The journal entry was removed.",
                            tone: "success",
                          });
                        } catch (err) {
                          showToast({
                            title: "Could not delete note",
                            description:
                              err instanceof Error ? err.message : "Please try again.",
                            tone: "error",
                          });
                        } finally {
                          setBusy("");
                        }
                      }}
                      className="grid size-8 place-items-center rounded-lg text-zinc-800 opacity-100 transition hover:bg-red-500/10 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100"
                      title="Delete note"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="surface">
              <EmptyState
                icon={FileText}
                title="No matching notes"
                text="Try another search or capture something new above."
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
