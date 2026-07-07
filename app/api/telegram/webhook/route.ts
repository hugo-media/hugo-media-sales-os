import {
  addCandidateToCrm,
  dateKey,
  findLeadCandidates,
  getLeadSearchQuota,
  listCandidates,
  updateCandidateStatus
} from "@/lib/lead-finder";
import type { LeadCandidate } from "@/lib/lead-finder";
import type { DailyContentTopic, DailyTopicRun } from "@/lib/daily-topics";

type LeadStatus =
  | "Новий"
  | "Проаналізований"
  | "Написав"
  | "Контакт"
  | "Без відповіді"
  | "Відповів"
  | "КП"
  | "КП відправлено"
  | "Дзвінок"
  | "Дзвінок заплановано"
  | "Думає"
  | "На паузі"
  | "Виграно"
  | "Закриті"
  | "Програно"
  | "Повернутись пізніше";

type LeadRow = {
  id: string;
  business_name: string;
  priority?: "Low" | "Medium" | "High" | "Hot" | null;
  status: LeadStatus;
  deal_value: number | null;
  follow_up_date: string | null;
  next_action: string | null;
  updated_at: string | null;
  created_at: string | null;
};

type TaskRow = {
  id: string;
  title: string;
  type?: string | null;
  related_lead_id?: string | null;
  due_date: string | null;
  status: string;
};

type TelegramUpdate = {
  message?: {
    chat?: { id?: number | string };
    text?: string;
  };
  callback_query?: {
    id: string;
    data?: string;
    message?: {
      chat?: { id?: number | string };
    };
  };
};

const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || "";
const appUrl = (rawAppUrl && !rawAppUrl.startsWith("http") ? `https://${rawAppUrl}` : rawAppUrl).replace(/\/$/, "");
const fallbackSupabaseUrl = "https://lukxdctqcaprfwfisblw.supabase.co";

function cleanSupabaseUrl(value?: string) {
  const cleaned = (value ?? "").replace(/^\uFEFF/, "").trim().replace(/^"(.*)"$/, "$1");
  return cleaned || fallbackSupabaseUrl;
}
const leadFinderNiches = [
  { key: "legal", label: "Легалізація / юристи", query: "Легалізація" },
  { key: "accounting", label: "Бухгалтерія", query: "Бухгалтерія" },
  { key: "beauty", label: "Beauty", query: "Beauty" },
  { key: "auto", label: "Авто", query: "Авто" },
  { key: "education", label: "Освіта", query: "Освіта" },
  { key: "realestate", label: "Нерухомість", query: "Нерухомість" },
  { key: "insurance", label: "Страхування", query: "Страхування" },
  { key: "medical", label: "Медицина", query: "Медицина" },
  { key: "translator", label: "Переклади", query: "Переклади" }
];
const leadFinderCountries = [
  { key: "poland", label: "Польща" },
  { key: "germany", label: "Німеччина" },
  { key: "czechia", label: "Чехія" },
  { key: "slovakia", label: "Словаччина" },
  { key: "austria", label: "Австрія" },
  { key: "netherlands", label: "Нідерланди" },
  { key: "france", label: "Франція" },
  { key: "spain", label: "Іспанія" },
  { key: "italy", label: "Італія" },
  { key: "portugal", label: "Португалія" },
  { key: "belgium", label: "Бельгія" },
  { key: "ireland", label: "Ірландія" }
];
const topicSettingsKey = "daily_tiktok_topics";
const topicStatusByCode: Record<string, DailyContentTopic["production_status"]> = {
  first: "Зняти першим",
  confirm: "Підтверджено",
  shot: "Знято",
  edited: "Змонтовано",
  published: "Опубліковано",
  archive: "Архів"
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function money(value: number | null | undefined) {
  return `${new Intl.NumberFormat("uk-UA").format(Math.max(0, Number(value) || 0))} €`;
}

function compact(value: string | null | undefined, fallback = "—") {
  const text = value?.trim();
  if (!text) return fallback;
  return text.length > 220 ? `${text.slice(0, 217)}...` : text;
}

function visibleLeadStatus(status: LeadStatus): LeadStatus {
  if (status === "Проаналізований") return "Новий";
  if (status === "Написав" || status === "Відповів") return "Контакт";
  if (status === "КП відправлено") return "КП";
  if (status === "Дзвінок заплановано") return "Дзвінок";
  if (status === "Думає" || status === "Повернутись пізніше") return "На паузі";
  if (status === "Програно") return "Закриті";
  return status;
}

function leadScore(lead: LeadRow, today: string) {
  let score = 20;
  const value = Number(lead.deal_value) || 0;
  if (value >= 2000) score += 24;
  else if (value >= 1000) score += 18;
  else if (value >= 300) score += 10;
  if (["Контакт", "Без відповіді", "Дзвінок", "КП", "На паузі"].includes(visibleLeadStatus(lead.status))) score += 24;
  if (lead.follow_up_date && lead.follow_up_date < today) score += 18;
  if (lead.follow_up_date === today) score += 14;
  if (visibleLeadStatus(lead.status) === "Закриті") score -= 30;
  if (lead.status === "Виграно") score -= 20;
  return Math.max(0, Math.min(100, score));
}

function leadAction(lead: LeadRow, today: string) {
  if (lead.next_action?.trim()) return lead.next_action.trim();
  if (lead.status === "Новий" || lead.status === "Проаналізований") return "Написати перше повідомлення";
  if (visibleLeadStatus(lead.status) === "Контакт") return lead.follow_up_date && lead.follow_up_date <= today ? "Зробити follow-up" : "Дочекатися follow-up";
  if (visibleLeadStatus(lead.status) === "Без відповіді") return lead.follow_up_date && lead.follow_up_date <= today ? "Минув тиждень без відповіді: закрити ліда або зробити останній follow-up" : "Чекати тиждень після останнього контакту";
  if (visibleLeadStatus(lead.status) === "КП") return "Follow-up після КП";
  if (visibleLeadStatus(lead.status) === "Дзвінок") return "Підготуватися до дзвінка";
  if (visibleLeadStatus(lead.status) === "На паузі") return "Повернутися у домовлений день";
  return "Відкрити CRM і визначити наступний крок";
}

function isLeadClosed(lead?: Pick<LeadRow, "status"> | null) {
  return Boolean(lead && ["Закриті", "Виграно"].includes(visibleLeadStatus(lead.status)));
}

async function supabaseGet<T>(table: string, query: string) {
  const supabaseUrl = cleanSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase env vars");
  }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: supabaseKey,
      authorization: `Bearer ${supabaseKey}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Supabase ${table} ${response.status}: ${await response.text()}`);
  }

  return (await response.json()) as T;
}

