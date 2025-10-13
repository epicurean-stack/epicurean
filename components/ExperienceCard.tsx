import React from "react";

type Exp = {
  id: string;
  title?: string;
  mode?: string;
  format?: string;
  cuisine_focus?: string;
  vibe?: string[] | string;
  flavour_profile?: string[] | string;
  price_per_person_min?: number;
  price_per_person_max?: number;
  duration_minutes?: number;
  description?: string;
};

function toArr(v: any): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : String(v).split(",").map(s => s.trim());
}

export default function ExperienceCard({
  exp,
  score,
}: { exp: Exp; score?: number }) {
  const vibes = toArr(exp.vibe).slice(0, 3).join(" • ");
  const flavs = toArr(exp.flavour_profile).slice(0, 3).join(" • ");
  const price = (exp.price_per_person_min ?? 0) === (exp.price_per_person_max ?? 0)
    ? `$${exp.price_per_person_min}`
    : `$${exp.price_per_person_min ?? "?"}–$${exp.price_per_person_max ?? "?"}`;

  return (
    <div style={{
      border: "1px solid #eee", borderRadius: 12, padding: 16, marginBottom: 16
    }}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <h3 style={{margin:0}}>{exp.title || "Untitled Experience"}</h3>
        {typeof score === "number" && (
          <span style={{fontSize:12, opacity:0.7}}>Score: {score.toFixed(2)}</span>
        )}
      </div>
      <div style={{fontSize:13, color:"#666", margin:"6px 0"}}>
        {exp.mode} · {exp.format} · {exp.cuisine_focus}
      </div>
      <div style={{fontSize:13, color:"#444", margin:"6px 0"}}>
        {vibes && <>Vibe: {vibes} · </>}
        {flavs && <>Flavour: {flavs}</>}
      </div>
      <div style={{fontSize:13, color:"#444", margin:"6px 0"}}>
        {price} pp · {exp.duration_minutes ?? "?"} mins
      </div>
      {exp.description && (
        <p style={{marginTop:8, fontSize:14, lineHeight:1.4, color:"#222"}}>
          {exp.description}
        </p>
      )}
    </div>
  );
}

