import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const AIRTABLE = (process.env.AIRTABLE_URL || "").replace(/\/$/, "");
  const BASE = process.env.AIRTABLE_BASE_ID;
  const TOKEN = process.env.AIRTABLE_TOKEN;

  try {
    const response = await fetch(`${AIRTABLE}/${BASE}/Experiences?pageSize=50`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const data = await response.json();

    // Map to simplified structure
    const clean = (data.records || []).map((r: any) => ({
      id: r.id,
      title: r.fields["Title"],
      format: r.fields["Format"],
      cuisine: r.fields["Cuisine Focus"],
      vibe: r.fields["Vibe"],
      minPrice: r.fields["Price Per Person (Min)"],
      maxPrice: r.fields["Price Per Person (Max)"],
      description: r.fields["Description"],
    }));

    return res.status(200).json(clean);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Unknown error" });
  }
}
