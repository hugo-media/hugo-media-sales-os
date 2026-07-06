export type DailyContentTopic = {
  id: string;
  title: string;
  angle: string;
  pain: string;
  hook: string;
  format: string;
  talking_points: string[];
  caption: string;
  cta: string;
  sources: Array<{ title: string; url: string; snippet: string }>;
};

export type DailyTopicRun = {
  id: string;
  date: string;
  audience: string;
  region: string;
  status: "Ready" | "Fallback" | "Error";
  summary: string;
  topics: DailyContentTopic[];
  sources: Array<{ title: string; url: string; snippet: string }>;
  created_at: string;
};

type SettingsRow<T> = { key: string; value: T };

const topicSettingsKey = "daily_tiktok_topics";
const defaultAudience = "українці в Польщі та Європі";
const defaultRegion = "Poland and Europe";

function newId(prefix = "topic") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

async function readTopicRuns() {
  const rows = await supabaseRequest<SettingsRow<DailyTopicRun[]>[]>(
    "settings",
    `select=key,value&key=eq.${topicSettingsKey}&limit=1`
  );
  return Array.isArray(rows[0]?.value) ? rows[0].value ?? [] : [];
}

async function writeTopicRuns(runs: DailyTopicRun[]) {
  await supabaseRequest<null>("settings", "on_conflict=key", {
    method: "POST",
    headers: { prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify([{ key: topicSettingsKey, value: runs.slice(0, 30) }])
  });
}

function topicQueries() {
  return [
    "Українці в Польщі актуальні проблеми коментарі скандал",
    "Ukraińcy w Polsce komentarze problem skandal praca mieszkanie",
    "українці в Європі болі новини коментарі біженці",
    "Polska Ukraina ukraińcy praca mieszkanie świadczenia komentarze",
    "українці Польща TikTok тема відео робота житло документи"
  ];
}

async function fetchSerperSources() {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return [];

  const results: Array<{ title: string; url: string; snippet: string }> = [];
  for (const query of topicQueries()) {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "content-type": "application/json"
      },
      body: JSON.stringify({ q: query, gl: "pl", hl: "uk", num: 8 }),
      cache: "no-store"
    });
    if (!response.ok) continue;
    const data = await response.json() as {
      organic?: Array<{ title?: string; link?: string; snippet?: string }>;
      news?: Array<{ title?: string; link?: string; snippet?: string }>;
    };
    [...(data.news ?? []), ...(data.organic ?? [])].forEach((item) => {
      if (!item.title || !item.link) return;
      if (results.some((existing) => existing.url === item.link)) return;
      results.push({
        title: item.title,
        url: item.link,
        snippet: item.snippet ?? ""
      });
    });
  }

  return results.slice(0, 24);
}

function extractResponseText(data: unknown) {
  if (typeof data !== "object" || !data) return "";
  const record = data as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
  if (record.output_text) return record.output_text;
  return (record.output ?? [])
    .flatMap((item) => item.content ?? [])
    .map((content) => content.text ?? "")
    .join("\n")
    .trim();
}

function parseJsonObject(text: string) {
  const clean = text.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("OpenAI did not return JSON");
  return JSON.parse(clean.slice(start, end + 1)) as { summary?: string; topics?: DailyContentTopic[] };
}

async function analyzeWithOpenAI(sources: Array<{ title: string; url: string; snippet: string }>) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const sourceText = sources
    .map((source, index) => `${index + 1}. ${source.title}\n${source.snippet}\n${source.url}`)
    .join("\n\n");

  const prompt = [
    "Ти редактор TikTok для Hugo Media. Потрібно щоранку знайти гарячі теми для українців у Польщі та Європі.",
    "На основі джерел сформуй рівно 10 тем для коротких відео.",
    "Фокус: актуальні новини, скандали, болі українців, робота, житло, документи, медицина, бізнес, коментарі людей, соціальна напруга.",
    "Не вигадуй фактів. Якщо тема базується на тренді, формулюй як гіпотезу/кут, а не як факт.",
    "Поверни тільки JSON без markdown.",
    'Формат: {"summary":"короткий підсумок дня","topics":[{"title":"","angle":"","pain":"","hook":"","format":"","talking_points":["","",""],"caption":"","cta":"","sources":[{"title":"","url":"","snippet":""}]}]}',
    "",
    "Джерела:",
    sourceText
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_TOPIC_MODEL || "gpt-4o-mini",
      input: prompt,
      temperature: 0.4
    }),
    cache: "no-store"
  });

  if (!response.ok) throw new Error(`OpenAI ${response.status}: ${await response.text()}`);
  const parsed = parseJsonObject(extractResponseText(await response.json()));
  return {
    summary: parsed.summary || "Актуальні теми для українців у Польщі та Європі.",
    topics: normalizeTopics(parsed.topics ?? [], sources)
  };
}

