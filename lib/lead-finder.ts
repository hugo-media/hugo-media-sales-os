export type LeadCandidateStatus = "Candidate" | "Added" | "Rejected" | "Later";

export type LeadCandidate = {
  id: string;
  business_name: string;
  niche: string;
  city: string;
  address: string;
  website_url: string;
  instagram_url: string;
  facebook_url: string;
  tiktok_url: string;
  youtube_url: string;
  linkedin_url: string;
  phone: string;
  email: string;
  osm_url: string;
  source: "OpenStreetMap";
  media_score: number;
  media_level: "No media" | "Weak media" | "Basic media" | "Strong media" | "Perfect for Hugo";
  media_notes: string;
  why_good_for_hugo: string;
  status: LeadCandidateStatus;
  created_at: string;
  updated_at: string;
};

type LeadLookup = {
  id: string;
  business_name: string;
  city: string | null;
  website_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  phone: string | null;
  email: string | null;
};

type SettingsRow<T> = { key: string; value: T | null };

type OverpassElement = {
  id: number;
  type: string;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
};

type OverpassResponse = {
  elements?: OverpassElement[];
};

const defaultCities = ["Warszawa", "Kraków", "Wrocław", "Poznań", "Gdańsk", "Łódź"];
const cityAliases: Record<string, string> = {
  warszawa: "Warszawa",
  warsaw: "Warszawa",
  krakow: "Kraków",
  kraków: "Kraków",
  wroclaw: "Wrocław",
  wrocław: "Wrocław",
  poznan: "Poznań",
  poznań: "Poznań",
  gdansk: "Gdańsk",
  gdańsk: "Gdańsk",
  lodz: "Łódź",
  łódź: "Łódź"
};
const categoryQueries = [
  { niche: "Легалізація / юристи", tag: '["office"="lawyer"]' },
  { niche: "Бухгалтерія", tag: '["office"="accountant"]' },
  { niche: "Beauty", tag: '["shop"~"beauty|hairdresser"]' },
  { niche: "Авто", tag: '["shop"="car_repair"]' },
  { niche: "Освіта", tag: '["amenity"="language_school"]' },
  { niche: "Нерухомість", tag: '["office"="estate_agent"]' },
  { niche: "Страхування", tag: '["office"="insurance"]' },
  { niche: "Медицина", tag: '["healthcare"]' },
  { niche: "Переклади", tag: '["office"="translator"]' }
];
const nicheAliases: Record<string, string[]> = {
  legal: ["Легалізація / юристи"],
  lawyer: ["Легалізація / юристи"],
  legalization: ["Легалізація / юристи"],
  beauty: ["Beauty"],
  accountant: ["Бухгалтерія"],
  accounting: ["Бухгалтерія"],
  auto: ["Авто"],
  car: ["Авто"],
  education: ["Освіта"],
  school: ["Освіта"],
  realestate: ["Нерухомість"],
  estate: ["Нерухомість"],
  insurance: ["Страхування"],
  medical: ["Медицина"],
  translator: ["Переклади"]
};
const targetKeywords = ["ukrain", "ukraiń", "ukraina", "україн", "pobyt", "legalizacja", "karta pobytu", "cudzoziem", "księgowość", "biuro rachunkowe", "beauty", "auto"];
const candidateSettingsKey = "lead_candidates";

export function dateKey(timeZone = process.env.TELEGRAM_TIME_ZONE || "Europe/Kyiv") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return { url: url.replace(/\/$/, ""), key };
}