async function supabaseWrite<T>(table: string, query: string, body: unknown) {
  const supabaseUrl = cleanSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase env vars");
  }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/${table}?${query}`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      authorization: `Bearer ${supabaseKey}`,
      "content-type": "application/json",
      prefer: "resolution=merge-duplicates,return=minimal"
    },
    body: JSON.stringify(body),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Supabase ${table} ${response.status}: ${await response.text()}`);
  }

  return null as T;
}

function isMissingSupabaseColumn(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("PGRST204") || message.includes("42703") || message.includes("schema cache") || message.includes("Could not find the") || message.includes("does not exist");
}

async function getLeadsForBot() {
  try {
    return await supabaseGet<LeadRow[]>(
      "leads",
      "select=id,business_name,priority,status,deal_value,follow_up_date,next_action,updated_at,created_at&order=follow_up_date.asc"
    );
  } catch (error) {
    if (!isMissingSupabaseColumn(error)) throw error;
    const rows = await supabaseGet<Omit<LeadRow, "priority">[]>(
      "leads",
      "select=id,business_name,status,deal_value,follow_up_date,next_action,updated_at,created_at&order=follow_up_date.asc"
    );
    return rows.map((lead) => ({ ...lead, priority: "Medium" as const }));
  }
}

async function readTopicRuns() {
  try {
    const rows = await supabaseGet<Array<{ key: string; value: DailyTopicRun[] }>>(
      "settings",
      `select=key,value&key=eq.${topicSettingsKey}&limit=1`
    );
    return Array.isArray(rows[0]?.value) ? rows[0].value : [];
  } catch (error) {
    if (!isMissingSupabaseColumn(error)) console.error("Telegram topic settings read failed", error);
    return [];
  }
}

async function writeTopicRuns(runs: DailyTopicRun[]) {
  await supabaseWrite<null>("settings", "on_conflict=key", [{ key: topicSettingsKey, value: runs.slice(0, 30) }]);
}

function topicPowerScore(topic: Partial<DailyContentTopic>) {
  return Math.round(
    (Number(topic.virality_score) || 0) * 2.6 +
    (Number(topic.conflict_score) || 0) * 2.1 +
    (Number(topic.comment_score) || 0) * 2.2 +
    (Number(topic.emotion_score) || 0) * 1.8 +
    (Number(topic.ease_score) || 0) * 1.3
  );
}

function latestTopicRun(runs: DailyTopicRun[]) {
  return [...runs].sort((a, b) => (b.created_at || b.date || "").localeCompare(a.created_at || a.date || ""))[0];
}

function topTopicItems(run?: DailyTopicRun) {
  return (run?.topics ?? [])
    .filter((topic) => topic.production_status !== "Архів")
    .map((topic, index) => ({ topic, index: index + 1 }))
    .sort((a, b) => topicPowerScore(b.topic) - topicPowerScore(a.topic))
    .slice(0, 5);
}

function topicKeyboard(items: Array<{ index: number; topic: DailyContentTopic }>) {
  return {
    inline_keyboard: items.slice(0, 5).flatMap((item) => [
      [
        { text: `${item.index}. Підтвердити`, callback_data: `topic:${item.index}:confirm` },
        { text: `${item.index}. Архів`, callback_data: `topic:${item.index}:archive` }
      ],
      [
        { text: `${item.index}. Зняти`, callback_data: `topic:${item.index}:shot` },
        { text: `${item.index}. Змонтовано`, callback_data: `topic:${item.index}:edited` }
      ],
      [
        { text: `${item.index}. Опубліковано`, callback_data: `topic:${item.index}:published` }
      ]
    ])
  };
}

