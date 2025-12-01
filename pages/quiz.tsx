// pages/quiz.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
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
  budget?: string; // raw value from buttons
  budget_pp?: number; // numeric version sent to API
  adventureLevel?: string;
  restrictions?: string[];
  animalType?: string;
};

type Step =
  | {
      id: "name";
      type: "text";
    }
  | {
      id: Single;
      type: "single";
      options: { label: string; value: string }[];
    }
  | {
      id: Multi;
      type: "multi";
      options: { label: string; value: string }[];
      min?: number;
      max?: number;
    };

/** ---------------------------
 *  Step configuration (options)
 *  Copy for headings is handled in renderHeading()
 *  --------------------------*/
const STEPS: Step[] = [
  { id: "name", type: "text" },
  {
    id: "vibe",
    type: "single",
    options: [
      { label: "A cosy night in", value: "cosy" },
      { label: "A big night out", value: "bigNightOut" },
      { label: "An outdoor adventure", value: "outdoorAdventure" },
      { label: "A chance to learn something new", value: "learnSomething" },
      { label: "Surprise me", value: "surprise" },
    ],
  },
  {
    id: "group",
    type: "single",
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
    options: [
      { label: "A delicious meal", value: "meal" },
      { label: "A cooking experience", value: "foodExperience" },
      { label: "A boozy tasting session", value: "tasting" },
      { label: "Exploring an area", value: "exploring" },
      { label: "Something totally unique", value: "unique" },
      { label: "A cultural experience", value: "cultural" },
      { label: "No preference", value: "noPreference" },
    ],
  },
  {
    id: "involvement",
    type: "single",
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
    min: 2,
    max: 3,
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
      { label: "Emotional", value: "emotional" },
    ],
  },
  {
    id: "budget",
    type: "single",
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

/** Mapping helpers for /api/recommend payload */
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

  const canGoBack = stepIndex > 0;
  const isLast = stepIndex === total - 1;

  // focus text input when name step shows
  useEffect(() => {
    if (step.id === "name") inputRef.current?.focus();
  }, [stepIndex, step.id]);

  /** Navigation helpers */
  const go = (dir: 1 | -1) =>
    setStepIndex((i) => clamp(i + dir, 0, total - 1));

  const setSingle = (id: Single, value: string) => {
    setState((s) => {
      const next: QuizState = { ...s };
      if (id === "budget") {
        next.budget = value;
        next.budget_pp = budgetToNumber(value);
      } else {
        (next as any)[id] = value;
      }
      return next;
    });
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
    if (step.type !== "multi") return false;
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

    // non-blocking lead save
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

  /** Heading copy based on step */
  const renderHeading = () => {
    switch (step.id) {
      case "name":
        return (
          <>
            <p className="eyebrow">Let&apos;s start on a first-name basis.</p>
            <h1>What should we call you?</h1>
          </>
        );
      case "vibe": {
        const name = state.name?.trim();
        return (
          <>
            <p className="eyebrow">
              {name ? `Nice to meet you, ${name}!` : "Nice to meet you!"}
            </p>
            <h1>So, what kind of vibe are you going for?</h1>
          </>
        );
      }
      case "group":
        return (
          <>
            <p className="eyebrow">Sounds lovely!</p>
            <h1>Who are you planning to gather with?</h1>
          </>
        );
      case "location":
        return (
          <>
            <p className="eyebrow">Cool!</p>
            <h1>And, where do you want it to happen?</h1>
          </>
        );
      case "foodType":
        return (
          <>
            <p className="eyebrow">
              Awesome! We&apos;ve definitely got something for you.
            </p>
            <h1>Just to check, have you got any initial ideas?</h1>
          </>
        );
      case "involvement":
        return (
          <>
            <p className="eyebrow">Got it!</p>
            <h1>So, how involved do you want to be?</h1>
          </>
        );
      case "experienceTags":
        return (
          <>
            <p className="eyebrow">
              And, how would you describe your perfect experience?
            </p>
            <h1>[pick 2–3]</h1>
          </>
        );
      case "budget":
        return (
          <>
            <p className="eyebrow">Almost there!</p>
            <h1>What&apos;s your budget sweet spot per person?</h1>
          </>
        );
      case "adventureLevel":
        return (
          <>
            <p className="eyebrow">
              On a scale of Bubble Bath to Whitewater Raft…
            </p>
            <h1>How adventurous are you and your group?</h1>
          </>
        );
      case "restrictions":
        return (
          <>
            <h1>Any hard no&apos;s we should know about?</h1>
          </>
        );
      case "animalType":
        return (
          <>
            <p className="eyebrow">And lastly, just for fun…</p>
            <h1>Which animal best represents your group?</h1>
          </>
        );
      default:
        return <h1>Epicurean Quiz</h1>;
    }
  };

  /** Render helpers for options */
const renderButtons = (
  opts: { label: string; value: string }[],
  id: Single,
  selectedValue?: string
) => (
  <div className="options-grid">
    {opts.map((o) => {
      const selected = selectedValue === o.value;
      return (
        <div
          key={o.value}
          role="button"
          tabIndex={0}
          className={`option-card ${selected ? "selected" : ""}`}
          onClick={() => setSingle(id, o.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setSingle(id, o.value);
            }
          }}
        >
          <span className="option-label">{o.label}</span>
        </div>
      );
    })}
  </div>
);

  const renderMulti = (opts: { label: string; value: string }[], id: Multi) => {
  const picked = new Set([...(state[id] as string[] | undefined) || []]);
  const toggle = (v: string) => toggleMulti(id, v);

  return (
    <>
      <div className="options-grid">
        {opts.map((o) => {
          const active = picked.has(o.value);
          return (
            <div
              key={o.value}
              role="button"
              tabIndex={0}
              className={`option-card ${active ? "selected" : ""}`}
              onClick={() => toggle(o.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggle(o.value);
                }
              }}
            >
              <span className="option-label">{o.label}</span>
            </div>
          );
        })}
      </div>

      <div className="actions">
        {canGoBack && (
          <button
            className="secondary-btn"
            type="button"
            onClick={() => go(-1)}
          >
            Back
          </button>
        )}
        <button
          className="primary-btn"
          type="button"
          disabled={!canAdvanceFromMulti}
          onClick={() => (isLast ? handleSubmit() : go(1))}
        >
          {isLast ? "See your matches" : "Next"}
        </button>
      </div>
    </>
  );
};
  /** Single-step “Next” button enablement */
  const singleSelectedValue =
    step.type === "single"
      ? step.id === "budget"
        ? state.budget
        : ((state as any)[step.id] as string | undefined)
      : undefined;

  /** ---------------- Render ---------------- */
  return (
    <main className="quiz-page">
      <header className="quiz-header">
        <Link href="/" className="logo">
          EPICUREAN
        </Link>
      </header>

      <div className="progress">
        <div className="bar" style={{ width: `${progress}%` }} />
      </div>

      {!results && !submitting && !error && (
        <section className="step-card">
          <div className="step-heading">{renderHeading()}</div>

          {step.type === "text" && (
            <>
              <div className="name-input-wrap">
                <input
                  ref={inputRef}
                  className="name-input"
                  placeholder="[Free text]"
                  defaultValue={state.name || ""}
                  onChange={(e) =>
                    setState((s) => ({ ...s, name: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && state.name?.trim()) {
                      go(1);
                    }
                  }}
                />
              </div>
              <div className="actions">
                {canGoBack && (
                  <button
                    className="secondary-btn"
                    type="button"
                    onClick={() => go(-1)}
                  >
                    Back
                  </button>
                )}
                <button
                  className="primary-btn"
                  type="button"
                  disabled={!state.name?.trim()}
                  onClick={() => go(1)}
                >
                  Next
                </button>
              </div>
            </>
          )}

          {step.type === "single" && (
            <>
              {renderButtons(step.options, step.id, singleSelectedValue)}
              <div className="actions">
                {canGoBack && (
                  <button
                    className="secondary-btn"
                    type="button"
                    onClick={() => go(-1)}
                  >
                    Back
                  </button>
                )}
                <button
                  className="primary-btn"
                  type="button"
                  disabled={!singleSelectedValue}
                  onClick={() => (isLast ? handleSubmit() : go(1))}
                >
                  {isLast ? "See your matches" : "Next"}
                </button>
              </div>
            </>
          )}

          {step.type === "multi" && renderMulti(step.options, step.id)}
        </section>
      )}

      {submitting && (
        <section className="step-card">
          <div className="step-heading">
            <h1>Finding your matches…</h1>
            <p className="eyebrow">
              We&apos;re searching Epicurean experiences for you.
            </p>
          </div>
        </section>
      )}

      {error && !submitting && (
        <section className="step-card">
          <div className="step-heading">
            <h1>Something went wrong</h1>
            <p className="eyebrow">{error}</p>
          </div>
          <div className="actions">
            <button
              className="primary-btn"
              type="button"
              onClick={() => setError(null)}
            >
              Try again
            </button>
          </div>
        </section>
      )}

      {results && !submitting && (
        <section className="step-card">
          <div className="step-heading">
            <h1>Your Epicurean matches</h1>
            <p className="eyebrow">
              Here are a few experiences we think you&apos;ll love.
            </p>
          </div>
          <div className="results-grid">
            {results.map((r: any, i: number) => (
              <div key={r?.id || i} className="result-card">
                <div className="result-title">
                  {r?.title || r?.fields?.Title || "Untitled experience"}
                </div>
                <div className="result-meta">
                  {(r?.format || r?.fields?.Format) ?? "—"} ·{" "}
                  {(r?.cuisine || r?.fields?.Cuisine_Focus) ?? "—"}
                </div>
                <div className="result-desc">
                  {r?.description || r?.fields?.Description || "—"}
                </div>
              </div>
            ))}
          </div>
          <div className="actions">
            <button
              className="secondary-btn"
              type="button"
              onClick={() => {
                setResults(null);
                setStepIndex(0);
                setState({});
              }}
            >
              Restart quiz
            </button>
          </div>
        </section>
      )}

      <style jsx>{`
        .quiz-page {
          min-height: 100vh;
          background: #050505;
          color: #f5ecdd;
          padding: 24px 24px 80px;
        }

        .quiz-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1120px;
          margin: 0 auto 16px;
        }

        .logo {
          font-family: "Cormorant Garamond", "Times New Roman", serif;
          letter-spacing: 0.18em;
          font-size: 16px;
          padding: 8px 18px;
          border-radius: 999px;
          border: 1px solid rgba(245, 236, 221, 0.5);
          text-transform: uppercase;
          text-decoration: none;
          color: #f5ecdd;
          background: rgba(5, 5, 5, 0.7);
        }

        .progress {
          max-width: 1120px;
          margin: 0 auto 40px;
          height: 6px;
          background: #222;
          border-radius: 999px;
          overflow: hidden;
        }

        .bar {
          height: 100%;
          background: #f5ecdd;
          transition: width 200ms ease-out;
        }

        .step-card {
          max-width: 1120px;
          margin: 0 auto;
          text-align: center;
        }

        .step-heading {
          max-width: 760px;
          margin: 0 auto 40px;
        }

       h1 {
  font-family: "Cormorant Garamond", "Times New Roman", serif;
  font-size: 44px; /* was 40px */
  line-height: 1.16;
  letter-spacing: 0.02em;
  margin: 6px 0 0;
}

        .eyebrow {
         font-family: "Cormorant Garamond", "Times New Roman", serif;
  font-size: 44px; /* was 40px */
  line-height: 1.16;
  letter-spacing: 0.02em;
  margin: 6px 0 0;
        }

        .name-input-wrap {
          margin: 32px auto 0;
          max-width: 520px;
        }

        .name-input {
          width: 100%;
          padding: 14px 18px;
          border-radius: 8px;
          border: 1px solid #4a4339;
          background: #0b0b0b;
          color: #f5ecdd;
          font-size: 16px;
        }

        .name-input::placeholder {
          color: #6f675c;
        }

        /* GPD-style option grid */
        .options-grid {
          margin: 40px auto 0;
          max-width: 900px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
          gap: 28px;
          justify-content: center;
        }

        /* Increase specificity so we override any global button styles */
        button.option-card {
          border-radius: 18px;
          border: 1px solid #3a342b;
          background: rgba(255, 255, 255, 0.02);
          color: #f5ecdd;
          padding: 30px 18px;
          min-height: 190px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          cursor: pointer;
          transition: all 150ms ease-out;
          box-shadow: 0 14px 28px rgba(0, 0, 0, 0.45);
        }

        button.option-card:hover {
          border-color: #f5ecdd;
          background: rgba(245, 236, 221, 0.07);
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
        }

        button.option-card.selected {
          background: #f5ecdd;
          color: #111;
          border-color: #f5ecdd;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
        }

        .option-label {
          font-size: 16px;
          line-height: 1.4;
          font-weight: 600;
        }

        .actions {
          margin: 32px auto 0;
          max-width: 900px;
          display: flex;
          justify-content: center;
          gap: 16px;
        }

        .primary-btn,
        .secondary-btn {
          padding: 11px 24px;
          border-radius: 999px;
          font-size: 15px;
          cursor: pointer;
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        .primary-btn {
          background: #f5ecdd;
          color: #111;
          border: none;
        }

        .primary-btn:disabled {
          opacity: 0.5;
          cursor: default;
        }

        .secondary-btn {
          background: transparent;
          color: #d4caba;
          border: 1px dashed #6a5f4f;
        }

        .results-grid {
          margin: 40px auto 0;
          max-width: 1040px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 24px;
        }

        .result-card {
          border-radius: 18px;
          border: 1px solid #3a342b;
          background: rgba(255, 255, 255, 0.02);
          padding: 20px 18px 22px;
          text-align: left;
        }

        .result-title {
          font-weight: 700;
          font-size: 18px;
          margin-bottom: 6px;
        }

        .result-meta {
          font-size: 14px;
          color: #b0a494;
          margin-bottom: 8px;
        }

        .result-desc {
          font-size: 15px;
          color: #f0e6d7;
        }

        @media (max-width: 768px) {
          .quiz-page {
            padding: 16px 16px 56px;
          }

          .quiz-header {
            margin-bottom: 12px;
          }

          .progress {
            margin-bottom: 28px;
          }

          .step-heading {
            margin-bottom: 28px;
          }

          h1 {
            font-size: 30px;
          }

          .options-grid {
            grid-template-columns: 1fr;
            max-width: 480px;
          }

          button.option-card {
            min-height: 150px;
          }
        }
      `}</style>
    </main>
  );
}