async function supabaseRequest<T>(table: string, query: string, init?: RequestInit) {
  const { url, key } = supabaseConfig();
  const response = await fetch(`${url}/rest/v1/${table}?${query}`, {
    ...init,
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`Supabase ${table} ${response.status}: ${await response.text()}`);
  if (response.status === 204) return null as T;
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (null as T);
}

function isMissingSupabaseColumn(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("PGRST204") || message.includes("schema cache") || message.includes("Could not find the");
}

async function readCandidateStore() {
  const rows = await supabaseRequest<SettingsRow<LeadCandidate[]>[]>(
    "settings",
    `select=key,value&key=eq.${candidateSettingsKey}&limit=1`
  );
  return Array.isArray(rows[0]?.value) ? rows[0].value ?? [] : [];
}

async function writeCandidateStore(candidates: LeadCandidate[]) {
  await supabaseRequest<null>("settings", "on_conflict=key", {
    method: "POST",
    headers: { prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify([{ key: candidateSettingsKey, value: candidates }])
  });
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 9000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function cleanUrl(value = "") {
  return value.trim().replace(/^http:\/\//, "https://").replace(/\/$/, "");
}

function textIncludesTargetKeyword(text: string) {
  const lower = text.toLowerCase();
  return targetKeywords.some((keyword) => lower.includes(keyword));
}

function mediaLevel(score: number): LeadCandidate["media_level"] {
  if (score >= 85) return "Perfect for Hugo";
  if (score >= 70) return "Strong media";
  if (score >= 50) return "Basic media";
  if (score >= 20) return "Weak media";
  return "No media";
}

function socialUrl(html: string, host: string) {
  const pattern = new RegExp(`https?:\\/\\/[^"'\\s<>]*${host.replace(".", "\\.")}[^"'\\s<>]*`, "i");
  const match = html.match(pattern)?.[0] ?? "";
  return cleanUrl(match.split("?")[0]);
}

async function extractWebsiteSocials(websiteUrl: string) {
  if (!websiteUrl) return {};
  try {
    const response = await fetchWithTimeout(websiteUrl, { headers: { "user-agent": "HugoMediaLeadFinder/1.0" } }, 7000);
    if (!response.ok) return {};
    const html = (await response.text()).slice(0, 250_000);
    return {
      instagram_url: socialUrl(html, "instagram.com"),
      facebook_url: socialUrl(html, "facebook.com") || socialUrl(html, "fb.com"),
      tiktok_url: socialUrl(html, "tiktok.com"),
      youtube_url: socialUrl(html, "youtube.com") || socialUrl(html, "youtu.be"),
      linkedin_url: socialUrl(html, "linkedin.com")
    };
  } catch {
    return {};
  }
}

function candidateScore(candidate: Omit<LeadCandidate, "media_score" | "media_level" | "media_notes" | "why_good_for_hugo">, keywordText: string) {
  let score = 0;
  if (candidate.website_url) score += 20;
  if (candidate.instagram_url) score += 20;
  if (candidate.facebook_url) score += 15;
  if (candidate.tiktok_url) score += 15;
  if (candidate.youtube_url) score += 10;
  if (candidate.linkedin_url) score += 5;
  if (candidate.phone || candidate.email) score += 10;
  if (candidate.niche) score += 10;
  if (textIncludesTargetKeyword(keywordText)) score += 10;
  score = Math.min(100, score);
  const level = mediaLevel(score);
  const mediaParts = [
    candidate.website_url ? "є сайт" : "сайт не знайдено",
    candidate.instagram_url ? "є Instagram" : "",
    candidate.facebook_url ? "є Facebook" : "",
    candidate.phone || candidate.email ? "є контакт" : ""
  ].filter(Boolean);
  return {
    media_score: score,
    media_level: level,
    media_notes: mediaParts.join(", "),
    why_good_for_hugo:
      score >= 85
        ? "Сильна присутність, можна пропонувати партнерський або серійний формат Hugo Media."
        : score >= 45
          ? "Є базова присутність, але медійна подача може бути слабкою. Добрий кандидат для формату “людина за бізнесом”."
          : "Реальний бізнес у цільовій ніші. Потрібна ручна перевірка соцмереж, але може бути добрий кандидат для довіри й медійного візиту."
  };
}

function mapOverpassElement(element: OverpassElement, niche: string, city: string): Omit<LeadCandidate, "media_score" | "media_level" | "media_notes" | "why_good_for_hugo"> | null {
  const tags = element.tags ?? {};
  const businessName = tags.name?.trim();
  if (!businessName) return null;
  const street = [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(" ");
  const address = [street, tags["addr:postcode"], tags["addr:city"] || city].filter(Boolean).join(", ");
  const website = cleanUrl(tags.website || tags["contact:website"] || "");
  const instagram = cleanUrl(tags["contact:instagram"] || tags.instagram || "");
  const facebook = cleanUrl(tags["contact:facebook"] || tags.facebook || "");
  const phone = tags.phone || tags["contact:phone"] || "";
  const email = tags.email || tags["contact:email"] || "";
  return {
    id: crypto.randomUUID(),
    business_name: businessName,
    niche,
    city,
    address,
    website_url: website,
    instagram_url: instagram,
    facebook_url: facebook,
    tiktok_url: "",
    youtube_url: "",
    linkedin_url: "",
    phone,
    email,
    osm_url: `https://www.openstreetmap.org/${element.type}/${element.id}`,
    source: "OpenStreetMap",
    status: "Candidate",
    created_at: dateKey(),
    updated_at: dateKey()
  };
}

function overpassQuery(city: string, tag: string) {
  return `[out:json][timeout:18];
area["name"="${city}"]["boundary"="administrative"]->.searchArea;
(
  node${tag}(area.searchArea);
  way${tag}(area.searchArea);
  relation${tag}(area.searchArea);
);
out center tags 50;`;
}

function duplicateKeyParts(candidate: Pick<LeadCandidate, "business_name" | "city" | "website_url" | "instagram_url" | "facebook_url" | "phone" | "email" | "osm_url">) {
  return [
    candidate.website_url,
    candidate.instagram_url,
    candidate.facebook_url,
    candidate.phone,
    candidate.email,
    candidate.osm_url,
    `${candidate.business_name.toLowerCase()}::${candidate.city.toLowerCase()}`
  ].filter(Boolean).map((item) => item.toLowerCase());
}

function hasDuplicate(candidate: LeadCandidate, leads: LeadLookup[], candidates: LeadCandidate[]) {
  const keys = new Set(duplicateKeyParts(candidate));
  return leads.some((lead) => duplicateKeyParts({
    business_name: lead.business_name,
    city: lead.city || "",
    website_url: lead.website_url || "",
    instagram_url: lead.instagram_url || "",
    facebook_url: lead.facebook_url || "",
    phone: lead.phone || "",
    email: lead.email || "",
    osm_url: ""
  }).some((key) => keys.has(key))) || candidates.some((item) => duplicateKeyParts(item).some((key) => keys.has(key)));
}

export async function getCandidate(candidateId: string) {
  const candidates = await readCandidateStore();
  return candidates.find((candidate) => candidate.id === candidateId) ?? null;
}

export async function listCandidates(limit = 10) {
  const candidates = await readCandidateStore();
  return candidates
    .filter((candidate) => candidate.status === "Candidate")
    .sort((a, b) => b.media_score - a.media_score)
    .slice(0, limit);
}

export async function saveCandidates(candidates: LeadCandidate[]) {
  if (!candidates.length) return;
  const existing = await readCandidateStore();
  const byId = new Map(existing.map((candidate) => [candidate.id, candidate]));
  candidates.forEach((candidate) => byId.set(candidate.id, candidate));
  await writeCandidateStore([...byId.values()]);
}

export async function updateCandidateStatus(candidateId: string, status: LeadCandidateStatus) {
  const candidates = await readCandidateStore();
  await writeCandidateStore(candidates.map((candidate) =>
    candidate.id === candidateId ? { ...candidate, status, updated_at: dateKey() } : candidate
  ));
}

export async function addCandidateToCrm(candidateId: string, priority: "Medium" | "Hot" = "Medium") {
  const candidate = await getCandidate(candidateId);
  if (!candidate) throw new Error("Candidate not found");
  const leads = await supabaseRequest<LeadLookup[]>("leads", "select=id,business_name,city,website_url,instagram_url,facebook_url,phone,email");
  if (hasDuplicate(candidate, leads, [])) throw new Error("Цей бізнес вже є в CRM.");
  const leadPayload: Record<string, unknown> = {
    business_name: candidate.business_name,
    niche: candidate.niche,
    city: candidate.city,
    contact_name: "",
    instagram_url: candidate.instagram_url,
    facebook_url: candidate.facebook_url,
    website_url: candidate.website_url,
    phone: candidate.phone,
    email: candidate.email,
    contact_channel: candidate.instagram_url ? "Instagram" : candidate.facebook_url ? "Facebook" : "",
    weak_point: "Перевірити медійну подачу і соцмережі.",
    offer_angle: "Показати людину за бізнесом і підсилити довіру.",
    status: "Новий",
    priority,
    package_interest: "",
    deal_value: priority === "Hot" ? 1000 : 0,
    first_contact_date: dateKey(),
    last_contact_date: dateKey(),
    follow_up_date: null,
    next_action: priority === "Hot" ? "Перевірити соцмережі і написати персоналізоване повідомлення" : "Перевірити кандидата і підготувати перше повідомлення",
    source: "OpenStreetMap",
    notes: [
      `Media score: ${candidate.media_score}/100`,
      `Media level: ${candidate.media_level}`,
      `Media notes: ${candidate.media_notes}`,
      `Чому підходить: ${candidate.why_good_for_hugo}`,
      `OSM: ${candidate.osm_url}`
    ].join("\n"),
    created_at: dateKey(),
    updated_at: dateKey()
  };
  try {
    await supabaseRequest<null>("leads", "on_conflict=id", {
      method: "POST",
      headers: { prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify([leadPayload])
    });
  } catch (error) {
    if (!isMissingSupabaseColumn(error)) throw error;
    delete leadPayload.priority;
    await supabaseRequest<null>("leads", "on_conflict=id", {
      method: "POST",
      headers: { prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify([leadPayload])
    });
  }
  await updateCandidateStatus(candidateId, "Added");
  return candidate;
}

export async function findLeadCandidates(options: { limit?: number; city?: string; nicheQuery?: string } = {}) {
  const limit = options.limit ?? 30;
  const normalizedCity = options.city ? cityAliases[options.city.toLowerCase()] ?? options.city : "";
  const cities = normalizedCity ? [normalizedCity] : defaultCities;
  const aliases = options.nicheQuery ? nicheAliases[options.nicheQuery.toLowerCase().replace(/\s+/g, "")] ?? [] : [];
  const categories = options.nicheQuery
    ? categoryQueries.filter((item) => aliases.includes(item.niche) || `${item.niche} ${item.tag}`.toLowerCase().includes(options.nicheQuery?.toLowerCase() ?? ""))
    : categoryQueries;
  const selectedCategories = categories.length ? categories : categoryQueries.slice(0, 4);
  const [leads, existingCandidates] = await Promise.all([
    supabaseRequest<LeadLookup[]>("leads", "select=id,business_name,city,website_url,instagram_url,facebook_url,phone,email"),
    supabaseRequest<LeadCandidate[]>("lead_candidates", "select=*")
  ]);
  const found: LeadCandidate[] = [];
  const overpassUrl = process.env.OVERPASS_API_URL || "https://overpass-api.de/api/interpreter";

  for (const city of cities) {
    for (const category of selectedCategories) {
      if (found.length >= limit) break;
      let data: OverpassResponse;
      try {
        const response = await fetchWithTimeout(overpassUrl, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ data: overpassQuery(city, category.tag) }).toString()
        }, 20_000);
        if (!response.ok) continue;
        data = (await response.json()) as OverpassResponse;
      } catch {
        continue;
      }
      for (const element of (data.elements ?? []).slice(0, 50)) {
        if (found.length >= limit) break;
        const base = mapOverpassElement(element, category.niche, city);
        if (!base) continue;
        const socials = base.website_url ? await extractWebsiteSocials(base.website_url) : {};
        const candidateBase = {
          ...base,
          instagram_url: socials.instagram_url || base.instagram_url,
          facebook_url: socials.facebook_url || base.facebook_url,
          tiktok_url: socials.tiktok_url || "",
          youtube_url: socials.youtube_url || "",
          linkedin_url: socials.linkedin_url || ""
        };
        const score = candidateScore(candidateBase, `${base.business_name} ${base.niche} ${base.address} ${Object.values(element.tags ?? {}).join(" ")}`);
        const candidate: LeadCandidate = { ...candidateBase, ...score };
        if (hasDuplicate(candidate, leads, [...existingCandidates, ...found])) continue;
        found.push(candidate);
      }
    }
  }

  await saveCandidates(found);
  return found;
}
