import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ChatMessage } from "./types";

const SYSTEM_PROMPT = `You are Gymmi, a concise, practical and encouraging personal fitness coach inside GymOS.
Remember and use relevant details from the current conversation so the user does not need to repeat themselves.
Give specific, actionable answers with a calm coaching voice. Explain the reason behind advice briefly, without lectures.
Prioritize good technique, progressive overload, recovery, realistic consistency, and exercise substitutions when equipment is limited.
Never diagnose medical conditions. If pain, injury, disordered eating, pregnancy, kidney disease, or a prescribed diet is mentioned, stay conservative and recommend an appropriately qualified professional.
Never invent the user's performance history, calories burned, medical facts, or personal records.

For normal fitness, recovery or nutrition questions, answer conversationally in clear plain text.
For any request to create, plan, replace, or start a workout, output ONLY valid JSON wrapped in workout tags exactly like:
<workout>
{"focus":"Chest Day","exercises":[{"name":"Bench Press","sets":4,"reps":8}]}
</workout>
Use 4-6 sensible exercises in a safe order: main compound movements first, accessories later. Match the user's stated time, experience, equipment, fatigue, and requested muscles. Sets and reps must be positive integers, never ranges. Do not add markdown around the workout tags.`;

function demoReply(messages: ChatMessage[]) {
  const prompt = messages.at(-1)?.content.toLowerCase() || "";
  if (/workout|chest|back|leg|push|pull|arms|shoulder|core|train/.test(prompt)) {
    const isLegs = /leg|quad|glute/.test(prompt);
    const isPull = /back|pull/.test(prompt);
    const isShoulders = /shoulder/.test(prompt);
    const workout = isLegs
      ? {
          focus: "Leg Day",
          exercises: [
            { name: "Back Squat", sets: 4, reps: 8 },
            { name: "Romanian Deadlift", sets: 3, reps: 10 },
            { name: "Walking Lunges", sets: 3, reps: 12 },
            { name: "Leg Curl", sets: 3, reps: 12 },
            { name: "Standing Calf Raise", sets: 4, reps: 15 },
          ],
        }
      : isPull
        ? {
            focus: "Pull Day",
            exercises: [
              { name: "Lat Pulldown", sets: 4, reps: 10 },
              { name: "Chest Supported Row", sets: 4, reps: 8 },
              { name: "Seated Cable Row", sets: 3, reps: 12 },
              { name: "Face Pull", sets: 3, reps: 15 },
              { name: "Dumbbell Curl", sets: 3, reps: 12 },
            ],
          }
        : {
            focus: isShoulders ? "Shoulder Day" : "Push Day",
            exercises: [
              { name: "Barbell Bench Press", sets: 4, reps: 8 },
              { name: "Incline Dumbbell Press", sets: 3, reps: 10 },
              { name: "Overhead Press", sets: 3, reps: 8 },
              { name: "Cable Fly", sets: 3, reps: 12 },
              { name: "Tricep Pushdown", sets: 3, reps: 12 },
            ],
          };
    return `<workout>\n${JSON.stringify(workout)}\n</workout>`;
  }
  if (/eat|food|nutrition|protein/.test(prompt)) {
    return "Build each meal around a protein source, add a fruit or vegetable, and keep carbs near training. A useful protein target for active adults is roughly 1.6–2.2 g per kg of body weight, adjusted for your preferences and medical needs.";
  }
  if (/sleep|recovery/.test(prompt)) {
    return "Aim for a consistent sleep and wake time, dim screens and lights before bed, and keep caffeine at least 8 hours away from sleep. Recovery is training too.";
  }
  return "You do not need a perfect session—just a clear next action. Tell me what you want to train, how much time you have, and what equipment is available.";
}

export async function askGymmi(messages: ChatMessage[], trainingContext = "") {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return demoReply(messages);

  const firstUser = messages.findIndex((message) => message.role === "user");
  const trimmed = firstUser >= 0 ? messages.slice(firstUser) : messages;
  const latest = trimmed.at(-1);
  const history = trimmed.slice(0, -1).map((message) => ({
    role: message.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: message.content }],
  }));

  const client = new GoogleGenerativeAI(key);
  const model = client.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-3.1-flash-lite",
    systemInstruction: `${SYSTEM_PROMPT}

${trainingContext ? `VERIFIED USER CONTEXT FROM GYMOS:
${trainingContext}
Use only this verified context when referring to history, goals, schedule or readiness. If it is insufficient, say so.` : "No verified GymOS history was provided for this request."}`,
  });
  const chat = model.startChat({ history });
  const result = await chat.sendMessage(latest?.content || "Help me train today.");
  return result.response.text();
}