function buildTopicsMessage(run?: DailyTopicRun) {
  if (!run?.topics?.length) {
    return [
      "<b>Теми дня</b>",
      "",
      "Поки немає збережених тем. Натисни кнопку у CRM на сторінці «Теми дня» або дочекайся ранкового автоаналізу."
    ].join("\n");
  }

  const top = topTopicItems(run);
  const lines = [
    "<b>Теми дня — що знімати першим</b>",
    `Дата: ${escapeHtml(run.date)}`,
    "",
    ...top.map((item) => [
      `${item.index}. <b>${escapeHtml(item.topic.title)}</b> · power ${topicPowerScore(item.topic)} · ${escapeHtml(item.topic.production_status || "Ідея")}`,
      `Хук: ${escapeHtml(compact(item.topic.hook || item.topic.hooks?.[0]))}`,
      `Суть: ${escapeHtml(compact(item.topic.angle || item.topic.pain))}`
    ].join("\n")),
    "",
    "Після публікації напиши: <code>/metrics 1 12000 84 37</code>",
    "де 1 — номер теми, далі перегляди, коментарі, збереження."
  ];

  if (appUrl) lines.push("", `<a href="${appUrl}/daily-topics">Відкрити теми в CRM</a>`);
  return lines.join("\n\n");
}

async function updateLatestTopicStatus(index: number, status: DailyContentTopic["production_status"]) {
  const runs = await readTopicRuns();
  const run = latestTopicRun(runs);
  const topic = run?.topics?.[index - 1];
  if (!run || !topic) return null;
  topic.production_status = status;
  await writeTopicRuns(runs);
  return topic;
}

async function updateLatestTopicMetrics(index: number, views: number, comments: number, saves: number) {
  const runs = await readTopicRuns();
  const run = latestTopicRun(runs);
  const topic = run?.topics?.[index - 1];
  if (!run || !topic) return null;
  topic.views = Math.max(0, views);
  topic.comments = Math.max(0, comments);
  topic.saves = Math.max(0, saves);
  topic.production_status = "Опубліковано";
  await writeTopicRuns(runs);
  return topic;
}

async function sendTelegram(chatId: number | string, text: string, replyMarkup?: unknown) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("Missing Telegram bot token");
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
      parse_mode: "HTML",
      reply_markup: replyMarkup ?? {
        keyboard: [
          [{ text: "✅ План дня" }, { text: "🎬 Теми дня" }],
          [{ text: "📞 Дзвінки" }, { text: "🔥 Кому писати" }],
          [{ text: "🔎 Пошук лідів" }, { text: "⚡ Що робити зараз" }],
          [{ text: "⏰ Прострочені" }, { text: "💶 Pipeline" }, { text: "📋 /candidates" }],
          [{ text: "Відкрити CRM" }]
        ],
        resize_keyboard: true
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Telegram ${response.status}: ${await response.text()}`);
  }
}

function leadFinderNicheKeyboard() {
  return {
    inline_keyboard: [
      ...leadFinderNiches.reduce<Array<Array<{ text: string; callback_data: string }>>>((rows, niche, index) => {
        if (index % 2 === 0) rows.push([]);
        rows[rows.length - 1].push({ text: niche.label, callback_data: `find_niche:${niche.key}` });
        return rows;
      }, [])
    ]
  };
}

function leadFinderCountryKeyboard(nicheKey: string) {
  return {
    inline_keyboard: [
      ...leadFinderCountries.reduce<Array<Array<{ text: string; callback_data: string }>>>((rows, country, index) => {
        if (index % 2 === 0) rows.push([]);
        rows[rows.length - 1].push({ text: country.label, callback_data: `find_country:${nicheKey}:${country.key}` });
        return rows;
      }, [])
    ]
  };
}

async function runLeadFinder(chatId: number | string, nicheQuery?: string, countryOrCity?: string, limit = 10) {
  await sendTelegram(chatId, `Шукаю якісних кандидатів: <b>${escapeHtml(nicheQuery || "усі ніші")}</b> · <b>${escapeHtml(countryOrCity || "Європа")}</b>`);
  const candidates = await findLeadCandidates({ limit, nicheQuery, city: countryOrCity, qualityOnly: true });
  const quota = await getLeadSearchQuota();
  await sendTelegram(chatId, `Знайшов ${candidates.length} кандидатів без дублів. Ліміт на сьогодні: ${quota.used}/${quota.limit}, залишилось ${quota.remaining}.`);
  await sendCandidateCards(chatId, candidates);
}

async function answerCallback(callbackId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackId, text })
  });
}

function candidateCard(candidate: LeadCandidate, index?: number, total?: number) {
  const title = index && total ? `🆕 Lead candidate ${index}/${total}` : "🆕 Lead candidate";
  return [
    `<b>${title}</b>`,
    "",
    `<b>${escapeHtml(candidate.business_name)}</b>`,
    `Ніша: ${escapeHtml(candidate.niche)}`,
    `Місто: ${escapeHtml(candidate.city)}`,
    `Джерело: ${escapeHtml(candidate.source)}`,
    "",
    `Website: ${candidate.website_url ? "✅" : "—"}`,
    `Instagram: ${candidate.instagram_url ? "✅" : "—"}`,
    `Facebook: ${candidate.facebook_url ? "✅" : "—"}`,
    `TikTok: ${candidate.tiktok_url ? "✅" : "—"}`,
    `Phone/email: ${candidate.phone || candidate.email ? "✅" : "—"}`,
    "",
    `Media score: <b>${candidate.media_score}/100</b>`,
    `Рівень: ${escapeHtml(candidate.media_level)}`,
    "",
    "<b>Чому підходить:</b>",
    escapeHtml(candidate.why_good_for_hugo)
  ].join("\n");
}

function candidateButtons(candidate: LeadCandidate) {
  const rows: Array<Array<{ text: string; callback_data?: string; url?: string }>> = [
    [
      { text: "Додати в CRM", callback_data: `candidate_add:${candidate.id}` },
      { text: "Hot", callback_data: `candidate_hot:${candidate.id}` }
    ],
    [
      { text: "Later", callback_data: `candidate_later:${candidate.id}` },
      { text: "Reject", callback_data: `candidate_reject:${candidate.id}` }
    ]
  ];
  const links: Array<{ text: string; url: string }> = [];
  if (candidate.website_url) links.push({ text: "Website", url: candidate.website_url });
  if (candidate.instagram_url) links.push({ text: "Instagram", url: candidate.instagram_url });
  if (candidate.facebook_url) links.push({ text: "Facebook", url: candidate.facebook_url });
  links.push({ text: "Google Search", url: `https://www.google.com/search?q=${encodeURIComponent(`${candidate.business_name} ${candidate.city} Instagram`)}` });
  rows.push(links);
  return { inline_keyboard: rows };
}

