// pages/quiz.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";

/** ---------------------------
 *  Types
 *  --------------------------*/
type Single =
  | "vibe"
  | "group"
  | "location"
  | "foodType"
  | "involvement"
  | "flavourProfile"
  | "budget"
  | "adventureLevel"
  | "animalType";

type Multi = "experienceTags" | "restrictions";

type QuizState = {
  name?: string;
  vibe?: string;
  group?: string;
  location?: string;
  foodType?: string;
  involvement?: string;
  experienceTags?: string[];
  flavourProfile?: string;
  budget_pp?: number;
  adventureLevel?: string;
  restrictions?: string[];
  animalType?: string;
};

type Step =
  | {
      id: "name";
      type: "text";
      title: string;
      subtitle?: string;
      placeholder?: string;
    }
  | {
      id: Single;
      type: "single";
      title: string;
      subtitle?: string;
      options: { label: string; value: string }[];
      autoAdvance?: boolean; // default true
    }
  | {
      id: Multi;
      type: "multi";
      title: string;
      subtitle?: string;
      options: { label: string; value: string }[];
      min?: number;
      max?: number;
    };

/** ---------------------------
 *  Step configuration
 *  --------------------------*/
const STEPS: Step[] = [
  {
    id: "name",
    type: "text",
    title: "Let's start on a first-name basis.",
    subtitle: "What should we call you?",
    placeholder: "Type your name",
  },
  {
    id: "vibe",
    type: "single",
    title: "What kind of vibe are you going for?",
    options: [
      { label: "A cosy night in", value: "cosy" },
      { label: "A big night out", value: "bigNightOut" },
      { label: "An outdoor adventure", value: "adventure" },
      { label: "A chance to learn something new", value: "learnSomething" },
      { label: "Surprise me", value: "surprise" },
    ],
  },
  {
    id: "group",
    type: "single",
    title: "Who are you planning to gather with?",
    options: [
      { label: "Just me", value: "solo" },
      { label: "Date night", value: "date" },
      { label: "A group of friends", value: "friends" },
      { label: "Family", value: "family" },
      { label: "Work Crew", value: "work" },
    ],
  },
  {
    id: "location",
    type: "single",
    title: "Where do you want it to happen?",
    options: [
      { label: "Out and about", value: "out" },
      { label: "At home", value: "home" },
      { label: "Online", value: "online" },
      { label: "Anywhere’s fine", value: "anywhere" },
    ],
  },
  {
    id: "foodType",
    type: "single",
    title: "What sounds tastiest?",
    options: [
      { label: "A delicious meal", value: "meal" },
      { label: "A food-based experience", value: "foodExperience" },
      { label: "A boozy tasting session", value: "tasting" },
      { label: "Surprise me", value: "surprise" },
    ],
  },
  {
    id: "involvement",
    type: "single",
    title: "How involved do you want to be?",
    options: [
      { label: "I want to learn how to do it myself", value: "learn" },
      { label: "I want to watch someone do it for me", value: "watch" },
      { label: "I want to do it collaboratively", value: "collaborate" },
      { label: "Anything goes", value: "anything" },
    ],
  },
  {
    id: "experienceTags",
    type: "multi",
    title: "Describe your perfect experience",
    subtitle: "Pick 2–3",
    options: [
      { label: "Relaxed", value: "relaxed" },
      { label: "Social", value: "social" },
      { label: "Educational", value: "educational" },
      { label: "Adventurous", value: "adventurous" },
      { label: "Unique", value: "unique" },
      { label: "Active", value: "active" },
      { label: "Luxurious", value: "luxurious" },
      { label: "Romantic", value: "romantic" },
      { label: "Quirky", value: "quirky" },
      { label: "Cultural", value: "cultural" },
    ],
    min: 2,
    max: 3,
  },
  {
    id: "flavourProfile",
    type: "single",
    title: "Imagine your perfect bite of food. How would you describe it?",
    options: [
      { label: "Bold & Rich", value: "boldRich" },
      { label: "Fresh & Zesty", value: "freshZesty" },
      { label: "Sweet & Indulgent", value: "sweetIndulgent" },
      { label: "Savoury & Earthy", value: "savouryEarthy" },
      { label: "Herbaceous", value: "herbaceous" },
      { label: "Not sure", value: "unsure" },
    ],
  },
  {
    id: "budget",
    type: "single",
    title: "What's your budget sweet spot per person?",
    options: [
      { label: "< $50", value: "<50" },
      { label: "$50–$100", value: "50-100" },
      { label: "$100–$200", value: "100-200" },
      { label: "$200+", value: "200+" },
    ],
  },
  {
    id: "adventureLevel",
    type: "single",
    title:
      "On a scale of Bubble Bath to Whitewater Raft, how adventurous are you and your group?",
    options: [
      { label: "Stick to what I know", value: "low" },
      { label: "I like to try new things, but nothing too crazy", value: "medium" },
      { label: "I’m up for anything!", value: "high" },
      { label: "Not sure", value: "unsure" },
    ],
  },
  {
    id: "restrictions",
    type: "multi",
    title: "Any hard no’s we should know about?",
    options: [
      { label: "No alcohol", value: "noAlcohol" },
      { label: "Must be vegan / veggie friendly", value: "veganOnly" },
      { label: "No outdoor activities", value: "noOutdoor" },
      { label: "Open to anything", value: "open" },
    ],
    min: 0,
    max: 3,
  },
  {
    id: "animalType",
    type: "single",
    title: "Finally, pick an animal that represents you and your group",
    options: [
      { label: "Chill Cats", value: "chillCats" },
      { label: "Curious Foxes", value: "curiousFoxes" },
      { label: "Party Parrots", value: "partyParrots" },
      { label: "Explorer Bears", value: "explorerBears" },
      { label: "Wise Owls", value: "wiseOwls" },
      { label: "Bold Lions", value: "boldLions" },
      { label: "Playful Penguins", value: "playfulPenguins" },
      { label: "Creative Octopi", value: "creativeOctopi" },
    ],
  },
];

