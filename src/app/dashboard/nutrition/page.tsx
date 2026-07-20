"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Apple,
  ArrowRight,
  Bot,
  Calculator,
  Salad,
  Scale,
  UtensilsCrossed,
} from "lucide-react";
import { PageHeader } from "@/components/ui";

const goals = {
  maintain: { label: "General fitness", low: 1.4, high: 1.8 },
  muscle: { label: "Build muscle", low: 1.6, high: 2.2 },
  fat_loss: { label: "Fat loss", low: 1.8, high: 2.2 },
  endurance: { label: "Endurance", low: 1.4, high: 1.8 },
};

export default function NutritionPage() {
  const [weight, setWeight] = useState("70");
  const [goal, setGoal] = useState<keyof typeof goals>("muscle");
  const result = useMemo(() => {
    const kg = Math.max(0, Number(weight));
    const target = goals[goal];
    return {
      low: Math.round(kg * target.low),
      high: Math.round(kg * target.high),
      midpoint: Math.round(kg * ((target.low + target.high) / 2)),
    };
  }, [goal, weight]);

  const prompts = [
    {
      icon: Salad,
      title: "Plan today’s meals",
      prompt: `Help me plan balanced meals around a protein target of about ${result.midpoint}g.`,
    },
    {
      icon: UtensilsCrossed,
      title: "Protein food ideas",
      prompt: `Give me simple food ideas to reach ${result.low}-${result.high}g protein.`,
    },
    {
      icon: Apple,
      title: "Pre-workout food",
      prompt: "What should I eat before my workout today?",
    },
  ];

  return (
    <div className="fade-up">
      <PageHeader
        eyebrow="Useful estimates, no fake precision"
        title="Nutrition"
        description="Calculate a practical protein range, then ask Gymmi to turn it into meals that fit your preferences."
      />

      <div className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
        <section className="surface p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-orange-500/10 text-orange-500">
              <Calculator size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Protein intake calculator</h2>
              <p className="mt-1 text-[11px] text-zinc-600">
                Daily planning range based on body weight and goal.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label>
              <span className="mb-2 block text-xs font-semibold text-zinc-500">
                Body weight
              </span>
              <div className="relative">
                <Scale
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600"
                />
                <input
                  type="number"
                  min="30"
                  max="300"
                  step="0.1"
                  value={weight}
                  onChange={(event) => setWeight(event.target.value)}
                  className="input h-12 pl-10 pr-11 text-sm"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-zinc-600">
                  kg
                </span>
              </div>
            </label>
            <label>
              <span className="mb-2 block text-xs font-semibold text-zinc-500">
                Current goal
              </span>
              <select
                value={goal}
                onChange={(event) =>
                  setGoal(event.target.value as keyof typeof goals)
                }
                className="input h-12 px-3 text-sm"
              >
                {Object.entries(goals).map(([value, item]) => (
                  <option key={value} value={value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5 rounded-2xl border border-orange-500/20 bg-orange-500/6 p-5">
            <div className="eyebrow text-orange-500">Suggested daily range</div>
            <div className="display-font mt-2 text-5xl tracking-wide text-white">
              {result.low}–{result.high}
              <span className="ml-2 text-2xl text-orange-500">g</span>
            </div>
            <p className="mt-3 text-xs leading-5 text-zinc-500">
              A simple midpoint target is{" "}
              <strong className="text-zinc-300">{result.midpoint}g/day</strong>.
              Divide it across 3–5 meals instead of chasing one perfect meal.
            </p>
          </div>
          <p className="mt-4 text-[10px] leading-5 text-zinc-700">
            This is a general fitness estimate, not medical nutrition advice.
            Kidney conditions, pregnancy, eating disorders, or prescribed diets
            require guidance from a qualified clinician.
          </p>
        </section>

        <section className="surface relative overflow-hidden p-6">
          <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="relative">
            <div className="grid size-11 place-items-center rounded-2xl bg-orange-500 text-black">
              <Bot size={22} />
            </div>
            <h2 className="mt-6 text-2xl font-bold tracking-[-0.04em]">
              Turn the number into food.
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-500">
              Gymmi can distribute your range across meals, preferences and
              training time without pretending every bite needs a spreadsheet.
            </p>
            <Link
              href={`/dashboard/gymmi?q=${encodeURIComponent(
                `Build a simple day of meals for my ${result.low}-${result.high}g protein range.`,
              )}`}
              className="primary-button mt-6 flex h-11 w-fit items-center gap-2 px-5 text-xs"
            >
              Build my protein day <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {prompts.map(({ icon: Icon, title, prompt }) => (
          <Link
            key={title}
            href={`/dashboard/gymmi?q=${encodeURIComponent(prompt)}`}
            className="surface surface-hover group p-5"
          >
            <div className="flex items-center justify-between">
              <div className="grid size-10 place-items-center rounded-xl border border-zinc-800 bg-zinc-900 text-orange-500">
                <Icon size={18} />
              </div>
              <ArrowRight
                size={15}
                className="text-zinc-700 transition group-hover:translate-x-1 group-hover:text-orange-500"
              />
            </div>
            <h3 className="mt-5 text-sm font-semibold text-zinc-200">{title}</h3>
            <p className="mt-2 text-xs leading-5 text-zinc-600">{prompt}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
