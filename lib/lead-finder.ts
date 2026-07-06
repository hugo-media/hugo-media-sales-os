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
  source: "OpenStreetMap" | "Google Search";
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

type NominatimPlace = {
  osm_type: "node" | "way" | "relation";
  osm_id: number;
  display_name: string;
  name?: string;
  type?: string;
  category?: string;
  address?: Record<string, string>;
  extratags?: Record<string, string>;
  namedetails?: Record<string, string>;
};

type SearchQuota = {
  date: string;
  used: number;
  limit: number;
};

type SerperPlace = {
  title?: string;
  address?: string;
  website?: string;
  link?: string;
  phoneNumber?: string;
  phone?: string;
  rating?: number;
  reviews?: number;
  cid?: string;
};

type SerperOrganic = {
  title?: string;
  link?: string;
  snippet?: string;
  displayedLink?: string;
};

type SerperResponse = {
  places?: SerperPlace[];
  localResults?: SerperPlace[];
  organic?: SerperOrganic[];
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
const countryCities: Record<string, string[]> = {
  poland: defaultCities,
  polska: defaultCities,
  польща: defaultCities,
  pl: defaultCities,
  germany: ["Berlin", "Hamburg", "München", "Köln", "Frankfurt am Main", "Düsseldorf"],
  deutschland: ["Berlin", "Hamburg", "München", "Köln", "Frankfurt am Main", "Düsseldorf"],
  німеччина: ["Berlin", "Hamburg", "München", "Köln", "Frankfurt am Main", "Düsseldorf"],
  de: ["Berlin", "Hamburg", "München", "Köln", "Frankfurt am Main", "Düsseldorf"],
  czechia: ["Praha", "Brno", "Ostrava", "Plzeň"],
  czech: ["Praha", "Brno", "Ostrava", "Plzeň"],
  чехія: ["Praha", "Brno", "Ostrava", "Plzeň"],
  cz: ["Praha", "Brno", "Ostrava", "Plzeň"],
  slovakia: ["Bratislava", "Košice", "Žilina"],
  словаччина: ["Bratislava", "Košice", "Žilina"],
  sk: ["Bratislava", "Košice", "Žilina"],
  austria: ["Wien", "Graz", "Linz", "Salzburg"],
  австрія: ["Wien", "Graz", "Linz", "Salzburg"],
  netherlands: ["Amsterdam", "Rotterdam", "Den Haag", "Utrecht"],
  нідерланди: ["Amsterdam", "Rotterdam", "Den Haag", "Utrecht"],
  france: ["Paris", "Lyon", "Marseille", "Nice"],
  франція: ["Paris", "Lyon", "Marseille", "Nice"],
  spain: ["Madrid", "Barcelona", "Valencia", "Málaga"],
  іспанія: ["Madrid", "Barcelona", "Valencia", "Málaga"],
  italy: ["Roma", "Milano", "Napoli", "Torino"],
  італія: ["Roma", "Milano", "Napoli", "Torino"],
  portugal: ["Lisboa", "Porto", "Braga"],
  португалія: ["Lisboa", "Porto", "Braga"],
  belgium: ["Bruxelles", "Antwerpen", "Gent"],
  бельгія: ["Bruxelles", "Antwerpen", "Gent"],
  ireland: ["Dublin", "Cork", "Galway"],
  ірландія: ["Dublin", "Cork", "Galway"]
};
const categoryQueries = [
  { niche: "Легалізація / юристи", tags: ['["office"="lawyer"]', '["name"~"legal|legalizacja|kancelaria|pobyt|immigration|visa|адвокат|юрист",i]'] },
  { niche: "Бухгалтерія", tags: ['["office"="accountant"]', '["name"~"accounting|księgowo|rachunk|бухгалтер|подат",i]'] },
  { niche: "Beauty", tags: ['["shop"~"beauty|hairdresser"]', '["name"~"beauty|salon|hair|barber|nails|крас|салон",i]'] },
  { niche: "Авто", tags: ['["shop"~"car_repair|car_parts"]', '["craft"="car_repair"]', '["name"~"auto|car|garage|mechanic|авто|шиномонтаж",i]'] },
  { niche: "Освіта", tags: ['["amenity"="language_school"]', '["amenity"="school"]', '["name"~"school|language|kurs|школ|курси",i]'] },
  { niche: "Нерухомість", tags: ['["office"="estate_agent"]', '["name"~"real estate|nieruchomo|property|нерухом",i]'] },
  { niche: "Страхування", tags: ['["office"="insurance"]', '["name"~"insurance|ubezpiec|страх",i]'] },
  { niche: "Медицина", tags: ['["healthcare"]', '["amenity"~"clinic|doctors|dentist"]', '["name"~"clinic|doctor|medical|dent|мед|клініка",i]'] },
  { niche: "Переклади", tags: ['["office"="translator"]', '["name"~"translation|tłumacz|переклад",i]'] }
];
const nicheAliases: Record<string, string[]> = {
  legal: ["Легалізація / юристи"],
  lawyer: ["Легалізація / юристи"],
  legalization: ["Легалізація / юристи"],
  легалізація: ["Легалізація / юристи"],
  юристи: ["Легалізація / юристи"],
  юрист: ["Легалізація / юристи"],
  beauty: ["Beauty"],
  бюті: ["Beauty"],
  краса: ["Beauty"],
  accountant: ["Бухгалтерія"],
  accounting: ["Бухгалтерія"],
  бухгалтерія: ["Бухгалтерія"],
  бухгалтер: ["Бухгалтерія"],
  auto: ["Авто"],
  car: ["Авто"],
  авто: ["Авто"],
  education: ["Освіта"],
  school: ["Освіта"],
  освіта: ["Освіта"],
  realestate: ["Нерухомість"],
  estate: ["Нерухомість"],
  нерухомість: ["Нерухомість"],
  insurance: ["Страхування"],
  страхування: ["Страхування"],
  medical: ["Медицина"],
  медицина: ["Медицина"],
  translator: ["Переклади"],
  переклади: ["Переклади"]
};
const ukrainianKeywords = ["ukrain", "ukraiń", "ukraina", "ukrainian", "україн", "украина", "українсь", "для українців", "dla ukraincow", "dla ukraińców"];
const targetKeywords = [...ukrainianKeywords, "pobyt", "legalizacja", "karta pobytu", "cudzoziem", "księgowość", "biuro rachunkowe", "beauty", "auto"];
const candidateSettingsKey = "lead_candidates";
const searchQuotaSettingsKey = "lead_search_quota";
const defaultDailySearchLimit = 15;
type SearchCountry = { key: string; label: string; gl: string; signals: string[]; negativeSignals: string[] };
const countrySignals: Record<string, string[]> = {
  poland: ["poland", "polska", "польща", ".pl", "warszawa", "warsaw", "kraków", "krakow", "wrocław", "wroclaw", "poznań", "poznan", "gdańsk", "gdansk", "łódź", "lodz"],
  germany: ["germany", "deutschland", "німеччина", ".de", "berlin", "hamburg", "münchen", "munich", "köln", "cologne", "frankfurt", "düsseldorf", "dusseldorf"],
  czechia: ["czechia", "czech republic", "česko", "чехія", ".cz", "praha", "prague", "brno", "ostrava", "plzeň", "plzen"],
  slovakia: ["slovakia", "slovensko", "словаччина", ".sk", "bratislava", "košice", "kosice", "žilina", "zilina"],
  austria: ["austria", "österreich", "oesterreich", "австрія", ".at", "wien", "vienna", "graz", "linz", "salzburg"],
  netherlands: ["netherlands", "nederland", "holland", "нідерланди", ".nl", "amsterdam", "rotterdam", "den haag", "utrecht"],
  france: ["france", "франція", ".fr", "paris", "lyon", "marseille", "nice"],
  spain: ["spain", "españa", "espana", "іспанія", ".es", "madrid", "barcelona", "valencia", "málaga", "malaga"],
  italy: ["italy", "italia", "італія", ".it", "roma", "rome", "milano", "milan", "napoli", "torino"],
  portugal: ["portugal", "португалія", ".pt", "lisboa", "lisbon", "porto", "braga"],
  belgium: ["belgium", "belgië", "belgie", "бельгія", ".be", "bruxelles", "brussels", "antwerpen", "gent"],
  ireland: ["ireland", "ірландія", ".ie", "dublin", "cork", "galway"]
};
const countryDefinitions: Record<string, Omit<SearchCountry, "negativeSignals">> = {
  poland: { key: "poland", label: "Poland", gl: "pl", signals: countrySignals.poland },
  germany: { key: "germany", label: "Germany", gl: "de", signals: countrySignals.germany },
  czechia: { key: "czechia", label: "Czechia", gl: "cz", signals: countrySignals.czechia },
  slovakia: { key: "slovakia", label: "Slovakia", gl: "sk", signals: countrySignals.slovakia },
  austria: { key: "austria", label: "Austria", gl: "at", signals: countrySignals.austria },
  netherlands: { key: "netherlands", label: "Netherlands", gl: "nl", signals: countrySignals.netherlands },
  france: { key: "france", label: "France", gl: "fr", signals: countrySignals.france },
  spain: { key: "spain", label: "Spain", gl: "es", signals: countrySignals.spain },
  italy: { key: "italy", label: "Italy", gl: "it", signals: countrySignals.italy },
  portugal: { key: "portugal", label: "Portugal", gl: "pt", signals: countrySignals.portugal },
  belgium: { key: "belgium", label: "Belgium", gl: "be", signals: countrySignals.belgium },
  ireland: { key: "ireland", label: "Ireland", gl: "ie", signals: countrySignals.ireland }
};
function searchCountry(key: keyof typeof countryDefinitions): SearchCountry {
  const base = countryDefinitions[key];
  const negativeSignals = Object.entries(countrySignals)
    .filter(([countryKey]) => countryKey !== key)
    .flatMap(([, signals]) => signals);
  return { ...base, negativeSignals };
}
const countrySearchMeta: Record<string, SearchCountry> = {
  poland: searchCountry("poland"),
  polska: searchCountry("poland"),
  польща: searchCountry("poland"),
  pl: searchCountry("poland"),
  germany: searchCountry("germany"),
  deutschland: searchCountry("germany"),
  німеччина: searchCountry("germany"),
  de: searchCountry("germany"),
  czechia: searchCountry("czechia"),
  czech: searchCountry("czechia"),
  чехія: searchCountry("czechia"),
  cz: searchCountry("czechia"),
  slovakia: searchCountry("slovakia"),
  словаччина: searchCountry("slovakia"),
  sk: searchCountry("slovakia"),
  austria: searchCountry("austria"),
  австрія: searchCountry("austria"),
  netherlands: searchCountry("netherlands"),
  нідерланди: searchCountry("netherlands"),
  france: searchCountry("france"),
  франція: searchCountry("france"),
  spain: searchCountry("spain"),
  іспанія: searchCountry("spain"),
  italy: searchCountry("italy"),
  італія: searchCountry("italy"),
  portugal: searchCountry("portugal"),
  португалія: searchCountry("portugal"),
  belgium: searchCountry("belgium"),
  бельгія: searchCountry("belgium"),
  ireland: searchCountry("ireland"),
  ірландія: searchCountry("ireland")
};
const searchTermsByNiche: Record<string, string[]> = {
  "Легалізація / юристи": ["legalizacja pobytu", "kancelaria prawna", "immigration lawyer", "visa lawyer", "legal office"],
  "Бухгалтерія": ["biuro rachunkowe", "accounting office", "księgowość", "tax advisor"],
  Beauty: ["beauty salon", "salon kosmetyczny", "hair salon", "nail salon", "barber"],
  Авто: ["auto serwis", "car repair", "mechanic", "garage", "tire service"],
  Освіта: ["language school", "szkoła językowa", "courses", "education center"],
  Нерухомість: ["real estate agency", "nieruchomości", "property agency"],
  Страхування: ["insurance agency", "ubezpieczenia", "insurance broker"],
  Медицина: ["clinic", "medical center", "dentist", "doctor"],
  Переклади: ["translation office", "tłumacz", "translator"]
};
const localizedTermsByCountry: Record<string, Partial<Record<string, string[]>>> = {
  poland: {
    "Легалізація / юристи": ["legalizacja pobytu", "kancelaria prawna dla ukraińców", "ukraiński prawnik", "immigration lawyer"],
    "Бухгалтерія": ["biuro rachunkowe dla ukraińców", "ukraińska księgowość", "accounting office"],
    Beauty: ["ukraiński salon beauty", "salon kosmetyczny ukraiński", "hair salon ukrainian"],
    Авто: ["ukraiński auto serwis", "auto serwis dla ukraińców", "mechanic ukrainian"],
    Освіта: ["ukraińska szkoła", "kursy dla ukraińców", "language school ukrainian"],
    Нерухомість: ["nieruchomości dla ukraińców", "ukraińskie biuro nieruchomości", "real estate ukrainian"],
    Страхування: ["ubezpieczenia dla ukraińców", "ukraińska agencja ubezpieczeń", "insurance ukrainian"],
    Медицина: ["ukraińska klinika", "lekarz ukraiński", "medical center ukrainian"],
    Переклади: ["tłumacz ukraiński", "tłumaczenia ukraiński", "translation office ukrainian"]
  },
  germany: {
    "Легалізація / юристи": ["ukrainische Kanzlei", "ukrainischer Anwalt", "immigration lawyer ukrainian"],
    "Бухгалтерія": ["ukrainische Buchhaltung", "Steuerberater ukrainisch", "accounting ukrainian"],
    Beauty: ["ukrainisches Beauty Studio", "ukrainischer Friseur", "beauty salon ukrainian"],
    Авто: ["ukrainische Autowerkstatt", "ukrainischer Mechaniker", "car repair ukrainian"],
    Освіта: ["ukrainische Schule", "Sprachschule ukrainisch", "courses for ukrainians"],
    Нерухомість: ["Immobilien ukrainisch", "Makler ukrainisch", "real estate ukrainian"],
    Страхування: ["Versicherung ukrainisch", "ukrainischer Versicherungsmakler", "insurance ukrainian"],
    Медицина: ["ukrainischer Arzt", "ukrainische Klinik", "medical center ukrainian"],
    Переклади: ["ukrainischer Übersetzer", "Übersetzung ukrainisch", "translation ukrainian"]
  },
  czechia: {
    "Легалізація / юристи": ["ukrajinský právník", "advokát pro ukrajince", "immigration lawyer ukrainian"],
    "Бухгалтерія": ["účetnictví pro ukrajince", "ukrajinská účetní", "accounting ukrainian"],
    Beauty: ["ukrajinský salon krásy", "beauty salon ukrainian"],
    Авто: ["ukrajinský autoservis", "mechanic ukrainian"],
    Освіта: ["ukrajinská škola", "kurzy pro ukrajince", "language school ukrainian"],
    Нерухомість: ["reality pro ukrajince", "real estate ukrainian"],
    Страхування: ["pojištění pro ukrajince", "insurance ukrainian"],
    Медицина: ["ukrajinský lékař", "ukrajinská klinika", "medical ukrainian"],
    Переклади: ["ukrajinský překladatel", "translation ukrainian"]
  },
  slovakia: {
    "Легалізація / юристи": ["ukrajinský právnik", "advokát pre ukrajincov", "immigration lawyer ukrainian"],
    "Бухгалтерія": ["účtovníctvo pre ukrajincov", "accounting ukrainian"],
    Beauty: ["ukrajinský salón krásy", "beauty salon ukrainian"],
    Авто: ["ukrajinský autoservis", "mechanic ukrainian"],
    Освіта: ["ukrajinská škola", "kurzy pre ukrajincov", "language school ukrainian"],
    Нерухомість: ["reality pre ukrajincov", "real estate ukrainian"],
    Страхування: ["poistenie pre ukrajincov", "insurance ukrainian"],
    Медицина: ["ukrajinský lekár", "ukrajinská klinika", "medical ukrainian"],
    Переклади: ["ukrajinský prekladateľ", "translation ukrainian"]
  }
};

function dailySearchLimit() {
  const value = Number(process.env.LEAD_SEARCH_DAILY_LIMIT);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : defaultDailySearchLimit;
}

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
  return message.includes("PGRST204") || message.includes("42703") || message.includes("schema cache") || message.includes("Could not find the") || message.includes("does not exist");
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

async function readSearchQuota() {
  const rows = await supabaseRequest<SettingsRow<SearchQuota>[]>(
    "settings",
    `select=key,value&key=eq.${searchQuotaSettingsKey}&limit=1`
  );
  const limit = dailySearchLimit();
  const today = dateKey();
  const quota = rows[0]?.value;
  if (!quota || quota.date !== today) {
    return { date: today, used: 0, limit };
  }
  return { date: today, used: Number(quota.used) || 0, limit: Number(quota.limit) || limit };
}

async function writeSearchQuota(quota: SearchQuota) {
  await supabaseRequest<null>("settings", "on_conflict=key", {
    method: "POST",
    headers: { prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify([{ key: searchQuotaSettingsKey, value: quota }])
  });
}

async function consumeQualitySearchQuota() {
  const quota = await readSearchQuota();
  if (quota.used >= quota.limit) {
    throw new Error(`Ліміт якісного пошуку на сьогодні вичерпано: ${quota.used}/${quota.limit}. Завтра ліміт оновиться.`);
  }
  const next = { ...quota, used: quota.used + 1 };
  await writeSearchQuota(next);
  return { ...next, remaining: Math.max(0, next.limit - next.used) };
}

export async function getLeadSearchQuota() {
  const quota = await readSearchQuota();
  return { ...quota, remaining: Math.max(0, quota.limit - quota.used) };
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

function textIncludesUkrainianSignal(text: string) {
  const lower = text.toLowerCase();
  return ukrainianKeywords.some((keyword) => lower.includes(keyword));
}

function hasAnySocial(candidate: Pick<LeadCandidate, "instagram_url" | "facebook_url" | "tiktok_url" | "youtube_url" | "linkedin_url">) {
  return Boolean(candidate.instagram_url || candidate.facebook_url || candidate.tiktok_url || candidate.youtube_url || candidate.linkedin_url);
}

function hasUkrainianSignal(candidate: Pick<LeadCandidate, "business_name" | "address" | "website_url" | "instagram_url" | "facebook_url" | "tiktok_url" | "youtube_url" | "linkedin_url">, evidenceText = "") {
  return textIncludesUkrainianSignal([
    candidate.business_name,
    candidate.address,
    candidate.website_url,
    candidate.instagram_url,
    candidate.facebook_url,
    candidate.tiktok_url,
    candidate.youtube_url,
    candidate.linkedin_url,
    evidenceText
  ].join(" "));
}

function textHasAnySignal(text: string, signals: string[]) {
  const lower = text.toLowerCase();
  return signals.some((signal) => lower.includes(signal));
}

function countryMatchesCandidate(country: SearchCountry, candidate: Pick<LeadCandidate, "business_name" | "address" | "website_url" | "instagram_url" | "facebook_url" | "tiktok_url" | "youtube_url" | "linkedin_url">, evidenceText = "") {
  if (country.key === "custom") return true;
  const text = [
    candidate.business_name,
    candidate.address,
    candidate.website_url,
    candidate.instagram_url,
    candidate.facebook_url,
    candidate.tiktok_url,
    candidate.youtube_url,
    candidate.linkedin_url,
    evidenceText
  ].join(" ");
  if (textHasAnySignal(text, country.negativeSignals)) return false;
  return textHasAnySignal(text, country.signals);
}

function isDirectoryUrl(value = "") {
  const lower = value.toLowerCase();
  return [
    "panoramafirm.pl",
    "pkt.pl",
    "yelp.",
    "yellowpages",
    "tripadvisor.",
    "booking.com",
    "cylex.",
    "firmenabc.",
    "11880.com",
    "trustpilot."
  ].some((host) => lower.includes(host));
}

function isSocialUrl(value = "") {
  const lower = value.toLowerCase();
  return ["facebook.com", "fb.com", "instagram.com", "linkedin.com", "youtube.com", "youtu.be", "tiktok.com"].some((host) => lower.includes(host));
}

function isWeakDirectoryResult(title = "", link = "") {
  const lower = `${title} ${link}`.toLowerCase();
  return [
    "best ",
    "top ",
    "near me",
    "list of",
    "ranking",
    "directory",
    "каталог",
    "yellow pages",
    "tripadvisor",
    "booking.com"
  ].some((phrase) => lower.includes(phrase));
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
      linkedin_url: socialUrl(html, "linkedin.com"),
      ukrainian_signal: textIncludesUkrainianSignal(html)
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

function qualityScore(candidate: Omit<LeadCandidate, "media_score" | "media_level" | "media_notes" | "why_good_for_hugo">, keywordText: string, rating?: number, reviews?: number) {
  const base = candidateScore(candidate, keywordText);
  let score = base.media_score;
  if (candidate.source === "Google Search") score += 8;
  if (candidate.website_url && !isDirectoryUrl(candidate.website_url)) score += 12;
  if (candidate.phone) score += 10;
  if ((reviews ?? 0) >= 10) score += 10;
  if ((reviews ?? 0) >= 50) score += 8;
  if ((rating ?? 0) >= 4.2) score += 6;
  if (textIncludesTargetKeyword(keywordText)) score += 8;
  score = Math.min(100, score);
  const proof = [
    candidate.website_url && !isDirectoryUrl(candidate.website_url) ? "власний сайт" : "",
    candidate.phone ? "є телефон" : "",
    reviews ? `${reviews} відгуків` : "",
    rating ? `рейтинг ${rating}` : "",
    textIncludesTargetKeyword(keywordText) ? "є цільові слова" : ""
  ].filter(Boolean);
  return {
    ...base,
    media_score: score,
    media_level: mediaLevel(score),
    media_notes: proof.length ? proof.join(", ") : base.media_notes,
    why_good_for_hugo:
      score >= 70
        ? "Якісний кандидат з Google-пошуку: є ознаки живого бізнесу, контакт або власний сайт. Варто перевірити і додати в CRM."
        : base.why_good_for_hugo
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

function mapNominatimPlace(place: NominatimPlace, niche: string, city: string): Omit<LeadCandidate, "media_score" | "media_level" | "media_notes" | "why_good_for_hugo"> | null {
  const details = place.namedetails ?? {};
  const tags = place.extratags ?? {};
  const address = place.address ?? {};
  const businessName = (place.name || details.name || details["name:en"] || place.display_name.split(",")[0] || "").trim();
  if (!businessName || businessName.length < 3) return null;
  const website = cleanUrl(tags.website || tags.url || tags["contact:website"] || "");
  const instagram = cleanUrl(tags.instagram || tags["contact:instagram"] || "");
  const facebook = cleanUrl(tags.facebook || tags["contact:facebook"] || "");
  const phone = tags.phone || tags["contact:phone"] || "";
  const email = tags.email || tags["contact:email"] || "";
  return {
    id: crypto.randomUUID(),
    business_name: businessName,
    niche,
    city: address.city || address.town || address.village || city,
    address: place.display_name,
    website_url: website,
    instagram_url: instagram,
    facebook_url: facebook,
    tiktok_url: "",
    youtube_url: "",
    linkedin_url: "",
    phone,
    email,
    osm_url: `https://www.openstreetmap.org/${place.osm_type}/${place.osm_id}`,
    source: "OpenStreetMap",
    status: "Candidate",
    created_at: dateKey(),
    updated_at: dateKey()
  };
}

function normalizeLookup(value = "") {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function resolveCities(locationQuery?: string) {
  const normalized = normalizeLookup(locationQuery);
  if (!normalized) return defaultCities;
  if (countryCities[normalized]) return countryCities[normalized];
  return [cityAliases[normalized] ?? locationQuery?.trim() ?? ""].filter(Boolean);
}

function customNameTag(nicheQuery?: string) {
  const raw = nicheQuery?.trim();
  if (!raw) return "";
  const terms = raw
    .split(/[\s,/|]+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 3)
    .slice(0, 4);
  if (!terms.length) return "";
  const escaped = terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  return `["name"~"${escaped}",i]`;
}

function overpassQuery(city: string, tags: string[]) {
  const selectors = tags.flatMap((tag) => [
    `  node${tag}(area.searchArea);`,
    `  way${tag}(area.searchArea);`,
    `  relation${tag}(area.searchArea);`
  ]).join("\n");
  return `[out:json][timeout:18];
area["name"="${city}"]["boundary"="administrative"]->.searchArea;
(
${selectors}
);
out center tags 80;`;
}

function nominatimTerms(niche: string, nicheQuery?: string) {
  const custom = nicheQuery?.trim();
  const terms = searchTermsByNiche[niche] ?? [];
  return [...new Set([...(custom ? [custom] : []), ...terms])].slice(0, 5);
}

function resolveSearchCountry(locationQuery?: string) {
  const normalized = normalizeLookup(locationQuery);
  if (normalized && countrySearchMeta[normalized]) return countrySearchMeta[normalized];
  const city = locationQuery?.trim();
  return { key: "custom", label: city || "Europe", gl: "pl", signals: city ? [city.toLowerCase()] : [], negativeSignals: [] };
}

function serperTerms(niche: string, nicheQuery: string | undefined, country: SearchCountry) {
  const custom = nicheQuery?.trim();
  const localized = localizedTermsByCountry[country.key]?.[niche] ?? [];
  const terms = localized.length ? localized : searchTermsByNiche[niche] ?? [];
  const includeCustom = custom && !terms.length;
  return [...new Set([...(includeCustom ? [custom] : []), ...terms])].slice(0, 3);
}

async function fetchSerper(endpoint: "places" | "search", body: Record<string, unknown>) {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) throw new Error("SERPER_API_KEY не заданий у Vercel. Якісний пошук вимкнений.");
  const response = await fetchWithTimeout(`https://google.serper.dev/${endpoint}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey
    },
    body: JSON.stringify(body)
  }, 16_000);
  if (!response.ok) {
    throw new Error(`Serper search ${response.status}: ${await response.text()}`);
  }
  return (await response.json()) as SerperResponse;
}

function mapSerperPlace(place: SerperPlace, niche: string, locationLabel: string): Omit<LeadCandidate, "media_score" | "media_level" | "media_notes" | "why_good_for_hugo"> | null {
  const businessName = place.title?.trim() || "";
  if (!businessName || businessName.length < 3) return null;
  const website = cleanUrl(place.website || place.link || "");
  const phone = place.phoneNumber || place.phone || "";
  if (!website && !phone && !place.reviews) return null;
  const instagram = website.includes("instagram.com") ? website : "";
  const facebook = website.includes("facebook.com") || website.includes("fb.com") ? website : "";
  const tiktok = website.includes("tiktok.com") ? website : "";
  const youtube = website.includes("youtube.com") || website.includes("youtu.be") ? website : "";
  const linkedin = website.includes("linkedin.com") ? website : "";
  return {
    id: crypto.randomUUID(),
    business_name: businessName,
    niche,
    city: locationLabel,
    address: place.address || locationLabel,
    website_url: website,
    instagram_url: instagram,
    facebook_url: facebook,
    tiktok_url: tiktok,
    youtube_url: youtube,
    linkedin_url: linkedin,
    phone,
    email: "",
    osm_url: `https://www.google.com/search?q=${encodeURIComponent(`${businessName} ${locationLabel}`)}`,
    source: "Google Search",
    status: "Candidate",
    created_at: dateKey(),
    updated_at: dateKey()
  };
}

function mapSerperOrganic(result: SerperOrganic, niche: string, locationLabel: string): Omit<LeadCandidate, "media_score" | "media_level" | "media_notes" | "why_good_for_hugo"> | null {
  const businessName = result.title?.replace(/\s[-|].*$/, "").trim() || "";
  const website = cleanUrl(result.link || "");
  if (!businessName || businessName.length < 3 || !website) return null;
  if (!isSocialUrl(website) && (isDirectoryUrl(website) || isWeakDirectoryResult(result.title, website))) return null;
  const instagram = website.includes("instagram.com") ? website : "";
  const facebook = website.includes("facebook.com") || website.includes("fb.com") ? website : "";
  const tiktok = website.includes("tiktok.com") ? website : "";
  const youtube = website.includes("youtube.com") || website.includes("youtu.be") ? website : "";
  const linkedin = website.includes("linkedin.com") ? website : "";
  return {
    id: crypto.randomUUID(),
    business_name: businessName,
    niche,
    city: locationLabel,
    address: result.snippet || locationLabel,
    website_url: website,
    instagram_url: instagram,
    facebook_url: facebook,
    tiktok_url: tiktok,
    youtube_url: youtube,
    linkedin_url: linkedin,
    phone: "",
    email: "",
    osm_url: `https://www.google.com/search?q=${encodeURIComponent(`${businessName} ${locationLabel}`)}`,
    source: "Google Search",
    status: "Candidate",
    created_at: dateKey(),
    updated_at: dateKey()
  };
}

async function findSerperCandidates(options: {
  locationQuery?: string;
  categories: Array<{ niche: string; tags: string[] }>;
  nicheQuery?: string;
  leads: LeadLookup[];
  existingCandidates: LeadCandidate[];
  found: LeadCandidate[];
  limit: number;
}) {
  const country = resolveSearchCountry(options.locationQuery);
  const category = options.categories[0];
  const terms = serperTerms(category.niche, options.nicheQuery, country);
  const countryTerm = country.key === "custom" ? country.label : `in ${country.label}`;
  const query = `(${terms.join(" OR ")}) (ukrainian OR ukraińska OR ukraińcy OR українська OR українці) ${countryTerm}`;
  const searchBody = { q: query, gl: country.gl, hl: "uk", num: Math.min(10, options.limit) };
  const placesData = await fetchSerper("places", searchBody);
  const places = [...(placesData.places ?? []), ...(placesData.localResults ?? [])];

  for (const place of places) {
    if (options.found.length >= options.limit) return;
    const base = mapSerperPlace(place, category.niche, country.label);
    if (!base) continue;
    const socials = base.website_url && !isDirectoryUrl(base.website_url) ? await extractWebsiteSocials(base.website_url) : {};
    const candidateBase = {
      ...base,
      instagram_url: socials.instagram_url || "",
      facebook_url: socials.facebook_url || "",
      tiktok_url: socials.tiktok_url || "",
      youtube_url: socials.youtube_url || "",
      linkedin_url: socials.linkedin_url || ""
    };
    const evidenceText = `${place.title ?? ""} ${place.address ?? ""} ${socials.ukrainian_signal ? "ukrainian" : ""}`;
    if (!hasAnySocial(candidateBase)) continue;
    if (!hasUkrainianSignal(candidateBase, evidenceText)) continue;
    if (!countryMatchesCandidate(country, candidateBase, evidenceText)) continue;
    const score = qualityScore(candidateBase, evidenceText, place.rating, place.reviews);
    const candidate: LeadCandidate = { ...candidateBase, ...score };
    if (candidate.media_score < 45) continue;
    if (hasDuplicate(candidate, options.leads, [...options.existingCandidates, ...options.found])) continue;
    options.found.push(candidate);
  }

  if (options.found.length >= Math.min(3, options.limit)) return;

  const organicData = await fetchSerper("search", searchBody);
  for (const result of organicData.organic ?? []) {
    if (options.found.length >= options.limit) return;
    const base = mapSerperOrganic(result, category.niche, country.label);
    if (!base) continue;
    const socials = base.website_url && !isDirectoryUrl(base.website_url) ? await extractWebsiteSocials(base.website_url) : {};
    const candidateBase = {
      ...base,
      instagram_url: base.instagram_url || socials.instagram_url || "",
      facebook_url: base.facebook_url || socials.facebook_url || "",
      tiktok_url: base.tiktok_url || socials.tiktok_url || "",
      youtube_url: base.youtube_url || socials.youtube_url || "",
      linkedin_url: base.linkedin_url || socials.linkedin_url || ""
    };
    const evidenceText = `${result.title ?? ""} ${result.snippet ?? ""} ${socials.ukrainian_signal ? "ukrainian" : ""}`;
    if (!hasAnySocial(candidateBase)) continue;
    if (!hasUkrainianSignal(candidateBase, evidenceText)) continue;
    if (!countryMatchesCandidate(country, candidateBase, evidenceText)) continue;
    const score = qualityScore(candidateBase, evidenceText);
    const candidate: LeadCandidate = { ...candidateBase, ...score };
    if (candidate.media_score < 45) continue;
    if (hasDuplicate(candidate, options.leads, [...options.existingCandidates, ...options.found])) continue;
    options.found.push(candidate);
  }
}

async function findNominatimCandidates(options: {
  cities: string[];
  categories: Array<{ niche: string; tags: string[] }>;
  nicheQuery?: string;
  leads: LeadLookup[];
  existingCandidates: LeadCandidate[];
  found: LeadCandidate[];
  limit: number;
}) {
  const endpoint = process.env.NOMINATIM_API_URL || "https://nominatim.openstreetmap.org/search";
  for (const city of options.cities) {
    for (const category of options.categories) {
      for (const term of nominatimTerms(category.niche, options.nicheQuery)) {
        if (options.found.length >= options.limit) return;
        let places: NominatimPlace[] = [];
        try {
          const url = new URL(endpoint);
          url.searchParams.set("format", "jsonv2");
          url.searchParams.set("addressdetails", "1");
          url.searchParams.set("extratags", "1");
          url.searchParams.set("namedetails", "1");
          url.searchParams.set("limit", "8");
          url.searchParams.set("q", `${term} ${city}`);
          const response = await fetchWithTimeout(url.toString(), {
            headers: {
              "accept-language": "uk,en,pl",
              "user-agent": "HugoMediaSalesOS/1.0"
            }
          }, 10_000);
          if (!response.ok) continue;
          places = (await response.json()) as NominatimPlace[];
        } catch {
          continue;
        }

        for (const place of places) {
          if (options.found.length >= options.limit) return;
          const base = mapNominatimPlace(place, category.niche, city);
          if (!base) continue;
          const score = candidateScore(base, `${base.business_name} ${base.niche} ${base.address} ${place.type ?? ""} ${place.category ?? ""}`);
          const candidate: LeadCandidate = { ...base, ...score };
          if (hasDuplicate(candidate, options.leads, [...options.existingCandidates, ...options.found])) continue;
          options.found.push(candidate);
        }
      }
    }
  }
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
    source: candidate.source,
    notes: [
      `Media score: ${candidate.media_score}/100`,
      `Media level: ${candidate.media_level}`,
      `Media notes: ${candidate.media_notes}`,
      `Чому підходить: ${candidate.why_good_for_hugo}`,
      `Source URL: ${candidate.osm_url}`
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

export async function findLeadCandidates(options: { limit?: number; city?: string; nicheQuery?: string; qualityOnly?: boolean } = {}) {
  const limit = options.limit ?? 30;
  const cities = resolveCities(options.city);
  const normalizedNiche = normalizeLookup(options.nicheQuery);
  const aliases = normalizedNiche ? nicheAliases[normalizedNiche] ?? [] : [];
  const categories = options.nicheQuery
    ? categoryQueries.filter((item) => aliases.includes(item.niche) || `${item.niche} ${item.tags.join(" ")}`.toLowerCase().includes(options.nicheQuery?.toLowerCase() ?? ""))
    : categoryQueries;
  const fallbackTag = customNameTag(options.nicheQuery);
  const selectedCategories = categories.length
    ? categories
    : [{ niche: options.nicheQuery?.trim() || "Власна ніша", tags: [fallbackTag, '["name"]'].filter(Boolean) }];
  const [leads, existingCandidates] = await Promise.all([
    supabaseRequest<LeadLookup[]>("leads", "select=id,business_name,city,website_url,instagram_url,facebook_url,phone,email"),
    readCandidateStore()
  ]);
  const found: LeadCandidate[] = [];
  const overpassUrl = process.env.OVERPASS_API_URL || "https://overpass-api.de/api/interpreter";

  if (process.env.SERPER_API_KEY || options.qualityOnly) {
    if (!process.env.SERPER_API_KEY) {
      throw new Error("SERPER_API_KEY не заданий у Vercel. Якісний пошук вимкнений.");
    }
    await consumeQualitySearchQuota();
    await findSerperCandidates({
      locationQuery: options.city,
      categories: selectedCategories,
      nicheQuery: options.nicheQuery,
      leads,
      existingCandidates,
      found,
      limit
    });
    await saveCandidates(found);
    if (options.qualityOnly || found.length) return found;
  }

  for (const city of cities) {
    for (const category of selectedCategories) {
      if (found.length >= limit) break;
      let data: OverpassResponse;
      try {
        const response = await fetchWithTimeout(overpassUrl, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ data: overpassQuery(city, category.tags) }).toString()
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

  if (found.length < Math.min(5, limit)) {
    await findNominatimCandidates({
      cities,
      categories: selectedCategories,
      nicheQuery: options.nicheQuery,
      leads,
      existingCandidates,
      found,
      limit
    });
  }

  await saveCandidates(found);
  return found;
}
