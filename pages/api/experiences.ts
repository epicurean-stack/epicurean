import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const AIRTABLE = process.env.AIRTABLE_URL!;
    const BASE = process.env.AIRTABLE_BASE_ID!;
    const TOKEN = process.env.AIRTABLE_TOKEN!;

    if (!AIRTABLE || !BASE || !TOKEN) {
      return res.status(500).json({ error: "Missing Airtable env vars" });
    }

    // Reads the api_public view of your Experiences table
    const url = `${AIRTABLE}/${BASE}/Experiences?view=api_public&pageSize=10`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });

    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).json({ error: `Airtable ${r.status}`, detail: text });
    }

    const data = await r.json();
    res.status(200).json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Unknown error" });
  }
}


