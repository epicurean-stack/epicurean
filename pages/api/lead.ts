// pages/api/lead.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const AIRTABLE = process.env.AIRTABLE_URL;
  const BASE = process.env.AIRTABLE_BASE_ID;
  const TOKEN = process.env.AIRTABLE_TOKEN;
  const TABLE = process.env.AIRTABLE_LEADS_TABLE || "Leads";

  if (!AIRTABLE || !BASE || !TOKEN) {
    return res.status(500).json({ error: "Missing Airtable env vars" });
  }

  try {
    const { name, quiz, selectedIds, payload } = req.body || {};
    // Minimal validation
    if (!quiz) return res.status(400).json({ error: "Missing quiz payload" });

    const url = `${AIRTABLE}/${BASE}/${encodeURIComponent(TABLE)}`;
    const fields: Record<string, any> = {
      Name: name || "",
      QuizJSON: JSON.stringify(quiz),
      SelectedExperienceIds: Array.isArray(selectedIds) ? selectedIds.join(",") : "",
      BudgetPP: payload?.budget_pp ?? null,
      Group: payload?.group ?? null,
    };

    const r = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ records: [{ fields }] }),
    });

    const text = await r.text();
    if (!r.ok) {
      return res.status(r.status).json({ error: "Airtable error", detail: text });
    }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Unknown error" });
  }
}
