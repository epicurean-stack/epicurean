// pages/api/experience-by-ids.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

  try {
    const AIRTABLE = process.env.AIRTABLE_URL!;
    const BASE = process.env.AIRTABLE_BASE_ID!;
    const TOKEN = process.env.AIRTABLE_TOKEN!;
    if (!AIRTABLE || !BASE || !TOKEN) {
      return res.status(500).json({ error: "Missing Airtable env vars" });
    }

    const idsParam = (req.query.ids as string) || "";
    const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);
    if (!ids.length) return res.status(400).json({ error: "ids is required" });

    // FILTER: OR(RECORD_ID()='id1', RECORD_ID()='id2', ...)
    const formula = `OR(${ids.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
    const url =
      `${AIRTABLE}/${BASE}/Experiences?view=api_public` +
      `&filterByFormula=${encodeURIComponent(formula)}` +
      `&pageSize=${Math.max(10, ids.length)}`;

    const r = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
    const text = await r.text();
    if (!r.ok) return res.status(r.status).json({ error: "Airtable error", detail: text });

    const data = JSON.parse(text);
    // return a simple, front-end-friendly shape
    const results = (data.records || []).map((rec: any) => ({
      id: rec.id,
      ...rec.fields,
      title: rec.fields?.Title,
      format: rec.fields?.Format,
      cuisine: rec.fields?.Cuisine_Focus,
      description: rec.fields?.Description,
      minPrice: rec.fields?.["Price Per Person (Min)"],
      maxPrice: rec.fields?.["Price Per Person (Max)"],
    }));

    res.status(200).json({ results, count: results.length });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Unknown error" });
  }
}