/** ---------------------------
 *  Helpers
 *  --------------------------*/
const budgetToNumber = (v?: string): number | undefined => {
  if (!v) return;
  switch (v) {
    case "<50":
      return 40;
    case "50-100":
      return 80;
    case "100-200":
      return 150;
    case "200+":
      return 250;
    default:
      return;
  }
};

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

/** ---------------------------
 *  Mapping helpers
 *  --------------------------*/
function mapGroup(group?: string) {
  switch (group) {
    case "solo":
      return "Solo";
    case "date":
      return "DateNight";
    case "friends":
      return "Friends";
    case "family":
      return "Family";
    case "work":
      return "WorkCrew";
    default:
      return "Friends";
  }
}
function mapVibe(v?: string) {
  return v ? [v] : [];
}
function mapExperienceTagsToTone(tags?: string[]) {
  return tags && tags.length ? tags : [];
}
function mapFlavour(f?: string) {
  return f ? [f] : [];
}
function mapGroupSize(group?: string) {
  if (group === "solo") return 1;
  if (group === "date") return 2;
  return 4;
}
function mapAdventure(v?: string) {
  if (v === "low") return 1;
  if (v === "medium") return 2;
  if (v === "high") return 3;
  return 2;
}
function mapInvolvement(v?: string) {
  switch (v) {
    case "learn":
      return "LearnHandsOn";
    case "watch":
      return "WatchAndBeServed";
    case "collaborate":
      return "Collaborative";
    default:
      return "Anything";
  }
}
function mapRestrictions(r?: string[]) {
  if (!r || !r.length || r.includes("open")) return [];
  const out: string[] = [];
  if (r.includes("noAlcohol")) out.push("No alcohol");
  if (r.includes("veganOnly")) out.push("Must be vegan");
  if (r.includes("noOutdoor")) out.push("No outdoor activities");
  return out;
}

/** ---------------------------
 *  UI
 *  --------------------------*/
