// pages/quiz.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { AnimatePresence, motion } from "framer-motion";

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
    title: "Let’s start on a first-name basis.",
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
      { label: "Work crew", value: "work" },
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
      { label: "Bold & rich", value: "boldRich" },
      { label: "Fresh & zesty", value: "freshZesty" },
      { label: "Sweet & indulgent", value: "sweetIndulgent" },
      { label: "Savoury & earthy", value: "savouryEarthy" },
      { label: "Herbaceous", value: "herbaceous" },
      { label: "Not sure", value: "unsure" },
    ],
  },
  {
    id: "budget",
    type: "single",
    title: "What’s your budget sweet spot per person?",
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
      "On a scale of bubble bath to white-water raft, how adventurous are you and your group?",
    options: [
      { label: "Stick to what I know", value: "low" },
      {
        label: "I like to try new things, but nothing too crazy",
        value: "medium",
      },
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
      { label: "Chill cats", value: "chillCats" },
      { label: "Curious foxes", value: "curiousFoxes" },
      { label: "Party parrots", value: "partyParrots" },
      { label: "Explorer bears", value: "explorerBears" },
      { label: "Wise owls", value: "wiseOwls" },
      { label: "Bold lions", value: "boldLions" },
      { label: "Playful penguins", value: "playfulPenguins" },
      { label: "Creative octopi", value: "creativeOctopi" },
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

    let data: any = null;

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

    // Non-blocking lead save
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
          className="option"
          type="button"
        >
          <span className="label">{o.label}</span>
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
                className={`option ${active ? "selected" : ""}`}
                aria-pressed={active}
                type="button"
              >
                <span className="label">{o.label}</span>
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

  const StepCard = ({ children }: { children: React.ReactNode }) => (
    <motion.section
      className="card"
      key={stepIndex}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      {children}
    </motion.section>
  );

  /** Final UI */
  return (
    <main className="wrap" data-theme="epicurean">
      <div className="progress">
        <div className="bar" style={{ width: `${progress}%` }} />
      </div>

      <AnimatePresence mode="wait">
        {!results && !submitting && !error && (
          <StepCard>
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
          </StepCard>
        )}

        {submitting && (
          <motion.section
            className="card"
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h1>Finding your matches…</h1>
            <p className="sub">We’re searching Epicurean experiences for you.</p>
          </motion.section>
        )}

        {error && !submitting && (
          <motion.section
            className="card"
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h1>Something went wrong</h1>
            <p className="sub">{error}</p>
            <button className="primary" onClick={() => setError(null)} type="button">
              Try again
            </button>
          </motion.section>
        )}

        {results && !submitting && (
          <motion.section
            className="card"
            key="results"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1>Your recommendations</h1>
            <ul className="list">
              {results.map((r: any, i: number) => (
                <li key={r?.id || i} className="result">
                  <div className="title">
                    {r?.title || r?.fields?.Title || "Untitled experience"}
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
          </motion.section>
        )}
      </AnimatePresence>

     <style jsx>{`
  /* ----------- THEME ----------- */
  [data-theme="epicurean"] {
    --bg: #000000;
    --card: #111111;
    --text: #f7f2e9;
    --muted: #b8b2a9;
    --border: #2b2b2b;
    --accent: #f7f2e9;
    --accent-contrast: #000;
    --pill: #1a1a1a;
    --pill-muted: #2a2a2a;
    --shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
    --shadow-soft: 0 4px 10px rgba(0, 0, 0, 0.3);
  }

  /* ----------- WRAPPER ----------- */
  .wrap {
    max-width: 920px;
    margin: 80px auto;
    padding: 0 24px 80px;
    color: var(--text);
  }

  .progress {
    height: 6px;
    background: #333;
    border-radius: 999px;
    overflow: hidden;
    margin-bottom: 32px;
  }
  .bar {
    height: 100%;
    background: var(--accent);
    transition: width 220ms ease;
  }

  /* ----------- CARD ----------- */
  .card {
    background: var(--card);
    border-radius: 28px;
    padding: 50px 42px;
    box-shadow: var(--shadow-soft);
  }

  /* ----------- HEADINGS ----------- */
  h1 {
    font-size: 48px;
    line-height: 1.1;
    margin: 0 0 20px;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: var(--text);
    text-align: center;
  }

  .sub {
    text-align: center;
    margin-bottom: 36px;
    color: var(--muted);
    font-size: 20px;
  }

/* --- GRID: Big tiles, generous spacing --- */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 32px; /* BIGGER spacing */
  margin-top: 32px;
}

/* --- OPTION TILE: Much larger, boxy, playful --- */
.option {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--pill);
  color: var(--text);
  border: 3px solid var(--border);
  border-radius: 26px;
  padding: 40px 28px;   /* Big tall card style */
  min-height: 220px;    /* Taller like GPD cards */
  text-align: center;
  cursor: pointer;

  transition: 
    transform 180ms ease,
    box-shadow 180ms ease,
    border-color 180ms ease,
    background 180ms ease;

  box-shadow: var(--shadow-soft);
}

/* --- Label inside card --- */
.option .label {
  font-size: 24px;
  line-height: 1.25;
  font-weight: 700;
  letter-spacing: -0.01em;
}

/* --- Hover: playful lift --- */
.option:hover {
  transform: translateY(-6px) scale(1.02);
  border-color: var(--text);
  background: var(--pill-muted);
  box-shadow: var(--shadow);
}

/* --- Selected: bold outline, warm fill --- */
.option.selected {
  border-color: var(--accent);
  background: var(--pill-muted);
  box-shadow: var(--shadow);
  transform: translateY(-4px) scale(1.01);
}

  /* ----------- INPUT ----------- */
  .input {
    width: 100%;
    background: #ffffff;
    color: #000;
    border-radius: 16px;
    border: none;
    padding: 18px 20px;
    font-size: 18px;
    margin-bottom: 20px;
  }

  /* ----------- BUTTONS ----------- */
  .actions {
    margin-top: 40px;
    display: flex;
    justify-content: center;
    gap: 20px;
  }

  .primary {
    background: var(--accent);
    color: var(--accent-contrast);
    border: none;
    padding: 18px 32px;
    border-radius: 16px;
    font-weight: 700;
    font-size: 18px;
    min-width: 200px;
    cursor: pointer;
    transition: background 160ms ease, transform 160ms ease;
  }
  .primary:hover:not(:disabled) {
    transform: translateY(-3px);
    background: #fff1dc;
    color: #000;
  }

  .link {
    background: transparent;
    border: none;
    color: var(--muted);
    font-size: 18px;
    text-decoration: underline;
    cursor: pointer;
  }
`}
</style>
    </main>
  );
}
