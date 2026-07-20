"use client";

import { hasSupabase, supabase } from "./supabase";
import type { ChatMessage, ChatSession } from "./types";

const LOCAL_KEY = "gymos-chat-history-v1";

function localRead(): ChatSession[] {
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_KEY) || "[]");
  } catch {
    return [];
  }
}

function localWrite(sessions: ChatSession[]) {
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(sessions.slice(0, 30)));
}

function isMissingTable(error: { code?: string; message?: string } | null) {
  return (
    error?.code === "PGRST205" ||
    Boolean(error?.message?.includes("gymmi_chats"))
  );
}

export async function listChatSessions() {
  if (!hasSupabase) return localRead();
  const user = await supabase!.auth.getUser();
  if (!user.data.user) return [];
  const result = await supabase!
    .from("gymmi_chats")
    .select("id,title,messages,created_at,updated_at")
    .eq("user_id", user.data.user.id)
    .order("updated_at", { ascending: false })
    .limit(30);
  if (isMissingTable(result.error)) return localRead();
  if (result.error) throw result.error;
  return (result.data || []) as ChatSession[];
}

export async function saveChatSession(
  id: string,
  messages: ChatMessage[],
) {
  const now = new Date().toISOString();
  const firstUser = messages.find((message) => message.role === "user");
  const title =
    firstUser?.content.replace(/\s+/g, " ").slice(0, 48) || "New conversation";
  const localSession: ChatSession = {
    id,
    title,
    messages,
    created_at: now,
    updated_at: now,
  };

  if (!hasSupabase) {
    const sessions = localRead();
    const existing = sessions.find((session) => session.id === id);
    localWrite([
      { ...localSession, created_at: existing?.created_at || now },
      ...sessions.filter((session) => session.id !== id),
    ]);
    return;
  }

  const user = await supabase!.auth.getUser();
  if (!user.data.user) throw new Error("Please sign in again.");
  const result = await supabase!.from("gymmi_chats").upsert({
    id,
    user_id: user.data.user.id,
    title,
    messages,
    updated_at: now,
  });
  if (isMissingTable(result.error)) {
    const sessions = localRead();
    localWrite([
      localSession,
      ...sessions.filter((session) => session.id !== id),
    ]);
    return;
  }
  if (result.error) throw result.error;
}

export async function deleteChatSession(id: string) {
  localWrite(localRead().filter((session) => session.id !== id));
  if (!hasSupabase) return;
  const result = await supabase!.from("gymmi_chats").delete().eq("id", id);
  if (result.error && !isMissingTable(result.error)) throw result.error;
}
