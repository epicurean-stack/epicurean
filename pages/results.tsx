// pages/results.tsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import ExperienceCard from "../components/ExperienceCard";

type Exp = {
  id: string;
  title?: string;
  format?: string;
  cuisine?: string;
  description?: string;
  minPrice?: number;
  maxPrice?: number;
};

export default function ResultsPage() {
  const router = useRouter();
  const { ids } = router.query; // comma-separated
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Exp[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ids) return;
    const run = async () => {
      try {
        setLoading(true);
        const r = await fetch(`/api/experience-by-ids?ids=${ids}`);
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error || "Failed to load results");
        setItems(data.results || []);
      } catch (e: any) {
        setError(e.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [ids]);

  return (
    <main className="wrap">
      <h1>Your recommendations</h1>
      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "#f87171" }}>{error}</p>}
      {!loading && !error && items.length === 0 && <p>No results found.</p>}
      <div className="list">
        {items.map((exp) => (
          <ExperienceCard key={exp.id} exp={exp as any} />
        ))}
      </div>

      <style jsx>{`
        .wrap { max-width: 960px; margin: 40px auto; padding: 0 16px; }
        .list { display: grid; gap: 14px; }
      `}</style>
    </main>
  );
}
