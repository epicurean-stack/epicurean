import type { NextApiRequest, NextApiResponse } from "next";

const AIRTABLE = process.env.AIRTABLE_URL!;
const BASE = process.env.AIRTABLE_BASE_ID!;
const TOKEN = process.env.AIRTABLE_TOKEN!;

// super simple score based on overlaps in "vibe" and budget
function score(exp: any, quiz: any) {
  let s = 0;
  if (quiz.vibe && Array.isArray(exp.vibe)) {
    const overlap = exp.vibe.filter((v: string) => quiz.vibe.includes(v)).length;
    s += overlap * 3;
  }
  if (quiz.budget_pp && exp.minPrice) {
    // reward if within budget; light penalty if over
    if (quiz.budget_pp >= exp.minPrice) s += 2;
    if (quiz.budget_pp < exp.minPrice) s -= 1;
  }
  return s;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
    const quiz = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});

    const r = await fetch(`${AIRTABLE}/${BASE}/Experiences?pageSize=100`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    if (!r.ok) return res.status(r.status).json({ error: "Airtable error" });

    const raw = await r.json();

    // flatten/simplify like /api/experiences
    const items = (raw.records || []).map((rec: any) => {
      const f = rec.fields || {};
      return {
        id: rec.id,
        title: f["Title"],
        format: f["Format"],
        cuisine: f["Cuisine Focus"],
        vibe: f["Vibe"] || [],
        minPrice: f["Price Per Person (Min)"],
        maxPrice: f["Price Per Person (Max)"],
        description: f["Description"],
      };
    });

    // score + top 5
    const ranked = items
      .map((x: any) => ({ ...x, _score: score(x, quiz) }))
      .sort((a: any, b: any) => b._score - a._score)
      .slice(0, 5);

    return res.status(200).json({ quiz, results: ranked });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || "Unknown error" });
  }
}