async function sendCandidateCards(chatId: number | string, candidates: LeadCandidate[]) {
  if (!candidates.length) {
    await sendTelegram(chatId, "Кандидатів немає. Спробуй іншу нішу або країну. Я більше не підмішую слабкі картографічні результати в якісний пошук.");
    return;
  }
  for (const [index, candidate] of candidates.slice(0, 5).entries()) {
    await sendTelegram(chatId, candidateCard(candidate, index + 1, candidates.length), candidateButtons(candidate));
  }
  if (candidates.length > 5) {
    await sendTelegram(chatId, `Показав перші 5 з ${candidates.length}. Напиши /candidates, щоб побачити збережених кандидатів.`);
  }
}

function buildStatus(leads: LeadRow[], tasks: TaskRow[], today: string) {
  const activeLeads = leads.filter((lead) => !["Виграно", "Закриті"].includes(visibleLeadStatus(lead.status)));
  const due = activeLeads.filter((lead) => lead.follow_up_date && lead.follow_up_date <= today);
  const overdue = due.filter((lead) => lead.follow_up_date && lead.follow_up_date < today);
  const hot = [...activeLeads].sort((a, b) => leadScore(b, today) - leadScore(a, today)).slice(0, 5);
  const openTasks = tasks.filter((task) => !["Done", "Cancelled"].includes(task.status) && !isLeadClosed(leads.find((lead) => lead.id === task.related_lead_id)));
  const todayCalls = activeLeads.filter((lead) => visibleLeadStatus(lead.status) === "Дзвінок" && lead.follow_up_date === today);
  const todayCallTasks = tasks.filter((task) => task.type === "call" && task.due_date === today && !["Done", "Cancelled"].includes(task.status) && !isLeadClosed(leads.find((lead) => lead.id === task.related_lead_id)));
  const noResponseToClose = activeLeads.filter((lead) => visibleLeadStatus(lead.status) === "Без відповіді" && lead.follow_up_date && lead.follow_up_date <= today);
  const pipeline = activeLeads.reduce((sum, lead) => sum + (Number(lead.deal_value) || 0), 0);

  const lines = [
    "<b>Hugo Media Sales OS — статус зараз</b>",
    `Дата: ${today}`,
    "",
    `🔥 Топ-дій: ${hot.length}`,
    `⏰ Прострочено: ${overdue.length}`,
    `✉️ Follow-up: ${due.length}`,
    `🔒 Без відповіді 7+ днів: ${noResponseToClose.length}`,
    `📞 Дзвінки сьогодні: ${todayCalls.length + todayCallTasks.length}`,
    `✅ Відкритих задач: ${openTasks.length}`,
    `💶 Pipeline: ${money(pipeline)}`,
    "",
    "<b>Що робити першим</b>",
    ...(hot.length
      ? hot.map((lead, index) => `${index + 1}. ${escapeHtml(lead.business_name)} · ${leadScore(lead, today)}/100\n   ${escapeHtml(leadAction(lead, today))}`)
      : ["Немає активних лідів"])
  ];

  if (noResponseToClose.length) {
    lines.push(
      "",
      "<b>Кандидати на закриття</b>",
      ...noResponseToClose.slice(0, 6).map((lead) => `• ${escapeHtml(lead.business_name)} — не відповідає 7+ днів`)
    );
  }

  if (appUrl) {
    lines.push("", `<a href="${appUrl}">Відкрити CRM</a>`);
  }

  return lines.join("\n");
}

function controlKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "✅ План дня", callback_data: "ctrl:plan" },
        { text: "🎬 Теми дня", callback_data: "ctrl:topics" }
      ],
      [
        { text: "📞 Дзвінки", callback_data: "ctrl:calls" },
        { text: "🔥 Кому писати", callback_data: "ctrl:hot" }
      ],
      [
        { text: "🔎 Пошук лідів", callback_data: "ctrl:find" },
        { text: "📋 Кандидати", callback_data: "ctrl:candidates" }
      ]
    ]
  };
}

function buildDayPlan(leads: LeadRow[], tasks: TaskRow[], today: string, run?: DailyTopicRun) {
  const activeLeads = leads.filter((lead) => !isLeadClosed(lead));
  const urgentLeads = [...activeLeads]
    .filter((lead) => lead.follow_up_date && lead.follow_up_date <= today)
    .sort((a, b) => leadScore(b, today) - leadScore(a, today))
    .slice(0, 5);
  const hotLeads = [...activeLeads]
    .filter((lead) => ["Новий", "Контакт", "Без відповіді", "Дзвінок", "КП", "На паузі"].includes(visibleLeadStatus(lead.status)))
    .sort((a, b) => leadScore(b, today) - leadScore(a, today))
    .slice(0, 5);
  const calls = [
    ...activeLeads.filter((lead) => visibleLeadStatus(lead.status) === "Дзвінок" && lead.follow_up_date === today).map((lead) => lead.business_name),
    ...tasks
      .filter((task) => task.type === "call" && task.due_date === today && !["Done", "Cancelled"].includes(task.status) && !isLeadClosed(leads.find((lead) => lead.id === task.related_lead_id)))
      .map((task) => task.title)
  ].slice(0, 5);
  const topTopics = topTopicItems(run).slice(0, 3);

  const lines = [
    "<b>План дня Hugo Media</b>",
    `Дата: ${today}`,
    "",
    "<b>1. Продажі: зробити першим</b>",
    ...(urgentLeads.length
      ? urgentLeads.map((lead, index) => `${index + 1}. ${escapeHtml(lead.business_name)} · ${leadScore(lead, today)}/100\n   ${escapeHtml(leadAction(lead, today))}`)
      : ["Немає термінових follow-up."]),
    "",
    "<b>2. Кому писати, щоб рухати гроші</b>",
    ...(hotLeads.length
      ? hotLeads.slice(0, 3).map((lead, index) => `${index + 1}. ${escapeHtml(lead.business_name)} · ${money(lead.deal_value)} · ${escapeHtml(visibleLeadStatus(lead.status))}`)
      : ["Немає активних лідів для дотиску."]),
    "",
    "<b>3. Дзвінки</b>",
    ...(calls.length ? calls.map((call) => `• ${escapeHtml(call)}`) : ["На сьогодні дзвінків немає."]),
    "",
    "<b>4. Контент, який може дати охоплення</b>",
    ...(topTopics.length
      ? topTopics.map((item) => `${item.index}. ${escapeHtml(item.topic.title)} · power ${topicPowerScore(item.topic)}\n   ${escapeHtml(compact(item.topic.hook || item.topic.hooks?.[0]))}`)
      : ["Немає тем дня. Згенеруй їх у CRM або дочекайся 9:00."])
  ];

  if (appUrl) {
    lines.push("", `<a href="${appUrl}">Відкрити CRM</a>`);
  }

  return lines.join("\n");
}

function buildFollowups(leads: LeadRow[], today: string) {
  const activeLeads = leads.filter((lead) => !isLeadClosed(lead));
  const overdue = activeLeads.filter((lead) => lead.follow_up_date && lead.follow_up_date < today);
  const dueToday = activeLeads.filter((lead) => lead.follow_up_date === today);
  return [
    "<b>Follow-up</b>",
    "",
    "<b>Прострочені</b>",
    ...(overdue.length ? overdue.slice(0, 8).map((lead) => `• ${escapeHtml(lead.business_name)} · ${lead.follow_up_date}\n  ${escapeHtml(leadAction(lead, today))}`) : ["Немає"]),
    "",
    "<b>Сьогодні</b>",
    ...(dueToday.length ? dueToday.slice(0, 8).map((lead) => `• ${escapeHtml(lead.business_name)}\n  ${escapeHtml(leadAction(lead, today))}`) : ["Немає"])
  ].join("\n");
}

