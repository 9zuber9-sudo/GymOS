"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  Dumbbell,
  LoaderCircle,
  MessageCircle,
  Search,
  Send,
  Share2,
  ShieldCheck,
  UserPlus,
  UserMinus,
  Users,
} from "lucide-react";
import { ErrorState, LoadingState, PageHeader } from "@/components/ui";
import { showToast } from "@/components/toast-provider";
import { useGymData } from "@/hooks/use-gym-data";
import { saveTemplate } from "@/lib/data";
import { hasSupabase } from "@/lib/supabase";
import {
  acceptFriendRequest,
  type DirectMessage,
  type Friendship,
  loadCommunity,
  loadDirectMessages,
  removeFriendship,
  sendDirectMessage,
  sendFriendRequest,
  shareWorkout,
  type SharedWorkout,
  type SocialProfile,
} from "@/lib/social";
import { cn, relativeDate, totalSets, workoutVolume } from "@/lib/utils";

type CommunityState = {
  me: SocialProfile;
  profiles: SocialProfile[];
  friendships: Friendship[];
  feed: SharedWorkout[];
};

export default function CommunityPage() {
  const { data } = useGymData();
  const [community, setCommunity] = useState<CommunityState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"discover" | "friends" | "feed">("discover");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState("");
  const [chatFriend, setChatFriend] = useState<SocialProfile | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [message, setMessage] = useState("");
  const [caption, setCaption] = useState("");
  const [shareWorkoutId, setShareWorkoutId] = useState("");

  const refresh = useCallback(async () => {
    if (!hasSupabase) {
      setError("Community requires a connected Supabase project.");
      setLoading(false);
      return;
    }
    try {
      setCommunity(await loadCommunity());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load community.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(refresh, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  useEffect(() => {
    if (!chatFriend) return;
    const timer = window.setInterval(() => {
      loadDirectMessages(chatFriend.id).then(setMessages).catch(() => {});
    }, 5000);
    return () => window.clearInterval(timer);
  }, [chatFriend]);

  const friendshipByUser = useMemo(() => {
    const map = new Map<string, Friendship>();
    if (!community) return map;
    community.friendships.forEach((friendship) => {
      const other =
        friendship.requester_id === community.me.id
          ? friendship.addressee_id
          : friendship.requester_id;
      map.set(other, friendship);
    });
    return map;
  }, [community]);

  const visibleProfiles = useMemo(
    () =>
      community?.profiles.filter((profile) =>
        `${profile.display_name} ${profile.handle}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ) || [],
    [community, search],
  );

  const friends =
    community?.profiles.filter(
      (profile) => friendshipByUser.get(profile.id)?.status === "accepted",
    ) || [];
  const incoming =
    community?.friendships.filter(
      (friendship) =>
        friendship.addressee_id === community.me.id &&
        friendship.status === "pending",
    ) || [];

  async function openChat(profile: SocialProfile) {
    setChatFriend(profile);
    try {
      setMessages(await loadDirectMessages(profile.id));
    } catch (err) {
      showToast({
        title: "Chat not opened",
        description: err instanceof Error ? err.message : "Please try again.",
        tone: "error",
      });
    }
  }

  async function sendMessage() {
    if (!chatFriend || !message.trim()) return;
    setBusy("message");
    try {
      await sendDirectMessage(chatFriend.id, message.trim());
      setMessage("");
      setMessages(await loadDirectMessages(chatFriend.id));
    } catch (err) {
      showToast({
        title: "Message not sent",
        description: err instanceof Error ? err.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setBusy("");
    }
  }

  if (loading) return <LoadingState label="Opening your private community" />;

  return (
    <div className="fade-up">
      <PageHeader
        eyebrow="Private by default"
        title="Community"
        description="Connect deliberately, share selected workouts, and keep every other health detail private."
        action={
          <div className="flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/8 px-3 py-2 text-[10px] font-semibold text-green-400">
            <ShieldCheck size={14} /> Opt-in sharing
          </div>
        }
      />

      {error ? (
        <div className="space-y-4">
          <ErrorState message={error} />
          <div className="surface p-5 text-xs leading-6 text-zinc-500">
            The social UI is ready, but its private database tables must be
            installed once before use. Run{" "}
            <code className="text-orange-400">
              supabase/social-and-polish.sql
            </code>{" "}
            in the Supabase SQL Editor.
          </div>
        </div>
      ) : community ? (
        <>
          <div className="mb-5 flex gap-2 overflow-x-auto">
            {[
              ["discover", "Discover"],
              ["friends", `Friends (${friends.length})`],
              ["feed", "Shared workouts"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setTab(value as typeof tab)}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-xs font-semibold",
                  tab === value
                    ? "border-orange-500/30 bg-orange-500/10 text-orange-400"
                    : "border-zinc-800 text-zinc-600",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "discover" && (
            <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
              <section className="surface overflow-hidden">
                <div className="border-b border-zinc-800 p-4">
                  <div className="relative">
                    <Search
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600"
                    />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search people by name or handle…"
                      className="input h-11 pl-10 pr-4 text-xs"
                    />
                  </div>
                </div>
                <div className="divide-y divide-zinc-800">
                  {visibleProfiles.map((profile) => {
                    const friendship = friendshipByUser.get(profile.id);
                    return (
                      <div
                        key={profile.id}
                        className="flex items-center gap-3 px-4 py-4"
                      >
                        <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-700 font-black text-black">
                          {profile.display_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-zinc-200">
                            {profile.display_name}
                          </div>
                          <div className="mt-1 text-[10px] text-zinc-600">
                            @{profile.handle} · {profile.bio}
                          </div>
                        </div>
                        {friendship ? (
                          <span
                            className={cn(
                              "rounded-full border px-3 py-1.5 text-[9px] font-semibold",
                              friendship.status === "accepted"
                                ? "border-green-500/20 bg-green-500/8 text-green-400"
                                : "border-zinc-700 text-zinc-500",
                            )}
                          >
                            {friendship.status === "accepted"
                              ? "Friends"
                              : "Pending"}
                          </span>
                        ) : (
                          <button
                            disabled={busy === profile.id}
                            onClick={async () => {
                              setBusy(profile.id);
                              try {
                                await sendFriendRequest(profile.id);
                                await refresh();
                                showToast({
                                  title: "Friend request sent",
                                  description: `${profile.display_name} can now accept it.`,
                                  tone: "success",
                                });
                              } catch (err) {
                                showToast({
                                  title: "Request not sent",
                                  description:
                                    err instanceof Error
                                      ? err.message
                                      : "Please try again.",
                                  tone: "error",
                                });
                              } finally {
                                setBusy("");
                              }
                            }}
                            className="primary-button flex h-9 items-center gap-2 px-3 text-[10px]"
                          >
                            <UserPlus size={13} /> Add
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="surface p-4">
                <div className="eyebrow">Incoming requests</div>
                <div className="mt-3 space-y-2">
                  {incoming.length ? (
                    incoming.map((request) => {
                      const profile = community.profiles.find(
                        (item) => item.id === request.requester_id,
                      );
                      if (!profile) return null;
                      return (
                        <div
                          key={request.id}
                          className="rounded-xl border border-zinc-800 p-3"
                        >
                          <div className="text-xs font-semibold">
                            {profile.display_name}
                          </div>
                          <div className="mt-1 text-[9px] text-zinc-600">
                            @{profile.handle}
                          </div>
                          <button
                            onClick={async () => {
                              await acceptFriendRequest(request.id);
                              await refresh();
                              showToast({
                                title: "Friend added",
                                description: `You can now chat with ${profile.display_name}.`,
                                tone: "success",
                              });
                            }}
                            className="mt-3 flex h-8 w-full items-center justify-center gap-2 rounded-lg bg-green-500/10 text-[10px] font-semibold text-green-400"
                          >
                            <Check size={12} /> Accept
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <p className="py-6 text-center text-xs text-zinc-700">
                      No pending requests.
                    </p>
                  )}
                </div>
              </section>
            </div>
          )}

          {tab === "friends" && (
            <div className="grid min-h-[550px] gap-5 lg:grid-cols-[320px_1fr]">
              <section className="surface overflow-hidden">
                <div className="border-b border-zinc-800 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Users size={16} className="text-orange-500" /> Your friends
                  </div>
                </div>
                {friends.map((profile) => (
                  <div
                    key={profile.id}
                    className={cn(
                      "flex w-full items-center gap-3 border-b border-zinc-800 px-4 py-3 text-left",
                      chatFriend?.id === profile.id && "bg-orange-500/7",
                    )}
                  >
                    <button
                      onClick={() => openChat(profile)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <div className="grid size-9 place-items-center rounded-xl bg-orange-500/10 text-sm font-bold text-orange-400">
                        {profile.display_name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-semibold">
                          {profile.display_name}
                        </div>
                        <div className="mt-1 text-[9px] text-zinc-600">
                          @{profile.handle}
                        </div>
                      </div>
                    </button>
                    <button
                      title="Remove friend"
                      onClick={async () => {
                        const friendship = friendshipByUser.get(profile.id);
                        if (
                          !friendship ||
                          !window.confirm(`Remove ${profile.display_name} from friends?`)
                        ) {
                          return;
                        }
                        await removeFriendship(friendship.id);
                        if (chatFriend?.id === profile.id) {
                          setChatFriend(null);
                          setMessages([]);
                        }
                        await refresh();
                        showToast({
                          title: "Friend removed",
                          description:
                            "They can no longer message you or view new shared workouts.",
                          tone: "success",
                        });
                      }}
                      className="grid size-8 place-items-center rounded-lg text-zinc-700 hover:bg-red-500/10 hover:text-red-400"
                    >
                      <UserMinus size={13} />
                    </button>
                  </div>
                ))}
              </section>
              <section className="surface flex min-h-[520px] flex-col overflow-hidden">
                {chatFriend ? (
                  <>
                    <div className="border-b border-zinc-800 px-5 py-4">
                      <div className="text-sm font-semibold">
                        {chatFriend.display_name}
                      </div>
                      <div className="mt-1 text-[9px] text-zinc-600">
                        Private direct chat
                      </div>
                    </div>
                    <div className="flex-1 space-y-2 overflow-y-auto p-4">
                      {messages.map((item) => (
                        <div
                          key={item.id}
                          className={cn(
                            "w-fit max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-5",
                            item.sender_id === community.me.id
                              ? "ml-auto rounded-br-sm bg-orange-500 text-black"
                              : "rounded-bl-sm border border-zinc-800 bg-zinc-900 text-zinc-300",
                          )}
                        >
                          {item.content}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 border-t border-zinc-800 p-3">
                      <input
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        onKeyDown={(event) =>
                          event.key === "Enter" && sendMessage()
                        }
                        placeholder="Message your friend…"
                        className="input h-11 px-3 text-xs"
                      />
                      <button
                        disabled={!message.trim() || busy === "message"}
                        onClick={sendMessage}
                        className="primary-button grid size-11 shrink-0 place-items-center"
                      >
                        {busy === "message" ? (
                          <LoaderCircle size={14} className="animate-spin" />
                        ) : (
                          <Send size={14} />
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="grid flex-1 place-items-center text-center">
                    <div>
                      <MessageCircle
                        size={28}
                        className="mx-auto text-zinc-700"
                      />
                      <p className="mt-3 text-xs text-zinc-600">
                        Select a friend to start a private chat.
                      </p>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}

          {tab === "feed" && (
            <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
              <section className="space-y-3">
                {community.feed.map((post) => {
                  const author =
                    community.profiles.find((item) => item.id === post.user_id) ||
                    (post.user_id === community.me.id ? community.me : null);
                  const workout = post.workout_snapshot;
                  return (
                    <article key={post.id} className="surface p-5">
                      <div className="flex items-center gap-3">
                        <div className="grid size-9 place-items-center rounded-xl bg-orange-500/10 font-bold text-orange-400">
                          {author?.display_name.charAt(0) || "G"}
                        </div>
                        <div>
                          <div className="text-xs font-semibold">
                            {author?.display_name || "GymOS athlete"}
                          </div>
                          <div className="mt-1 text-[9px] text-zinc-700">
                            {relativeDate(post.created_at)}
                          </div>
                        </div>
                      </div>
                      {post.caption && (
                        <p className="mt-4 text-sm leading-6 text-zinc-400">
                          {post.caption}
                        </p>
                      )}
                      <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/45 p-4">
                        <div className="flex items-center gap-2 text-orange-500">
                          <Dumbbell size={15} />
                          <span className="text-sm font-semibold text-zinc-200">
                            {workout.focus}
                          </span>
                        </div>
                        <div className="mono-font mt-3 flex gap-4 text-[10px] text-zinc-600">
                          <span>{workout.exercises.length} exercises</span>
                          <span>{totalSets(workout.exercises)} sets</span>
                          <span>
                            {Math.round(workoutVolume(workout)).toLocaleString()} kg
                          </span>
                        </div>
                        <button
                          onClick={async () => {
                            await saveTemplate({
                              name: `${workout.focus} · ${author?.display_name || "Friend"}`,
                              exercises: workout.exercises.map((exercise) => ({
                                name: exercise.name,
                                sets: exercise.sets.length,
                                reps: exercise.sets[0]?.reps || 8,
                              })),
                            });
                            showToast({
                              title: "Routine copied",
                              description:
                                "It is now in Workouts and ready to start with Gymmi.",
                              tone: "success",
                            });
                          }}
                          className="ghost-button mt-4 flex h-9 items-center gap-2 px-3 text-[10px]"
                        >
                          <Dumbbell size={12} /> Save as my template
                        </button>
                      </div>
                    </article>
                  );
                })}
              </section>

              <section className="surface h-fit p-5">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Share2 size={15} className="text-orange-500" /> Share a
                  workout
                </div>
                <p className="mt-2 text-[10px] leading-5 text-zinc-600">
                  Only the workout you select is shared. Notes and body weight
                  always remain private.
                </p>
                <select
                  value={shareWorkoutId}
                  onChange={(event) => setShareWorkoutId(event.target.value)}
                  className="input mt-4 h-11 px-3 text-xs"
                >
                  <option value="">Choose a completed workout</option>
                  {data?.workouts.map((workout) => (
                    <option key={workout.id} value={workout.id}>
                      {workout.focus} ·{" "}
                      {new Date(workout.completed_at).toLocaleDateString()}
                    </option>
                  ))}
                </select>
                <textarea
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                  placeholder="Add an optional caption…"
                  rows={3}
                  className="input mt-3 resize-none px-3 py-2 text-xs"
                />
                <button
                  disabled={!shareWorkoutId || busy === "share"}
                  onClick={async () => {
                    const workout = data?.workouts.find(
                      (item) => item.id === shareWorkoutId,
                    );
                    if (!workout) return;
                    setBusy("share");
                    try {
                      await shareWorkout(workout, caption.trim());
                      setCaption("");
                      setShareWorkoutId("");
                      await refresh();
                      showToast({
                        title: "Workout shared",
                        description: "Your friends can now see this session.",
                        tone: "success",
                      });
                    } catch (err) {
                      showToast({
                        title: "Workout not shared",
                        description:
                          err instanceof Error
                            ? err.message
                            : "Please try again.",
                        tone: "error",
                      });
                    } finally {
                      setBusy("");
                    }
                  }}
                  className="primary-button mt-3 flex h-10 w-full items-center justify-center gap-2 text-xs"
                >
                  <Share2 size={14} /> Share with friends
                </button>
              </section>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
