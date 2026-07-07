export type DailyContentTopic = {
  id: string;
  title: string;
  angle: string;
  pain: string;
  hook: string;
  hooks: string[];
  format: string;
  talking_points: string[];
  script_45s: string;
  caption: string;
  cta: string;
  conflict: string;
  series: string;
  pinned_comment: string;
  hate_replies: string[];
  engagement_replies: string[];
  virality_score: number;
  conflict_score: number;
  comment_score: number;
  emotion_score: number;
  ease_score: number;
  production_status: "Ідея" | "Зняти першим" | "Підтверджено" | "Знято" | "Змонтовано" | "Опубліковано" | "Архів";
  views: number;
  comments: number;
  saves: number;
  sources: Array<{ title: string; url: string; snippet: string }>;
};

export type DailyTopicRun = {
  id: string;
  date: string;
  audience: string;
  region: string;
  focus_key?: string;
  focus_label?: string;
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
const serperTimeoutMs = 8_000;
const openAiTimeoutMs = 38_000;
const topicFocusConfigs: Record<string, { label: string; instruction: string; queries: string[] }> = {
  all: {
    label: "Усе важливе",
    instruction: "Знайди найсильніші теми дня: новини, болі, конфлікти, лайфхаки, коментарі людей і теми, які можуть набрати перегляди.",
    queries: [
      "Українці в Польщі актуальні проблеми коментарі скандал",
      "Ukraińcy w Polsce komentarze problem skandal praca mieszkanie",
      "українці в Європі болі новини коментарі біженці",
      "Polska Ukraina ukraińcy praca mieszkanie świadczenia komentarze",
      "українці Польща TikTok тема відео робота житло документи"
    ]
  },
  legalization: {
    label: "Легалізація",
    instruction: "Фокус тільки на документах, легалізації, картах побиту, візах, депортації, чергах, дедлайнах і типових помилках українців.",
    queries: [
      "українці Польща легалізація карта побиту проблеми 2026",
      "karta pobytu Ukraińcy problem dokumenty komentarze",
      "українці Польща документи дедлайн помилки легалізація",
      "legalizacja pobytu Ukraińcy Polska news",
      "українці Європа легалізація документи статус захисту"
    ]
  },
  politics: {
    label: "Політика",
    instruction: "Фокус на політиці, рішеннях влади, польсько-українських конфліктах, настроях суспільства і тому, як це впливає на українців.",
    queries: [
      "Польща Україна політика українці коментарі скандал",
      "Polska Ukraina polityka Ukraińcy komentarze skandal",
      "українці в Польщі політичний конфлікт новини",
      "антиукраїнські настрої Польща українці",
      "Polska Ukraińcy wybory świadczenia mieszkanie praca komentarze"
    ]
  },
  work: {
    label: "Робота",
    instruction: "Фокус на роботі, зарплатах, обмані роботодавців, працевлаштуванні, документах для роботи і болях працівників.",
    queries: [
      "українці Польща робота зарплата обман коментарі",
      "Ukraińcy w Polsce praca zarobki problem komentarze",
      "українці Польща працевлаштування проблеми 2026",
      "робота в Польщі українці найчастіші питання",
      "Ukraińcy Polska praca agencja oszustwo"
    ]
  },
  conflicts: {
    label: "Конфлікти і проблеми",
    instruction: "Фокус на гострих конфліктах, скандалах, дискримінації, хейті, житлі, роботі, побутових ситуаціях і темах, які викликають коментарі.",
    queries: [
      "українці Польща конфлікт скандал коментарі",
      "Ukraińcy w Polsce konflikt skandal komentarze",
      "українці Польща дискримінація хейт проблеми",
      "Polacy Ukraińcy konflikt komentarze",
      "українці в Європі конфлікт житло робота"
    ]
  },
  lifehacks: {
    label: "Лайфхаки в Польщі",
    instruction: "Фокус на практичних лайфхаках: документи, житло, медицина, школа, робота, податки, сервіси, що реально полегшують життя українців.",
    queries: [
      "українці Польща лайфхаки документи житло медицина",
      "jak Ukraińcy w Polsce poradnik dokumenty praca mieszkanie",
      "українці Польща що треба знати 2026",
      "корисні сервіси для українців у Польщі",
      "українці Польща найчастіші питання відповіді"
    ]
  },
  pain_analysis: {
    label: "Болі українців",
    instruction: "Зроби аналіз найчастіших болів і запитів українців у Польщі. Теми мають відповідати на питання, які люди реально задають.",
    queries: [
      "українці в Польщі найчастіші питання проблеми",
      "українці Польща болі коментарі форум",
      "Ukraińcy w Polsce pytania problemy forum komentarze",
      "українці Польща документи робота житло медицина питання",
      "українці Польща що робити якщо"
    ]
  },
  viral_creators: {
    label: "Віральні блогери",
    instruction: "Проаналізуй, які теми у українських блогерів у Польщі потенційно залітають: конфлікти, особисті історії, поради, робота, документи, коментарі.",
    queries: [
      "site:tiktok.com українці в Польщі робота документи",
      "site:tiktok.com українка в Польщі проблеми",
      "site:tiktok.com українці Польща лайфхаки",
      "українські блогери в Польщі TikTok теми",
      "TikTok українці в Польщі відео коментарі"
    ]
  }
};

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

const fallbackSupabaseUrl = "https://lukxdctqcaprfwfisblw.supabase.co";

function cleanSupabaseUrl(value?: string) {
  const cleaned = (value ?? "").replace(/^\uFEFF/, "").trim().replace(/^"(.*)"$/, "$1");
  return cleaned || fallbackSupabaseUrl;
}

function supabaseConfig() {
  const url = cleanSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
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

function topicFocus(focusKey?: string) {
  return topicFocusConfigs[focusKey || "all"] ?? topicFocusConfigs.all;
}

async function fetchWithTimeout(input: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchSerperSources(focusKey?: string) {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return [];
  const focus = topicFocus(focusKey);

  const batches = await Promise.allSettled(focus.queries.slice(0, 3).map(async (query) => {
    const response = await fetchWithTimeout("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "content-type": "application/json"
      },
      body: JSON.stringify({ q: query, gl: "pl", hl: "uk", num: 6 }),
      cache: "no-store"
    }, serperTimeoutMs);
    if (!response.ok) return [];
    const data = await response.json() as {
      organic?: Array<{ title?: string; link?: string; snippet?: string }>;
      news?: Array<{ title?: string; link?: string; snippet?: string }>;
    };
    return [...(data.news ?? []), ...(data.organic ?? [])]
      .filter((item) => item.title && item.link)
      .map((item) => ({
        title: item.title ?? "",
        url: item.link ?? "",
        snippet: item.snippet ?? ""
      }));
  }));

  const results: Array<{ title: string; url: string; snippet: string }> = [];
  batches.flatMap((batch) => batch.status === "fulfilled" ? batch.value : []).forEach((item) => {
    if (results.some((existing) => existing.url === item.url)) return;
    results.push(item);
  });

  return results.slice(0, 16);
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

async function analyzeWithOpenAI(
  sources: Array<{ title: string; url: string; snippet: string }>,
  previousTitles: string[],
  focusKey?: string
) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  const focus = topicFocus(focusKey);

  const sourceText = sources
    .slice(0, 10)
    .map((source, index) => `${index + 1}. ${source.title}\n${source.snippet}\n${source.url}`)
    .join("\n\n");

  const prompt = [
    "Ти редактор TikTok для Hugo Media. Потрібно щоранку знайти гарячі теми для українців у Польщі та Європі.",
    "На основі джерел сформуй рівно 10 тем для коротких відео.",
    `Фокус генерації: ${focus.label}.`,
    `Інструкція фокусу: ${focus.instruction}`,
    "Фокус: актуальні новини, скандали, болі українців, робота, житло, документи, медицина, бізнес, коментарі людей, соціальна напруга.",
    "Кожна тема має бути не сухою новиною, а TikTok-ідеєю з конфліктом, емоцією, коментарями і чіткою позицією Hugo.",
    "Позиція Hugo: показую не просто подію, а як це впливає на українців, бізнес і людей за кордоном.",
    "Не повторюй теми з попередніх запусків. Якщо новина та сама, знайди інший свіжий кут, біль або конфлікт.",
    "Нові теми став у production_status 'Ідея'. Тільки якщо тема дуже сильна, постав 'Зняти першим'. Не став 'Підтверджено', 'Знято' або 'Архів' під час генерації.",
    "Не генеруй довгий сценарій і багато коментарів: дай ядро теми, а система сама добудує production-пакет.",
    "Оціни кожну тему числами 0-10: virality_score, conflict_score, comment_score, emotion_score, ease_score.",
    "production_status для топ-3 тем постав 'Зняти першим', для інших 'Ідея'.",
    "Не вигадуй фактів. Якщо тема базується на тренді, формулюй як гіпотезу/кут, а не як факт.",
    "Поверни тільки JSON без markdown.",
    'Формат: {"summary":"короткий підсумок дня","topics":[{"title":"","angle":"","pain":"","hook":"","format":"","talking_points":["","",""],"caption":"","cta":"","conflict":"","series":"","virality_score":0,"conflict_score":0,"comment_score":0,"emotion_score":0,"ease_score":0,"production_status":"Ідея","sources":[{"title":"","url":"","snippet":""}]}]}',
    "",
    "Попередні теми, які НЕ можна повторювати:",
    previousTitles.slice(0, 40).map((title, index) => `${index + 1}. ${title}`).join("\n") || "немає",
    "",
    "Джерела:",
    sourceText
  ].join("\n");

  const response = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_TOPIC_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Ти сильний редактор TikTok і повертаєш тільки валідний JSON без markdown."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.35,
      max_tokens: 2600
    }),
    cache: "no-store"
  }, openAiTimeoutMs);

  if (!response.ok) throw new Error(`OpenAI ${response.status}: ${await response.text()}`);
  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const parsed = parseJsonObject(data.choices?.[0]?.message?.content ?? "");
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
    hooks: normalizeHooks(topic),
    format: topic.format || "говоряча голова + 3 тези + питання в коментарі",
    talking_points: (topic.talking_points ?? []).slice(0, 4),
    script_45s: topic.script_45s || buildDefaultScript(topic),
    caption: topic.caption || topic.title || `Тема ${index + 1}`,
    cta: topic.cta || "Напиши в коментарях, як це у твоєму місті.",
    conflict: topic.conflict || "Люди не погоджуються, хто винен і що робити далі.",
    series: topic.series || pickSeries(topic),
    pinned_comment: topic.pinned_comment || "А як це у вашому місті? Напишіть у коментарях.",
    hate_replies: normalizeList(topic.hate_replies, [
      "Я не узагальнюю всіх. Показую конкретну проблему і як вона впливає на людей.",
      "Давайте без образ: важливо зрозуміти факти і наслідки.",
      "Якщо маєте інший досвід, напишіть місто і ситуацію."
    ], 3),
    engagement_replies: normalizeList(topic.engagement_replies, [
      "Цікаво, у якому ви місті і як це виглядає там?",
      "Що було найскладніше саме для вас?",
      "Зібрати окреме відео з вашими історіями?"
    ], 3),
    virality_score: score(topic.virality_score, index),
    conflict_score: score(topic.conflict_score, index),
    comment_score: score(topic.comment_score, index),
    emotion_score: score(topic.emotion_score, index),
    ease_score: score(topic.ease_score, index),
    production_status: topic.production_status || (index < 3 ? "Зняти першим" : "Ідея"),
    views: Number(topic.views) || 0,
    comments: Number(topic.comments) || 0,
    saves: Number(topic.saves) || 0,
    sources: (topic.sources?.length ? topic.sources : sources.slice(index, index + 2)).slice(0, 3)
  }));
}

