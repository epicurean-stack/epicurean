// pages/api/recommend.ts
import type { NextApiRequest, NextApiResponse } from "next";

type Mode = "Home" | "Out";

type Experience = {
  id: string;
  title: string;
  description: string;
  format: string; // e.g. "Private dining", "Cook-along"
  cuisine: string;
  mode: Mode; // Home vs Out
  minParty: number;
  maxParty: number;
  minBudgetPP: number;
  maxBudgetPP: number;
  vibes: string[];        // e.g. ["cosy", "outdoorAdventure"]
  tone: string[];         // relaxed / social / etc
  flavour: string[];      // spicy / wine-forward / etc
  minAdventure: number;   // 1 low, 3 high
  maxAdventure: number;
  involvement: string;    // "LearnHandsOn" / "WatchAndBeServed" / "Collaborative" / "Anything"
  hardNos: string[];      // e.g. ["No alcohol", "Must be vegan"]
};

// TEMP: sample data – swap this for Airtable or a DB later
const EXPERIENCES: Experience[] = [
  {
    id: "1",
    title: "Cosy pasta night at home",
    description: "Private pasta-making class at your place, with wine and dessert.",
    format: "Cook-along",
    cuisine: "Italian",
    mode: "Home",
    minParty: 2,
    maxParty: 6,
    minBudgetPP: 80,
    maxBudgetPP: 150,
    vibes: ["cosy"],
    tone: ["relaxed", "social"],
    flavour: ["comforting"],
    minAdventure: 1,
    maxAdventure: 2,
    involvement: "LearnHandsOn",
    hardNos: [], // OK with alcohol, meat, etc
  },
  {
    id: "2",
    title: "Wine bar crawl in Surry Hills",
    description: "Guided hop between three natural wine bars with snacks at each stop.",
    format: "Guided crawl",
    cuisine: "Mixed",
    mode: "Out",
    minParty: 2,
    maxParty: 8,
    minBudgetPP: 100,
    maxBudgetPP: 250,
    vibes: ["bigNightOut"],
    tone: ["social", "adventurous"],
    flavour: ["wine-forward"],
    minAdventure: 2,
    maxAdventure: 3,
    involvement: "WatchAndBeServed",
    hardNos: ["No alcohol"],
  },
  {
    id: "3",
    title: "Outdoor fire-cooking feast",
    description: "Wood-fired feast in the bush, with seasonal local produce and storytelling.",
    format: "Outdoor feast",
    cuisine: "Australian",
    mode: "Out",
    minParty: 4,
    maxParty: 12,
    minBudgetPP: 150,
    maxBudgetPP: 300,
    vibes: ["outdoorAdventure"],
    tone: ["adventurous", "unique"],
    flavour: ["smoky"],
    minAdventure: 2,
    maxAdventure: 3,
    involvement: "Collaborative",
    hardNos: ["No outdoor activities"],
  },
  // add more here...
];

type RecommendRequest = {
  mode: Mode;
  group: string;
  vibe: string[];
  tone: string[];
  flavour: string[];
  budget_pp: number;
  party_size: number;
  adventure: number;       // 1–3
  involvement: string;
  hard_nos: string[];
  explain?: boolean;
};

type ScoredExperience = Experience & { score: number };

function scoreExperience(exp: Experience, prefs: RecommendRequest): number {
  let score = 0;

  // Hard filters – if these fail, score stays 0 and we can drop later
  if (exp.mode !== prefs.mode) return 0;
  if (prefs.party_size < exp.minParty || prefs.party_size > exp.maxParty) return 0;

  // Budget – reward if within range, small penalty if slightly off
  if (
    prefs.budget_pp >= exp.minBudgetPP &&
    prefs.budget_pp <= exp.maxBudgetPP
  ) {
    score += 30;
  } else {
    const diff =
      prefs.budget_pp < exp.minBudgetPP
        ? exp.minBudgetPP - prefs.budget_pp
        : prefs.budget_pp - exp.maxBudgetPP;
    if (diff < 30) score += 10; // close-ish
  }

  // Vibe overlap
  if (prefs.vibe.length) {
    const overlap = prefs.vibe.filter((v) => exp.vibes.includes(v)).length;
    score += overlap * 20;
  }

  // Tone / experience tags
  if (prefs.tone.length) {
    const overlap = prefs.tone.filter((t) => exp.tone.includes(t)).length;
    score += overlap * 8;
  }

  // Flavour
  if (prefs.flavour.length) {
    const overlap = prefs.flavour.filter((f) => exp.flavour.includes(f))
      .length;
    score += overlap * 6;
  }

  // Adventure level – reward closeness
  if (
    prefs.adventure >= exp.minAdventure &&
    prefs.adventure <= exp.maxAdventure
  ) {
    score += 12;
  } else {
    // small penalty if way off
    score -= 4;
  }

  // Involvement
  if (
    exp.involvement === "Anything" ||
    exp.involvement === prefs.involvement
  ) {
    score += 10;
  }

  // Respect hard no's – if any of user's hard_nos appear in experience.hardNos, drop
  if (prefs.hard_nos.length) {
    const conflict = prefs.hard_nos.some((no) => exp.hardNos.includes(no));
    if (conflict) return 0;
  }

  return score;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const prefs = req.body as RecommendRequest;

  const scored: ScoredExperience[] = EXPERIENCES.map((exp) => ({
    ...exp,
    score: scoreExperience(exp, prefs),
  }))
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6); // top 6

  return res.status(200).json(
    scored.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      format: e.format,
      cuisine: e.cuisine,
      score: e.score,
    }))
  );
}
