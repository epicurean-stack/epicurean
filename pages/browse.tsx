import { useEffect, useState } from "react";

type Exp = {
  id: string;
  title: string;
  format: string;
  cuisine: string;
  vibe?: string[];
  minPrice?: number;
  maxPrice?: number;
  description?: string;
};

export default function Browse() {
  const [data, setData] = useState<Exp[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/experiences");
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const json = await r.json();
        setData(json);
      } catch (e: any) {
        setErr(e.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <main className="page"><p>Loading…</p></main>;
  if (err) return <main className="page"><p>Error: {err}</p></main>;

  return (
    <main className="page">
      <h1>Browse experiences</h1>
      <p>Showing {data.length}</p>
      <ul className="grid">
        {data.map(x => (
          <li key={x.id} className="card">
            <h3>{x.title}</h3>
            <p>{x.format} · {x.cuisine}</p>
            {x.vibe?.length ? <p>Vibe: {x.vibe.join(", ")}</p> : null}
            {(x.minPrice || x.maxPrice) && (
              <p>
                ${x.minPrice ?? "?"}
                {x.maxPrice ? `–$${x.maxPrice}` : ""} pp
              </p>
            )}
            {x.description ? <p className="muted">{x.description}</p> : null}
          </li>
        ))}
      </ul>
      <style jsx>{`
        .page { padding: 2rem; max-width: 960px; margin: 0 auto; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(280px,1fr)); gap: 16px; padding: 0; list-style: none; }
        .card { border: 1px solid #333; border-radius: 12px; padding: 16px; background: #111; }
        .muted { opacity: 0.75; }
      `}</style>
    </main>
  );
}
