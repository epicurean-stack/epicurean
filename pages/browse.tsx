// pages/browse.tsx
import { useEffect, useState } from "react";

type Item = {
  id: string;
  title: string;
  format?: string;
  cuisine?: string;
  vibe?: string[];
  minPrice?: number;
  maxPrice?: number;
  description?: string;
};

export default function Browse() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/experiences");
        const data = await res.json();
        // data should be { items: [...] } if you wrapped it; otherwise adjust
        const list: Item[] = data.items || data.records || data || [];
        setItems(list);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: "0 16px", color: "#eee", fontFamily: "system-ui" }}>
      <h1>Browse experiences</h1>
      {loading && <p>Loading…</p>}
      {!loading && !items?.length && <p>No items found.</p>}
      <div style={{ display: "grid", gap: 12 }}>
        {items?.map((r) => (
          <div key={r.id} style={{ border: "1px solid #333", borderRadius: 12, padding: 16, background: "#0f0f0f" }}>
            <h3 style={{ margin: 0 }}>{r.title}</h3>
            <p style={{ margin: "6px 0", opacity: 0.85 }}>
              {r.format ? `${r.format}` : ""}
              {r.cuisine ? ` · ${r.cuisine}` : ""}
              {r.vibe && r.vibe.length ? ` · ${r.vibe.join(", ")}` : ""}
            </p>
            {typeof r.minPrice === "number" && typeof r.maxPrice === "number" && (
              <p style={{ margin: "4px 0", opacity: 0.85 }}>${r.minPrice}–${r.maxPrice} pp</p>
            )}
            {r.description && <p style={{ margin: "8px 0 0", opacity: 0.7 }}>{r.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
