import type { NextApiRequest, NextApiResponse } from "next";

// ----- utils -----
async function getJson(url: string, token: string) {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

type AnyRec = Record<string, any>;

// normalize Airtable record -> flat object with lower_snake keys
function simplify(rec: AnyRec) {
  const out: AnyRec = { id: rec.id };
  const fields: AnyRec = rec.fields || {};
  for (const [k, v] of Object.entries(fields)) {
    const key = k.replace(/\W+/g, "_").toLowerCase(); // "Group Suitability" -> "group_suitability"
    out[key] = v;
  }
  return out;
}

function arr(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String);
  return String(v).split(",").map(s => s.trim());
}

function inRange(n: number, min?: number, max?: number) {
  if (Number.isFinite(min) && n < (min as number)) return false;
  if (Number.isFinite(max) && n > (max as number)) return false;
  return true;
}

// simple Jaccard-ish overlap score with cap
function overlapScore(have: string[], want: string[], weight = 1) {
  if (!have?.length || !want?.length) return 0;
  const set = new Set(have.map(s => s.toLowerCase()));
  const hits = want.map(s => s.toLowerCase()).filter(s => set.has(s)).length;
  const max = Math.min(have.length, want.length);
  return (hits / (max || 1)) * weight;
}

// ----- handler -----
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const AIRTABLE = process.env.AIRTABLE_URL!;
    const BASE = process.env.AIRTABLE_BASE_ID!;
    const TOKEN = process.env.AIRTABLE_TOKEN!;
    if (!AIRTABLE || !BASE || !TOKEN) {
      return res.status(500).json({ error: "Missing env vars" });
    }

    // parse incoming quiz
    const q = (typeof req.body === "string" ? JSON.parse(req.body) : req.body) || {};
    const mode = String(q.mode || "").toLowerCase();                 // "Out" | "Home" | "Virtual"
    const group = String(q.group || "").toLowerCase();               // "Friends", "DateNight", "Family", "WorkCrew"
    const budget = Number(q.budget_pp ?? 0);                         // per-person
    const party = Number(q.party_size ?? 2);                         // group size
    const vibe = arr(q.vibe);                                        // e.g. ["Cosy", "LearnSomething"]
    const tone = arr(q.tone);
    const flavour = arr(q.flavour);

    // 1) fetch Airtable
    const expRaw = await getJson(`${AIRTABLE}/${BASE}/Experiences?view=api_public&pageSize=100`, TOKEN);
    const exps: AnyRec[] = (expRaw.records || []).map(simplify);

    // 2) FILTER
    const filtered = exps.filter(e => {
      // mode must match exactly
      if (mode && String(e.mode || "").toLowerCase() !== mode) return false;

      // group suitability should include the group (if provided)
      if (group) {
        const groups = arr(e.group_suitability).map(s => s.toLowerCase());
        if (!groups.includes(group)) return false;
      }

      // price per person within [min, max] if user provided budget
      if (budget) {
        const minP = Number(e.price_per_person_min) || 0;
        const maxP = Number(e.price_per_person_max) || 99999;
        if (!inRange(budget, minP, maxP)) return false;
      }

      // party size within [min, max]
      const minParty = Number(e.min_party_size) || 1;
      const maxParty = Number(e.max_party_size) || 999;
      if (!inRange(party, minParty, maxParty)) return false;

      return true;
    });

    // 3) SCORE
    const scored = (filtered.length ? filtered : exps).map(e => {
      const sVibe = overlapScore(arr(e.vibe), vibe, 2);          // vibes weighted 2x
      const sTone = overlapScore(arr(e.tone_tags), tone, 1);
      const sFlav = overlapScore(arr(e.flavour_profile), flavour, 1);

      // price closeness bonus (smaller distance -> higher score)
      let sPrice = 0;
      if (budget) {
        const minP = Number(e.price_per_person_min) || budget;
        const maxP = Number(e.price_per_person_max) || budget;
        const mid = (minP + maxP) / 2;
        const diff = Math.abs(mid - budget);
        // normalize within a reasonable band (0..1)
        sPrice = Math.max(0, 1 - diff / Math.max(1, budget));
      }

      const score = sVibe + sTone + sFlav + sPrice * 0.5; // price bonus half-weight
      return { score, experience: e };
    });

    // 4) sort + return top N
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 5);

    return res.status(200).json({
      query: { mode, group, budget_pp: budget, party_size: party, vibe, tone, flavour },
      matched_count: filtered.length,
      results: top,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || "failed" });
  }
}