function normalizeTopics(topics: DailyContentTopic[], sources: Array<{ title: string; url: string; snippet: string }>) {
  const fallback = fallbackTopics(sources).topics;
  const merged = [...topics, ...fallback].slice(0, 10);
  return merged.map((topic, index) => ({
    id: topic.id || newId(`daily-topic-${index + 1}`),
    title: topic.title || `Тема ${index + 1}`,
    angle: topic.angle || "Пояснити ситуацію простою мовою.",
    pain: topic.pain || "Люди не розуміють, що робити далі.",
    hook: topic.hook || "Що зараз важливо знати українцям у Польщі та Європі?",
    format: topic.format || "говоряча голова + 3 тези + питання в коментарі",
    talking_points: (topic.talking_points ?? []).slice(0, 4),
    caption: topic.caption || topic.title || `Тема ${index + 1}`,
    cta: topic.cta || "Напиши в коментарях, як це у твоєму місті.",
    sources: (topic.sources?.length ? topic.sources : sources.slice(index, index + 2)).slice(0, 3)
  }));
}

function fallbackTopics(sources: Array<{ title: string; url: string; snippet: string }>) {
  const base = sources.length ? sources : [
    { title: "Українці в Польщі: робота, житло, документи", url: "", snippet: "Ранковий fallback без підключеного OpenAI або Serper." }
  ];
  const topics = Array.from({ length: 10 }, (_, index) => {
    const source = base[index % base.length];
    return {
      id: newId(`fallback-topic-${index + 1}`),
      title: source.title,
      angle: "Розібрати, що це означає для українців у Польщі та Європі.",
      pain: source.snippet || "Невизначеність, документи, гроші, житло або робота.",
      hook: `Українці знову обговорюють це: ${source.title}`,
      format: "30-45 секунд: проблема, що сталося, що робити, питання в коментарі",
      talking_points: [
        "Що сталося простими словами",
        "Кого це зачіпає",
        "Що перевірити або зробити сьогодні"
      ],
      caption: `${source.title} Що думаєш?`,
      cta: "Напиши в коментарях, чи стикався з цим.",
      sources: [source]
    };
  });
  return { summary: "Fallback: теми сформовані з пошукових джерел без OpenAI-аналізу.", topics };
}

async function sendTelegramTopics(run: DailyTopicRun) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const lines = [
    "<b>10 тем для TikTok на сьогодні</b>",
    `Дата: ${run.date}`,
    "",
    run.summary,
    "",
    ...run.topics.map((topic, index) => `${index + 1}. <b>${escapeHtml(topic.title)}</b>\n${escapeHtml(topic.hook)}`)
  ];

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: lines.join("\n"),
      parse_mode: "HTML",
      disable_web_page_preview: true
    })
  });
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export async function generateDailyTopics(options: { sendTelegram?: boolean } = {}) {
  const today = dateKey();
  const sources = await fetchSerperSources();
  let status: DailyTopicRun["status"] = "Ready";
  let analysis = fallbackTopics(sources);

  try {
    const openAiAnalysis = await analyzeWithOpenAI(sources);
    if (openAiAnalysis) analysis = openAiAnalysis;
    else status = "Fallback";
  } catch (error) {
    console.error("Daily topic OpenAI analysis failed", error);
    status = "Fallback";
  }

  const run: DailyTopicRun = {
    id: newId("daily-topics"),
    date: today,
    audience: defaultAudience,
    region: defaultRegion,
    status,
    summary: analysis.summary,
    topics: normalizeTopics(analysis.topics, sources),
    sources,
    created_at: new Date().toISOString()
  };

  const existing = await readTopicRuns();
  const withoutToday = existing.filter((item) => item.date !== today);
  await writeTopicRuns([run, ...withoutToday]);
  if (options.sendTelegram) await sendTelegramTopics(run);
  return run;
}