function normalizeList(values: string[] | undefined, fallback: string[], limit: number) {
  const clean = (values ?? []).filter((value) => value && value.trim()).map((value) => value.trim());
  return [...clean, ...fallback].slice(0, limit);
}

function normalizeHooks(topic: DailyContentTopic) {
  return normalizeList(topic.hooks, [
    topic.hook || "Українці в Польщі, це вас напряму стосується.",
    "Про це мовчать, але в коментарях вже кипить.",
    "Якщо ти живеш у Польщі або Європі, перевір це сьогодні.",
    "Поляки знову обговорюють українців, і ось чому.",
    "Це може стати новою проблемою для українців за кордоном."
  ], 5);
}

function buildDefaultScript(topic: Pick<DailyContentTopic, "title" | "hook" | "pain" | "angle" | "cta">) {
  return [
    `0-3 сек: ${topic.hook || topic.title}`,
    `3-12 сек: коротко пояснити, що сталося: ${topic.title}`,
    `12-25 сек: показати біль: ${topic.pain || "люди не розуміють, що робити"}`,
    `25-38 сек: позиція Hugo: ${topic.angle || "як це впливає на українців за кордоном"}`,
    `38-45 сек: ${topic.cta || "питання в коментарі"}`
  ].join("\n");
}

function pickSeries(topic: Pick<DailyContentTopic, "title" | "pain" | "angle">) {
  const text = `${topic.title} ${topic.pain} ${topic.angle}`.toLowerCase();
  if (text.includes("документ") || text.includes("легал")) return "Документи без паніки";
  if (text.includes("робот") || text.includes("зарплат")) return "Українці в Польщі: робота і гроші";
  if (text.includes("житл") || text.includes("оренд")) return "Житло українців у Європі";
  if (text.includes("бізнес") || text.includes("подат")) return "Бізнес українців за кордоном";
  return "Українці в Польщі: що змінилось сьогодні";
}