function buildKpi(leads: LeadRow[], today: string) {
  const monthKey = today.slice(0, 7);
  const activeLeads = leads.filter((lead) => !isLeadClosed(lead));
  const addedToday = leads.filter((lead) => lead.created_at?.startsWith(today)).length;
  const contactedToday = leads.filter((lead) => lead.updated_at?.startsWith(today) && ["Контакт", "Без відповіді", "Дзвінок", "КП", "На паузі"].includes(visibleLeadStatus(lead.status))).length;
  const followupsToday = activeLeads.filter((lead) => lead.follow_up_date === today).length;
  const openPipeline = activeLeads.reduce((sum, lead) => sum + (Number(lead.deal_value) || 0), 0);
  const wonThisMonth = leads.filter((lead) => lead.status === "Виграно" && lead.updated_at?.startsWith(monthKey)).reduce((sum, lead) => sum + (Number(lead.deal_value) || 0), 0);
  return [
    "<b>KPI зараз</b>",
    "",
    `➕ Додано лідів сьогодні: ${addedToday}`,
    `💬 Контактів сьогодні: ${contactedToday}`,
    `✉️ Follow-up сьогодні: ${followupsToday}`,
    `💶 Open pipeline: ${money(openPipeline)}`,
    `🏁 Won revenue this month: ${money(wonThisMonth)}`
  ].join("\n");
}

function buildCalls(leads: LeadRow[], tasks: TaskRow[], today: string) {
  const leadCalls = leads
    .filter((lead) => !["Виграно", "Закриті"].includes(visibleLeadStatus(lead.status)) && visibleLeadStatus(lead.status) === "Дзвінок")
    .sort((a, b) => (a.follow_up_date || "").localeCompare(b.follow_up_date || ""));
  const callTasks = tasks
    .filter((task) => task.type === "call" && !["Done", "Cancelled"].includes(task.status) && !isLeadClosed(leads.find((lead) => lead.id === task.related_lead_id)))
    .sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""));

  const lines = [
    "<b>Дзвінки</b>",
    "",
    ...(leadCalls.length
      ? leadCalls.slice(0, 8).map((lead) => `• ${escapeHtml(lead.business_name)} · ${lead.follow_up_date || "без дати"}\n  ${escapeHtml(leadAction(lead, today))}`)
      : ["Немає лідів зі статусом дзвінка"]),
    "",
    "<b>Задачі-дзвінки</b>",
    ...(callTasks.length
      ? callTasks.slice(0, 8).map((task) => `• ${escapeHtml(task.title)} · ${task.due_date || "без дати"}`)
      : ["Немає активних задач-дзвінків"])
  ];

  if (appUrl) {
    lines.push("", `<a href="${appUrl}/calendar">Відкрити календар</a>`);
  }

  return lines.join("\n");
}

function buildLeadList(title: string, leads: LeadRow[], today: string) {
  const lines = [
    `<b>${escapeHtml(title)}</b>`,
    "",
    ...(leads.length
      ? leads.slice(0, 8).map((lead, index) => `${index + 1}. ${escapeHtml(lead.business_name)} · ${leadScore(lead, today)}/100 · ${money(lead.deal_value)}\n   ${escapeHtml(leadAction(lead, today))}`)
      : ["Немає лідів у цьому списку"])
  ];

  if (appUrl) {
    lines.push("", `<a href="${appUrl}">Відкрити CRM</a>`);
  }

  return lines.join("\n");
}

function buildPipeline(leads: LeadRow[], today: string) {
  const activeLeads = leads.filter((lead) => !["Виграно", "Закриті"].includes(visibleLeadStatus(lead.status)));
  const topDeals = [...activeLeads].sort((a, b) => (Number(b.deal_value) || 0) - (Number(a.deal_value) || 0)).slice(0, 8);
  const total = activeLeads.reduce((sum, lead) => sum + (Number(lead.deal_value) || 0), 0);
  const lines = [
    "<b>Pipeline зараз</b>",
    `Всього: ${money(total)}`,
    "",
    ...(topDeals.length
      ? topDeals.map((lead, index) => `${index + 1}. ${escapeHtml(lead.business_name)} · ${money(lead.deal_value)} · ${leadScore(lead, today)}/100\n   ${escapeHtml(leadAction(lead, today))}`)
      : ["Немає активного pipeline"])
  ];

  if (appUrl) {
    lines.push("", `<a href="${appUrl}">Відкрити CRM</a>`);
  }

  return lines.join("\n");
}

