// pages/quiz.tsx
import { useState } from "react";

type Result = {
  id: string;
  title: string;
  format?: string;
  cuisine?: string;
  vibe?: string[];
  minPrice?: number;
  maxPrice?: number;
  description?: string;
};

export default function QuizPage() {
  const [vibe, setVibe] = useState<string[]>([]);
  const [budgetPP, setBudgetPP] = useState<number>(110);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Result[] | null>(null);

  const toggleVibe = (v: string) => {
    setVibe((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // keep payload minimal for now
          vibe,
          budget_pp: budgetPP,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Request failed");
      setResults(data?.results || []);
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 820, margin: "40px auto", padding: "0 16px", color: "#eee", fontFamily: "system-ui" }}>
      <h1 style={{ marginBottom: 8 }}>Find your perfect experience</h1>
      <p style={{ opacity: 0.8, marginBottom: 24 }}>
        Tell us a little about your vibe and budget. We’ll suggest the best five.
      </p>

      <form onSubmit={submit} style={{ background: "#111", border: "1px solid #333", borderRadius: 12, padding: 16 }}>
        <label style={{ display: "block", marginBottom: 12, fontWeight: 600 }}>Vibe</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {["Cosy", "LearnSomething", "BigNightOut", "Romantic", "Surprise"].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => toggleVibe(v)}
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                border: "1px solid #333",
                background: vibe.includes(v) ? "#444" : "transparent",
                color: "#eee",
                cursor: "pointer",
              }}
            >
              {v}
            </button>
          ))}
        </div>

        <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
          Budget per person (AUD)
        </label>
        <input
          type="number"
          value={budgetPP}
          onChange={(e) => setBudgetPP(Number(e.target.value))}
          min={20}
          max={500}
          step={5}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #333",
            background: "#0c0c0c",
            color: "#eee",
            marginBottom: 20,
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            border: "1px solid #2b6",
            background: "#2b6",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {loading ? "Finding great options…" : "Show my matches"}
        </button>
      </form>

      {error && (
        <p style={{ color: "#f66", marginTop: 16 }}>
          {error}
        </p>
      )}

      {results && (
        <>
          <h2 style={{ marginTop: 28, marginBottom: 8 }}>Your recommendations</h2>
          <div style={{ display: "grid", gap: 12 }}>
            {results.map((r) => (
              <div
                key={r.id}
                style={{ border: "1px solid #333", borderRadius: 12, padding: 16, background: "#0f0f0f" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <h3 style={{ margin: 0 }}>{r.title}</h3>
                </div>
                <p style={{ margin: "6px 0", opacity: 0.85 }}>
                  {r.format ? `${r.format}` : ""}
                  {r.cuisine ? ` · ${r.cuisine}` : ""}
                  {r.vibe && r.vibe.length ? ` · ${r.vibe.join(", ")}` : ""}
                </p>
                {typeof r.minPrice === "number" && typeof r.maxPrice === "number" && (
                  <p style={{ margin: "4px 0", opacity: 0.85 }}>
                    ${r.minPrice}–${r.maxPrice} pp
                  </p>
                )}
                {r.description && (
                  <p style={{ margin: "8px 0 0", opacity: 0.7 }}>{r.description}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
