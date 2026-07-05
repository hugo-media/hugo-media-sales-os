import {
  addCandidateToCrm,
  dateKey,
  findLeadCandidates,
  LeadCandidate,
  listCandidates,
  updateCandidateStatus
} from "@/lib/lead-finder";

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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function money(value: number | null | undefined) {
  return `${new Intl.NumberFormat("uk-UA").format(Math.max(0, Number(value) || 0))} €`;
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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
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
          [{ text: "⚡ Що робити зараз" }, { text: "🔎 /find30" }],
          [{ text: "📞 Дзвінки" }, { text: "🔥 Кому писати" }],
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
    "Джерело: OpenStreetMap",
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
    await sendTelegram(chatId, "Кандидатів немає. Натисни /find30, щоб знайти нових.");
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
      const [action, id] = callback.data.split(":");
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
    if (lowerText === "/find30" || text === "🔎 /find30" || lowerText.startsWith("/find ")) {
      await sendTelegram(chatId, "Шукаю безкоштовних кандидатів через OpenStreetMap. Це може зайняти до хвилини.");
      const parts = text.split(/\s+/).slice(1);
      const maybeCity = parts[1];
      const maybeNiche = parts[0];
      let candidates: LeadCandidate[] = [];
      try {
        candidates = await findLeadCandidates({
          limit: lowerText === "/find30" || text === "🔎 /find30" ? 30 : 10,
          nicheQuery: maybeNiche,
          city: maybeCity
        });
      } catch (error) {
        await sendTelegram(chatId, `Overpass зараз не відповідає або Supabase не готовий: ${escapeHtml(error instanceof Error ? error.message : "невідома помилка")}`);
        return Response.json({ ok: true });
      }
      await sendTelegram(chatId, `Знайшов ${candidates.length} кандидатів без дублів.`);
      await sendCandidateCards(chatId, candidates);
      return Response.json({ ok: true });
    }

    if (lowerText === "/candidates" || text === "📋 /candidates") {
      const candidates = await listCandidates(10);
      await sendCandidateCards(chatId, candidates);
      return Response.json({ ok: true });
    }

    const knownActions = ["/start", "/status", "/today", "/hot", "/followups", "/kpi", "⚡ Що робити зараз", "📊 Статус зараз", "📞 Дзвінки", "🔥 Кому писати", "⏰ Прострочені", "💶 Pipeline"];
    if (!knownActions.includes(text)) {
      await sendTelegram(chatId, "Натисни <b>/find30</b>, <b>/candidates</b>, <b>⚡ Що робити зараз</b>, <b>📞 Дзвінки</b>, <b>🔥 Кому писати</b> або напиши /status.");
      return Response.json({ ok: true });
    }

    const today = dateKey();
    const [leads, tasks] = await Promise.all([
      supabaseGet<LeadRow[]>("leads", "select=id,business_name,priority,status,deal_value,follow_up_date,next_action,updated_at,created_at&order=follow_up_date.asc"),
      supabaseGet<TaskRow[]>("tasks", "select=id,title,type,related_lead_id,due_date,status&order=due_date.asc")
    ]);

    const activeLeads = leads.filter((lead) => !["Виграно", "Закриті"].includes(visibleLeadStatus(lead.status)));
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

    await sendTelegram(chatId, buildStatus(leads, tasks, today));
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