export async function POST(request: Request) {
  try {
    const update = (await request.json()) as TelegramUpdate;
    const callback = update.callback_query;
    if (callback?.data && callback.message?.chat?.id) {
      const [action, id, extra] = callback.data.split(":");
      if (action === "find_niche") {
        const niche = leadFinderNiches.find((item) => item.key === id);
        if (!niche) {
          await answerCallback(callback.id, "Ніша не знайдена");
          return Response.json({ ok: true });
        }
        await answerCallback(callback.id, niche.label);
        await sendTelegram(callback.message.chat.id, `Обери країну для ніші: <b>${escapeHtml(niche.label)}</b>`, leadFinderCountryKeyboard(niche.key));
        return Response.json({ ok: true });
      }
      if (action === "find_country") {
        const niche = leadFinderNiches.find((item) => item.key === id);
        const country = leadFinderCountries.find((item) => item.key === extra);
        if (!niche || !country) {
          await answerCallback(callback.id, "Не знайшла вибір");
          return Response.json({ ok: true });
        }
        await answerCallback(callback.id, `${niche.label} · ${country.label}`);
        try {
          await runLeadFinder(callback.message.chat.id, niche.query, country.key, 10);
        } catch (error) {
          await sendTelegram(callback.message.chat.id, `Якісний пошук не запустився: ${escapeHtml(error instanceof Error ? error.message : "невідома помилка")}`);
        }
        return Response.json({ ok: true });
      }
      if (action === "ctrl") {
        await answerCallback(callback.id, "Відкриваю");
        if (id === "find") {
          await sendTelegram(callback.message.chat.id, "Обери нішу для пошуку лідів:", leadFinderNicheKeyboard());
          return Response.json({ ok: true });
        }
        if (id === "candidates") {
          const candidates = await listCandidates(10);
          await sendCandidateCards(callback.message.chat.id, candidates);
          return Response.json({ ok: true });
        }

        const today = dateKey();
        const [leads, tasks, topicRuns] = await Promise.all([
          getLeadsForBot(),
          supabaseGet<TaskRow[]>("tasks", "select=id,title,type,related_lead_id,due_date,status&order=due_date.asc"),
          readTopicRuns()
        ]);
        const run = latestTopicRun(topicRuns);
        const activeLeads = leads.filter((lead) => !isLeadClosed(lead));

        if (id === "topics") {
          const items = topTopicItems(run);
          await sendTelegram(callback.message.chat.id, buildTopicsMessage(run), items.length ? topicKeyboard(items) : undefined);
          return Response.json({ ok: true });
        }
        if (id === "calls") {
          await sendTelegram(callback.message.chat.id, buildCalls(leads, tasks, today));
          return Response.json({ ok: true });
        }
        if (id === "hot") {
          const outreach = activeLeads
            .filter((lead) => lead.priority === "Hot" || lead.priority === "High" || ["Новий", "Контакт", "Без відповіді", "КП", "На паузі"].includes(visibleLeadStatus(lead.status)))
            .sort((a, b) => leadScore(b, today) - leadScore(a, today));
          await sendTelegram(callback.message.chat.id, buildLeadList("Кому писати зараз", outreach, today));
          return Response.json({ ok: true });
        }
        await sendTelegram(callback.message.chat.id, buildDayPlan(leads, tasks, today, run), controlKeyboard());
        return Response.json({ ok: true });
      }
      if (action === "topic") {
        const status = topicStatusByCode[extra || ""];
        const index = Number(id);
        if (!status || !Number.isFinite(index)) {
          await answerCallback(callback.id, "Не зрозуміла статус теми");
          return Response.json({ ok: true });
        }
        const topic = await updateLatestTopicStatus(index, status);
        await answerCallback(callback.id, topic ? status : "Тему не знайдено");
        await sendTelegram(
          callback.message.chat.id,
          topic ? `✅ Тема ${index}: <b>${escapeHtml(topic.title)}</b>\nСтатус: <b>${escapeHtml(status)}</b>` : "Не знайшла цю тему в останньому списку."
        );
        return Response.json({ ok: true });
      }
      if (action === "candidate_add" || action === "candidate_hot") {
        const candidate = await addCandidateToCrm(id, action === "candidate_hot" ? "Hot" : "Medium");
        await answerCallback(callback.id, action === "candidate_hot" ? "Додано як Hot" : "Додано в CRM");
        await sendTelegram(callback.message.chat.id, `✅ Додано в CRM: <b>${escapeHtml(candidate.business_name)}</b>`);
        return Response.json({ ok: true });
      }
      if (action === "candidate_reject" || action === "candidate_later") {
        const status = action === "candidate_reject" ? "Rejected" : "Later";
        await updateCandidateStatus(id, status);
        await answerCallback(callback.id, action === "candidate_reject" ? "Відхилено" : "Відкладено");
        await sendTelegram(callback.message.chat.id, action === "candidate_reject" ? "🗑 Кандидата відхилено" : "🕓 Кандидата відкладено");
        return Response.json({ ok: true });
      }
      await answerCallback(callback.id, "Невідома дія");
      return Response.json({ ok: true });
    }

    const chatId = update.message?.chat?.id;
    const text = update.message?.text?.trim() || "";

    if (!chatId) {
      return Response.json({ ok: true, ignored: true });
    }

    if (text === "Відкрити CRM") {
      await sendTelegram(chatId, appUrl ? `<a href="${appUrl}">Відкрити CRM</a>` : "CRM URL ще не налаштований");
      return Response.json({ ok: true });
    }

    const lowerText = text.toLowerCase();
    if (lowerText === "/find" || lowerText === "/find30" || text === "🔎 /find30" || text === "🔎 Пошук лідів") {
      await sendTelegram(chatId, "Обери нішу для пошуку лідів:", leadFinderNicheKeyboard());
      return Response.json({ ok: true });
    }

    if (lowerText.startsWith("/find ")) {
      const parts = text.split(/\s+/).slice(1);
      const maybeLocation = parts.length > 1 ? parts[parts.length - 1] : undefined;
      const maybeNiche = parts.length > 1 ? parts.slice(0, -1).join(" ") : parts[0];
      try {
        await runLeadFinder(chatId, maybeNiche, maybeLocation, 10);
      } catch (error) {
        await sendTelegram(chatId, `Якісний пошук не запустився: ${escapeHtml(error instanceof Error ? error.message : "невідома помилка")}`);
        return Response.json({ ok: true });
      }
      return Response.json({ ok: true });
    }

    if (lowerText === "/candidates" || text === "📋 /candidates") {
      const candidates = await listCandidates(10);
      await sendCandidateCards(chatId, candidates);
      return Response.json({ ok: true });
    }

    if (lowerText.startsWith("/metrics ")) {
      const [, indexValue, viewsValue, commentsValue, savesValue] = text.split(/\s+/);
      const index = Number(indexValue);
      const views = Number(viewsValue);
      const comments = Number(commentsValue);
      const saves = Number(savesValue);
      if (![index, views, comments, saves].every(Number.isFinite)) {
        await sendTelegram(chatId, "Формат: <code>/metrics 1 12000 84 37</code>\n1 — номер теми, далі перегляди, коментарі, збереження.");
        return Response.json({ ok: true });
      }
      const topic = await updateLatestTopicMetrics(index, views, comments, saves);
      await sendTelegram(
        chatId,
        topic
          ? `✅ Метрики збережені: <b>${escapeHtml(topic.title)}</b>\nПерегляди: ${topic.views}\nКоментарі: ${topic.comments}\nЗбереження: ${topic.saves}`
          : "Не знайшла тему з таким номером в останньому списку."
      );
      return Response.json({ ok: true });
    }

    const knownActions = ["/start", "/status", "/today", "/topics", "/hot", "/followups", "/kpi", "✅ План дня", "🎬 Теми дня", "⚡ Що робити зараз", "📊 Статус зараз", "📞 Дзвінки", "🔥 Кому писати", "⏰ Прострочені", "💶 Pipeline"];
    if (!knownActions.includes(text)) {
      await sendTelegram(chatId, "Натисни <b>✅ План дня</b>, <b>🎬 Теми дня</b>, <b>🔎 Пошук лідів</b>, <b>📞 Дзвінки</b> або <b>🔥 Кому писати</b>.");
      return Response.json({ ok: true });
    }

    const today = dateKey();
    const [leads, tasks, topicRuns] = await Promise.all([
      getLeadsForBot(),
      supabaseGet<TaskRow[]>("tasks", "select=id,title,type,related_lead_id,due_date,status&order=due_date.asc"),
      readTopicRuns()
    ]);
    const run = latestTopicRun(topicRuns);

    const activeLeads = leads.filter((lead) => !["Виграно", "Закриті"].includes(visibleLeadStatus(lead.status)));
    if (text === "🎬 Теми дня" || text === "/topics") {
      const items = topTopicItems(run);
      await sendTelegram(chatId, buildTopicsMessage(run), items.length ? topicKeyboard(items) : undefined);
      return Response.json({ ok: true });
    }

    if (text === "✅ План дня" || text === "⚡ Що робити зараз" || text === "/today" || text === "/start") {
      await sendTelegram(chatId, buildDayPlan(leads, tasks, today, run), controlKeyboard());
      return Response.json({ ok: true });
    }

    if (text === "/hot" || text === "🔥 Кому писати") {
      const outreach = activeLeads
        .filter((lead) => lead.priority === "Hot" || lead.priority === "High" || ["Новий", "Контакт", "Без відповіді", "КП", "На паузі"].includes(visibleLeadStatus(lead.status)))
        .sort((a, b) => leadScore(b, today) - leadScore(a, today));
      await sendTelegram(chatId, buildLeadList("Кому писати зараз", outreach, today));
      return Response.json({ ok: true });
    }

    if (text === "📞 Дзвінки") {
      await sendTelegram(chatId, buildCalls(leads, tasks, today));
      return Response.json({ ok: true });
    }

    if (text === "⏰ Прострочені") {
      const overdue = activeLeads
        .filter((lead) => lead.follow_up_date && lead.follow_up_date < today)
        .sort((a, b) => (a.follow_up_date || "").localeCompare(b.follow_up_date || ""));
      await sendTelegram(chatId, buildLeadList("Прострочені follow-up", overdue, today));
      return Response.json({ ok: true });
    }

    if (text === "💶 Pipeline") {
      await sendTelegram(chatId, buildPipeline(leads, today));
      return Response.json({ ok: true });
    }

    if (text === "/followups") {
      await sendTelegram(chatId, buildFollowups(leads, today));
      return Response.json({ ok: true });
    }

    if (text === "/kpi") {
      await sendTelegram(chatId, buildKpi(leads, today));
      return Response.json({ ok: true });
    }

    await sendTelegram(chatId, buildStatus(leads, tasks, today), controlKeyboard());
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook failed", error);
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({ ok: true, endpoint: "telegram-webhook" });
}
