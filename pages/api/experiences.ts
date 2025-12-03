import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID!
);

async function fetchExperiences(): Promise<Experience[]> {
  const records = await base("Experiences").select().all();

  return records.map((r) => ({
    id: r.id,
    title: r.get("Title") as string,
    description: (r.get("Description") as string) ?? "",
    format: (r.get("Format") as string) ?? "",
    cuisine: (r.get("Cuisine_Focus") as string) ?? "",
    mode: (r.get("Mode") as Mode) ?? "Out",
    minParty: (r.get("Min party") as number) ?? 1,
    maxParty: (r.get("Max party") as number) ?? 10,
    minBudgetPP: (r.get("Min budget pp") as number) ?? 50,
    maxBudgetPP: (r.get("Max budget pp") as number) ?? 500,
    vibes: (r.get("Vibe tags") as string[]) ?? [],
    tone: (r.get("Tone tags") as string[]) ?? [],
    flavour: (r.get("Flavour tags") as string[]) ?? [],
    minAdventure: (r.get("Min adventure") as number) ?? 1,
    maxAdventure: (r.get("Max adventure") as number) ?? 3,
    involvement: (r.get("Involvement") as string) ?? "Anything",
    hardNos: (r.get("Hard nos") as string[]) ?? [],
  }));
}
