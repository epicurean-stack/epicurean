// pages/api/lead.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  try {
    const AIRTABLE = process.env.AIRTABLE_URL!;
    const BASE = process.env.AIRTABLE_BASE_ID!;
    const TOKEN = process.env.AIRTABLE_TOKEN!;
    const LEADS_TABLE = process.env.AIRTABLE_LEADS_TABLE || "Leads";

    if (!AIRTABLE || !BASE || !TOKEN) {
      return res.status(500).json({ error: "Missing Airtable env vars" });
    }

    const { name, quiz, selectedIds, payload } = req.body || {};

    const fields: Record<string, any> = {
      Name: name || "",
      QuizJSON: JSON.stringify(quiz || {}),
      SelectedExperienceIds: (selectedIds || []).join(","),
      BudgetPP: payload?.budget_pp ?? null,
      Group: payload?.group ?? null,
      CreatedAt: new Date().toISOString(),
    };

    const r = await fetch(`${AIRTABLE}/${BASE}/${encodeURIComponent(LEADS_TABLE)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ records: [{ fields }] }),
    });

    const text = await r.text();
    if (!r.ok) return res.status(r.status).json({ error: "Airtable error", detail: text });

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || "Unknown error" });
  }
}
