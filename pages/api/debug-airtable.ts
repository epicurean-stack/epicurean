// pages/api/debug-airtable.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const AIRTABLE = process.env.AIRTABLE_URL || "";
  const BASE = process.env.AIRTABLE_BASE_ID || "";
  const TOKEN = process.env.AIRTABLE_TOKEN || "";

  const url = `${AIRTABLE}/${BASE}/Experiences?pageSize=1`;

  try {
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const text = await r.text();
    return res.status(r.status).json({
      status: r.status,
      url,
      env: {
        has_url: !!AIRTABLE,
        has_base: !!BASE,
        token_len: TOKEN?.length ?? 0,
        base_len: BASE?.length ?? 0,
      },
      detail: text,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Unknown error" });
  }
}
// export default function handler(req, res) {
//   res.status(403).json({ message: "Debug route disabled" });
// }
