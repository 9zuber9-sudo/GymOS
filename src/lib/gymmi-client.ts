"use client";

import { hasSupabase, supabase } from "./supabase";
import type { ChatMessage } from "./types";

export async function postToGymmi(messages: ChatMessage[]) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (hasSupabase) {
    const { data } = await supabase!.auth.getSession();
    if (!data.session?.access_token) {
      throw new Error("Your session expired. Please sign in again.");
    }
    headers.Authorization = `Bearer ${data.session.access_token}`;
  }

  const response = await fetch("/api/gymmi", {
    method: "POST",
    headers,
    body: JSON.stringify({ messages }),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Gymmi could not respond.");
  }
  return result.reply as string;
}