export default function QuizPage() {
  const router = useRouter();

  const [stepIndex, setStepIndex] = useState(0);
  const [state, setState] = useState<QuizState>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const step = STEPS[stepIndex];
  const total = STEPS.length;
  const progress = Math.round(((stepIndex + 1) / total) * 100);

  // focus text input when it shows
  useEffect(() => {
    if (step?.type === "text") inputRef.current?.focus();
  }, [stepIndex, step?.type]);

  const canGoBack = stepIndex > 0;
  const isLast = stepIndex === total - 1;

  /** Handlers */
  const go = (dir: 1 | -1) => setStepIndex((i) => clamp(i + dir, 0, total - 1));

  const setSingle = (id: Single, value: string, autoAdvance = true) => {
    setState((s) => {
      const next: QuizState = { ...s };
      if (id === "budget") next.budget_pp = budgetToNumber(value);
      else (next as any)[id] = value;
      return next;
    });
    if (autoAdvance) {
      // tiny delay for nicer UX
      setTimeout(() => (isLast ? handleSubmit() : go(1)), 120);
    }
  };

  const toggleMulti = (id: Multi, value: string) => {
    setState((s) => {
      const current = new Set([...(s[id] as string[] | undefined) || []]);
      if (current.has(value)) current.delete(value);
      else current.add(value);
      return { ...s, [id]: Array.from(current) };
    });
  };

  const canAdvanceFromMulti = useMemo(() => {
    if (step?.type !== "multi") return false;
    const picked = (state[step.id] as string[] | undefined) || [];
    const min = step.min ?? 0;
    const max = step.max ?? 999;
    return picked.length >= min && picked.length <= max;
  }, [step, state]);

  const handleSubmit = async () => {
  setSubmitting(true);
  setError(null);
  setResults(null);

  // ---- payload your /api/recommend understands ----
  const payload = {
    mode: state.location === "home" ? "Home" : "Out",
    group: mapGroup(state.group),
    vibe: mapVibe(state.vibe),
    tone: mapExperienceTagsToTone(state.experienceTags),
    flavour: mapFlavour(state.flavourProfile),
    budget_pp: state.budget_pp ?? 100,
    party_size: mapGroupSize(state.group),
    adventure: mapAdventure(state.adventureLevel),
    involvement: mapInvolvement(state.involvement),
    hard_nos: mapRestrictions(state.restrictions),
    explain: false,
  };

  // keep data in outer scope so we can use it after the try/catch
  let data: any = null;

  // ---- fetch recommendations ----
  try {
    const r = await fetch("/api/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    data = await r.json();
    if (!r.ok) throw new Error(data?.error || "Failed to get results");

    setResults(Array.isArray(data) ? data : data.results || data);
  } catch (e: any) {
    setError(e.message || "Unknown error");
  } finally {
    setSubmitting(false);
  }

  // ---- save the quiz lead to Airtable (after we have results) ----
  try {
    const selectedIds =
      Array.isArray(data)
        ? data.map((r: any) => r.id)
        : Array.isArray(data?.results)
        ? data.results.map((r: any) => r.id)
        : [];

    await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: state.name,
        quiz: state,
        selectedIds,
        payload,
      }),
    });
  } catch (err) {
    // non-blocking; we already showed results
    console.error("Failed to save lead to Airtable:", err);
  }
};
  /** Renderers */
  const renderButtons = (opts: { label: string; value: string }[], id: Single) => (
    <div className="grid">
      {opts.map((o) => (
        <button
          key={o.value}
          onClick={() => setSingle(id, o.value, true)}
          className="btn"
          type="button"
        >
          {o.label}
        </button>
      ))}
    </div>
  );

  const renderMulti = (opts: { label: string; value: string }[], id: Multi) => {
    const picked = new Set([...(state[id] as string[] | undefined) || []]);
    const toggle = (v: string) => toggleMulti(id, v);

    return (
      <>
        <div className="grid">
          {opts.map((o) => {
            const active = picked.has(o.value);
            return (
              <button
                key={o.value}
                onClick={() => toggle(o.value)}
                className={`btn ${active ? "active" : ""}`}
                aria-pressed={active}
                type="button"
              >
                {o.label}
              </button>
            );
          })}
        </div>

        <div className="actions">
          {canGoBack && (
            <button className="link" onClick={() => go(-1)} type="button">
              Back
            </button>
          )}
          <button
            className="primary"
            disabled={!canAdvanceFromMulti}
            onClick={() => (isLast ? handleSubmit() : go(1))}
            type="button"
          >
            {isLast ? "See your matches" : "Next"}
          </button>
        </div>
      </>
    );
  };

  /** Final UI */
  return (
    <main className="wrap">
      <div className="progress">
        <div className="bar" style={{ width: `${progress}%` }} />
      </div>

      {!results && (
        <section className="card">
          {step.type === "text" && (
            <>
              <h1>{step.title}</h1>
              {step.subtitle && <p className="sub">{step.subtitle}</p>}
              <input
                ref={inputRef}
                className="input"
                placeholder={step.placeholder}
                defaultValue={state.name || ""}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const name = (e.target as HTMLInputElement).value.trim();
                    setState((s) => ({ ...s, name }));
                    go(1);
                  }
                }}
                onBlur={(e) =>
                  setState((s) => ({ ...s, name: e.target.value.trim() }))
                }
              />
              <div className="actions">
                {canGoBack && (
                  <button className="link" onClick={() => go(-1)} type="button">
                    Back
                  </button>
                )}
                <button
                  className="primary"
                  onClick={() => go(1)}
                  disabled={!state.name}
                  type="button"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step.type === "single" && (
            <>
              <h1>{step.title}</h1>
              {step.subtitle && <p className="sub">{step.subtitle}</p>}
              {renderButtons(step.options, step.id)}
              {canGoBack && (
                <div className="actions">
                  <button className="link" onClick={() => go(-1)} type="button">
                    Back
                  </button>
                </div>
              )}
            </>
          )}

          {step.type === "multi" && (
            <>
              <h1>{step.title}</h1>
              {step.subtitle && <p className="sub">{step.subtitle}</p>}
              {renderMulti(step.options, step.id)}
            </>
          )}
        </section>
      )}

      {submitting && (
        <section className="card">
          <h1>Finding your matches…</h1>
          <p className="sub">We’re searching Epicurean experiences for you.</p>
        </section>
      )}

      {error && !submitting && (
        <section className="card">
          <h1>Something went wrong</h1>
          <p className="sub">{error}</p>
          <button className="primary" onClick={() => setError(null)} type="button">
            Try again
          </button>
        </section>
      )}

      {results && !submitting && (
        <section className="card">
          <h1>Your recommendations</h1>
          <ul className="list">
            {results.map((r: any, i: number) => (
              <li key={r?.id || i} className="result">
                <div className="title">
                  {r?.title || r?.fields?.Title || "Untitled Experience"}
                </div>
                <div className="meta">
                  <span>
                    {(r?.format || r?.fields?.Format) ?? "—"} ·{" "}
                    {(r?.cuisine || r?.fields?.Cuisine_Focus) ?? "—"}
                  </span>
                </div>
                <div className="desc">
                  {r?.description || r?.fields?.Description || "—"}
                </div>
              </li>
            ))}
          </ul>
          <div className="actions">
            <button className="link" onClick={() => setResults(null)} type="button">
              Restart quiz
            </button>
          </div>
        </section>
      )}

      <style jsx>{`
  /* ------------- Theme tokens ------------- */
  :root {
    /* current dark theme (fallback) */
    --bg: #0f1217;
    --text: #ffffff;
    --muted: #9ca3af;
    --border: #2a2f3a;
    --card: #111318;
    --accent: #10b981;         /* progress + primary */
    --accent-contrast: #00100b; /* text on accent */
    --pill: #0f1217;
  }

  /* Epicurean light theme to match your site */
  [data-theme="epicurean"] {
    --bg: #0e0e0c;              /* page behind the card (subtle very dark/black) */
    --card: #efe7db;            /* warm parchment card */
    --text: #0e0e0c;            /* near-black text */
    --muted: #6f6a60;           /* muted copy */
    --border: #d1c7b8;          /* warm border */
    --accent: #0e0e0c;          /* dark button + progress */
    --accent-contrast: #efe7db; /* text on dark buttons */
    --pill: #eadfcf;            /* option tiles background */
  }

  /* ------------- Structure ------------- */
  .wrap {
    max-width: 820px;
    margin: 40px auto;
    padding: 0 16px;
    color: var(--text);
    background: transparent; /* keep page background transparent for iframe */
  }
  .progress {
    height: 6px;
    background: var(--border);
    border-radius: 999px;
    overflow: hidden;
    margin-bottom: 16px;
  }
  .bar {
    height: 100%;
    background: var(--accent);
    transition: width 220ms ease;
  }
  .card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 28px;
  }
  h1 {
    font-size: 28px;
    line-height: 1.2;
    margin: 0 0 6px;
  }
  .sub {
    color: var(--muted);
    margin: 0 0 18px;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 12px;
  }

  .btn {
    width: 100%;
    text-align: left;
    background: var(--pill);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 16px 18px;
    transition: transform 120ms ease, border-color 120ms ease, background 120ms ease;
  }
  .btn:hover {
    border-color: var(--text);
    transform: translateY(-1px);
  }
  .btn.active {
    border-color: var(--accent);
    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--accent), transparent 70%);
  }

  .input {
    width: 100%;
    background: var(--pill);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 14px 16px;
    margin-bottom: 16px;
  }

  .actions {
    display: flex;
    justify-content: space-between;
    margin-top: 14px;
    gap: 12px;
  }
  .link {
    background: transparent;
    border: 1px dashed var(--border);
    color: var(--muted);
    border-radius: 10px;
    padding: 10px 12px;
  }
  .primary {
    background: var(--accent);
    color: var(--accent-contrast);
    border: none;
    border-radius: 12px;
    padding: 12px 16px;
    min-width: 160px;
    font-weight: 600;
  }
  .primary:disabled {
    opacity: 0.5;
  }

  .list {
    list-style: none;
    padding: 0;
    margin: 10px 0 0;
    display: grid;
    gap: 12px;
  }
  .result {
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 14px;
    background: var(--pill);
  }
  .title {
    font-weight: 700;
    margin-bottom: 4px;
    color: var(--text);
  }
  .meta {
    color: var(--muted);
    font-size: 14px;
    margin-bottom: 8px;
  }
  .desc {
    color: var(--text);
    opacity: 0.9;
  }
`}</style>
    </main>
  );
}