function score(value: number | undefined, index: number) {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric >= 0) return Math.max(0, Math.min(10, Math.round(numeric)));
  return Math.max(6, 10 - Math.floor(index / 2));
}

function fallbackTopics(sources: Array<{ title: string; url: string; snippet: string }>): { summary: string; topics: DailyContentTopic[] } {
  const base = sources.length ? sources : [
    { title: "Українці в Польщі: робота, житло, документи", url: "", snippet: "Ранковий fallback без підключеного OpenAI або Serper." }
  ];
  const topics = Array.from({ length: 10 }, (_, index) => {
    const source = base[index % base.length];
    const productionStatus: DailyContentTopic["production_status"] = index < 3 ? "Зняти першим" : "Ідея";
    return {
      id: newId(`fallback-topic-${index + 1}`),
      title: source.title,
      angle: "Розібрати, що це означає для українців у Польщі та Європі.",
      pain: source.snippet || "Невизначеність, документи, гроші, житло або робота.",
      hook: `Українці знову обговорюють це: ${source.title}`,
      hooks: [
        `Українці знову обговорюють це: ${source.title}`,
        "Про це вже сперечаються в коментарях.",
        "Якщо ти живеш у Польщі або Європі, це важливо.",
        "Що насправді стоїть за цією новиною?",
        "Це може зачепити багатьох українців за кордоном."
      ],
      format: "30-45 секунд: проблема, що сталося, що робити, питання в коментарі",
      talking_points: [
        "Що сталося простими словами",
        "Кого це зачіпає",
        "Що перевірити або зробити сьогодні"
      ],
      script_45s: [
        `0-3 сек: Українці знову обговорюють це: ${source.title}`,
        "3-12 сек: коротко пояснити новину без паніки",
        "12-25 сек: показати, кого це зачіпає",
        "25-38 сек: дати позицію Hugo і практичний висновок",
        "38-45 сек: попросити людей написати свій досвід"
      ].join("\n"),
      caption: `${source.title} Що думаєш?`,
      cta: "Напиши в коментарях, чи стикався з цим.",
      conflict: "Одна сторона каже, що проблема перебільшена, інша вже відчуває наслідки.",
      series: "Українці в Польщі: що змінилось сьогодні",
      pinned_comment: "У якому місті ви живете і чи бачите цю проблему?",
      hate_replies: [
        "Я не узагальнюю всіх. Показую конкретну ситуацію і наслідки.",
        "Без образ: важливо говорити фактами.",
        "Якщо маєте інший досвід, напишіть його."
      ],
      engagement_replies: [
        "А як це у вашому місті?",
        "Що було найскладніше саме для вас?",
        "Зробити продовження з коментарями?"
      ],
      virality_score: Math.max(6, 10 - Math.floor(index / 2)),
      conflict_score: Math.max(6, 9 - Math.floor(index / 3)),
      comment_score: Math.max(6, 9 - Math.floor(index / 3)),
      emotion_score: Math.max(6, 8 - Math.floor(index / 4)),
      ease_score: 8,
      production_status: productionStatus,
      views: 0,
      comments: 0,
      saves: 0,
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
    "<b>Зняти першими</b>",
    ...[...run.topics]
      .sort((a, b) => topicPowerScore(b) - topicPowerScore(a))
      .slice(0, 3)
      .map((topic, index) => `${index + 1}. <b>${escapeHtml(topic.title)}</b> · power ${topicPowerScore(topic)}\n${escapeHtml(topic.hook)}`),
    "",
    "<b>Всі теми</b>",
    ...run.topics.map((topic, index) => `${index + 1}. <b>${escapeHtml(topic.title)}</b> · ${topic.production_status}\n${escapeHtml(topic.hook)}`)
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

function topicPowerScore(topic: DailyContentTopic) {
  return Math.round(
    topic.virality_score * 2.6 +
    topic.conflict_score * 2.1 +
    topic.comment_score * 2.2 +
    topic.emotion_score * 1.8 +
    topic.ease_score * 1.3
  );
}

export async function generateDailyTopics(options: { sendTelegram?: boolean; requireReady?: boolean; focusKey?: string } = {}) {
  const today = dateKey();
  const existing = await readTopicRuns();
  const previousTitles = existing.flatMap((run) => run.topics?.map((topic) => topic.title) ?? []);
  const focus = topicFocus(options.focusKey);
  const sources = await fetchSerperSources(options.focusKey);
  let status: DailyTopicRun["status"] = "Ready";
  let analysis = fallbackTopics(sources);
  let openAiError = "";

  try {
    const openAiAnalysis = await analyzeWithOpenAI(sources, previousTitles, options.focusKey);
    if (openAiAnalysis) analysis = openAiAnalysis;
    else {
      status = "Fallback";
      openAiError = "OPENAI_API_KEY не налаштований або порожній";
    }
  } catch (error) {
    console.error("Daily topic OpenAI analysis failed", error);
    status = "Fallback";
    openAiError = error instanceof Error ? error.message : "OpenAI не повернув теми";
  }

  if (options.requireReady && status !== "Ready") {
    throw new Error(`OpenAI не згенерував нові теми: ${openAiError || "невідома причина"}`);
  }

  const run: DailyTopicRun = {
    id: newId("daily-topics"),
    date: today,
    audience: defaultAudience,
    region: defaultRegion,
    focus_key: options.focusKey || "all",
    focus_label: focus.label,
    status,
    summary: analysis.summary,
    topics: normalizeTopics(analysis.topics, sources),
    sources,
    created_at: new Date().toISOString()
  };

  await writeTopicRuns([run, ...existing]);
  if (options.sendTelegram) await sendTelegramTopics(run);
  return run;
}
