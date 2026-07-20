"use client";

import { supabase } from "./supabase";
import type { Workout } from "./types";

export type SocialProfile = {
  id: string;
  display_name: string;
  handle: string;
  bio: string;
  created_at: string;
};

export type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted";
  created_at: string;
};

export type DirectMessage = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
};

export type SharedWorkout = {
  id: string;
  user_id: string;
  caption: string;
  workout_snapshot: Workout;
  created_at: string;
};

function socialError(error: { code?: string; message?: string } | null) {
  if (
    error?.code === "PGRST205" ||
    /profiles|friendships|direct_messages|shared_workouts/.test(
      error?.message || "",
    )
  ) {
    return new Error(
      "Community migration is not installed yet. Run supabase/social-and-polish.sql once in the Supabase SQL Editor.",
    );
  }
  return error ? new Error(error.message || "Community request failed.") : null;
}

async function currentUser() {
  const result = await supabase!.auth.getUser();
  if (!result.data.user) throw new Error("Please sign in again.");
  return result.data.user;
}

export async function ensureProfile() {
  const user = await currentUser();
  const existing = await supabase!
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  const mapped = socialError(existing.error);
  if (mapped) throw mapped;
  if (existing.data) return existing.data as SocialProfile;

  const base = String(
    user.user_metadata?.full_name || user.email?.split("@")[0] || "athlete",
  );
  const handle = `${base.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16)}_${user.id.slice(0, 5)}`;
  const created = await supabase!
    .from("profiles")
    .insert({
      id: user.id,
      display_name: base,
      handle,
      bio: "Training with GymOS",
    })
    .select()
    .single();
  const createError = socialError(created.error);
  if (createError) throw createError;
  return created.data as SocialProfile;
}

export async function loadCommunity() {
  const me = await ensureProfile();
  const [profiles, friendships, feed] = await Promise.all([
    supabase!
      .from("profiles")
      .select("*")
      .neq("id", me.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase!
      .from("friendships")
      .select("*")
      .or(`requester_id.eq.${me.id},addressee_id.eq.${me.id}`)
      .order("created_at", { ascending: false }),
    supabase!
      .from("shared_workouts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);
  const error = profiles.error || friendships.error || feed.error;
  const mapped = socialError(error);
  if (mapped) throw mapped;
  return {
    me,
    profiles: (profiles.data || []) as SocialProfile[],
    friendships: (friendships.data || []) as Friendship[],
    feed: (feed.data || []) as SharedWorkout[],
  };
}

export async function sendFriendRequest(addresseeId: string) {
  const user = await currentUser();
  const result = await supabase!.from("friendships").insert({
    requester_id: user.id,
    addressee_id: addresseeId,
    status: "pending",
  });
  const error = socialError(result.error);
  if (error) throw error;
}

export async function acceptFriendRequest(id: string) {
  const result = await supabase!
    .from("friendships")
    .update({ status: "accepted" })
    .eq("id", id);
  const error = socialError(result.error);
  if (error) throw error;
}

export async function removeFriendship(id: string) {
  const result = await supabase!.from("friendships").delete().eq("id", id);
  const error = socialError(result.error);
  if (error) throw error;
}

export async function loadDirectMessages(friendId: string) {
  const user = await currentUser();
  const result = await supabase!
    .from("direct_messages")
    .select("*")
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`,
    )
    .order("created_at");
  const error = socialError(result.error);
  if (error) throw error;
  return (result.data || []) as DirectMessage[];
}

export async function sendDirectMessage(receiverId: string, content: string) {
  const user = await currentUser();
  const result = await supabase!.from("direct_messages").insert({
    sender_id: user.id,
    receiver_id: receiverId,
    content,
  });
  const error = socialError(result.error);
  if (error) throw error;
}

export async function shareWorkout(workout: Workout, caption: string) {
  const user = await currentUser();
  const result = await supabase!.from("shared_workouts").insert({
    user_id: user.id,
    workout_id: workout.id,
    workout_snapshot: workout,
    caption,
  });
  const error = socialError(result.error);
  if (error) throw error;
}
