import { useEffect, useMemo, useState } from "react";
import ExperienceCard from "../components/ExperienceCard";

type Exp = {
  id: string;
  title: string;
  mode?: string;
  format?: string;
  cuisine_focus?: string;
  price_per_person_min?: number;
  price_per_person_max?: number;
  min_party_size?: number;
  max_party_size?: number;
  alcohol_presence?: string; // "Included" | "Optional" | "None"
  flavour_profile?: string[];
  vibe?: string[];
  group_suitability?: string[];
  host?: string;
  duration_minutes?: number;
  description?: string;
};

function normalize(input: any): Exp[] {
  // Accept either:
  //  A) { records:[{id, fields:{...}}] }  (Airtable raw)
  //  B) [{ id, ... }]                     (already simplified)
  if (Array.isArray(input)) return input as Exp[];
  if (input?.records) {
    return input.records.map((r: any) => {
      const f = r.fields || {};
      return {
        id: f["Experience ID"] || r.id,
        title: f["Title"],
        mode: f["Mode"],
        format: f["Format"],
        cuisine_focus: f["Cuisine Focus"],
        price_per_person_min: f["Price Per Person (Min)"],
        price_per_person_max: f["Price Per Person (Max)"],
        min_party_size: f["Min Party Size"],
        max_party_size: f["Max Party Size"],
        alcohol_presence: f["Alcohol Presence"],
        flavour_profile: f["Flavour Profile"],
        vibe: f["Vibe"],
        group_suitability: f["Group Suitability"],
        host: f["Host"],
        duration_minutes: f["Duration (Minutes)"],
        description: f["Description"],
      };
    });
  }
  return [];
}

export default function Browse() {
  const [all, setAll] = useState<Exp[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<string>("");
  const [format, setFormat] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [minGroup, setMinGroup] = useState<number | "">("");
  const [alcohol, setAlcohol] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/experiences");
        const data = await res.json();
        setAll(normalize(data));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    return all.filter((e) => {
      if (q) {
        const hay = `${e.title ?? ""} ${e.cuisine_focus ?? ""} ${e.description ?? ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      if (mode && e.mode !== mode) return false;
      if (format && e.format !== format) return false;
      if (alcohol && (e.alcohol_presence || "").toLowerCase() !== alcohol.toLowerCase()) return false;
      if (maxPrice !== "" && typeof maxPrice === "number") {
        const pp = e.price_per_person_min ?? e.price_per_person_max ?? 999999;
        if (pp > maxPrice) return false;
      }
      if (minGroup !== "" && typeof minGroup === "number") {
        const maxCap = e.max_party_size ?? 0;
        if (maxCap < minGroup) return false;
      }
      return true;
    });
  }, [all, q, mode, format, maxPrice, minGroup, alcohol]);

  if (loading) return <p>Loading experiences…</p>;

  return (
    <div style={{ padding: "24px", maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 16 }}>Browse experiences</h1>

      {/* Filters */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 140px 180px 140px 140px 160px",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <input
          placeholder="Search (title, cuisine, description)…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="">Mode</option>
          <option value="Out">Out</option>
          <option value="Home">Home</option>
          <option value="Virtual">Virtual</option>
        </select>

        <select value={format} onChange={(e) => setFormat(e.target.value)}>
          <option value="">Format</option>
          <option value="PrivateDining">PrivateDining</option>
          <option value="SupperClub">SupperClub</option>
          <option value="WineTasting">WineTasting</option>
          <option value="WhiskyTasting">WhiskyTasting</option>
          <option value="CookingClass">CookingClass</option>
          <option value="FoodTour">FoodTour</option>
          <option value="Tasting">Tasting</option>
          <option value="CulturalExperience">CulturalExperience</option>
        </select>

        <input
          type="number"
          placeholder="Max $pp"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))}
        />

        <input
          type="number"
          placeholder="Min group"
          value={minGroup}
          onChange={(e) => setMinGroup(e.target.value === "" ? "" : Number(e.target.value))}
        />

        <select value={alcohol} onChange={(e) => setAlcohol(e.target.value)}>
          <option value="">Alcohol</option>
          <option value="Included">Included</option>
          <option value="Optional">Optional</option>
          <option value="None">None</option>
        </select>
      </div>

      {/* Results */}
      <p style={{ margin: "8px 0 16px" }}>
        Showing <b>{filtered.length}</b> of {all.length}
      </p>

      <div style={{ display: "grid", gap: 16 }}>
        {filtered.map((exp) => (
          <ExperienceCard key={exp.id} exp={exp} />
        ))}
      </div>
    </div>
  );
}

