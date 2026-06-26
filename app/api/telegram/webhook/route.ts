type LeadStatus =
  | "Новий"
  | "Проаналізований"
  | "Написав"
  | "Відповів"
  | "КП відправлено"
  | "Дзвінок"
  | "Дзвінок заплановано"
  | "Думає"
  | "Виграно"
  | "Програно"
  | "Повернутись пізніше";

type LeadRow = {
  id: string;
  business_name: string;
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
  due_date: string | null;
  status: string;
};

type TelegramUpdate = {
  message?: {
    chat?: { id?: number | string };
    text?: string;
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

function dateKey(timeZone = process.env.TELEGRAM_TIME_ZONE || "Europe/Kyiv") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function money(value: number | null | undefined) {
  return `${new Intl.NumberFormat("uk-UA").format(Math.max(0, Number(value) || 0))} €`;
}

function leadScore(lead: LeadRow, today: string) {
  let score = 20;
  const value = Number(lead.deal_value) || 0;
  if (value >= 2000) score += 24;
  else if (value >= 1000) score += 18;
  else if (value >= 300) score += 10;
  if (["Відповів", "КП відправлено", "Дзвінок", "Дзвінок заплановано", "Думає"].includes(lead.status)) score += 24;
  if (lead.follow_up_date && lead.follow_up_date < today) score += 18;
  if (lead.follow_up_date === today) score += 14;
  if (lead.status === "Програно") score -= 30;
  if (lead.status === "Виграно") score -= 20;
  return Math.max(0, Math.min(100, score));
}

function leadAction(lead: LeadRow, today: string) {
  if (lead.next_action?.trim()) return lead.next_action.trim();
  if (lead.status === "Новий" || lead.status === "Проаналізований") return "Написати перше повідомлення";
  if (lead.status === "Написав") return lead.follow_up_date && lead.follow_up_date <= today ? "Зробити follow-up" : "Дочекатися follow-up";
  if (lead.status === "Відповів") return "Скинути деталі пакета";
  if (lead.status === "КП відправлено") return "Follow-up після КП";
  if (lead.status === "Дзвінок" || lead.status === "Дзвінок заплановано") return "Підготуватися до дзвінка";
  if (lead.status === "Думає") return "Уточнити сумнів і дедлайн";
  return "Відкрити CRM і визначити наступний крок";
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

async function sendTelegram(chatId: number | string, text: string) {
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
      reply_markup: {
        keyboard: [
          [{ text: "⚡ Що робити зараз" }, { text: "📊 Статус зараз" }],
          [{ text: "📞 Дзвінки" }, { text: "🔥 Кому писати" }],
          [{ text: "⏰ Прострочені" }, { text: "💶 Pipeline" }],
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

function buildStatus(leads: LeadRow[], tasks: TaskRow[], today: string) {
  const activeLeads = leads.filter((lead) => !["Виграно", "Програно"].includes(lead.status));
  const due = activeLeads.filter((lead) => lead.follow_up_date && lead.follow_up_date <= today);
  const overdue = due.filter((lead) => lead.follow_up_date && lead.follow_up_date < today);
  const hot = [...activeLeads].sort((a, b) => leadScore(b, today) - leadScore(a, today)).slice(0, 5);
  const openTasks = tasks.filter((task) => task.status !== "Done");
  const todayCalls = activeLeads.filter((lead) => (lead.status === "Дзвінок" || lead.status === "Дзвінок заплановано") && lead.follow_up_date === today);
  const todayCallTasks = tasks.filter((task) => task.type === "call" && task.due_date === today && task.status !== "Done");
  const pipeline = activeLeads.reduce((sum, lead) => sum + (Number(lead.deal_value) || 0), 0);

  const lines = [
    "<b>Hugo Media Sales OS — статус зараз</b>",
    `Дата: ${today}`,
    "",
    `🔥 Топ-дій: ${hot.length}`,
    `⏰ Прострочено: ${overdue.length}`,
    `✉️ Follow-up: ${due.length}`,
    `📞 Дзвінки сьогодні: ${todayCalls.length + todayCallTasks.length}`,
    `✅ Відкритих задач: ${openTasks.length}`,
    `💶 Pipeline: ${money(pipeline)}`,
    "",
    "<b>Що робити першим</b>",
    ...(hot.length
      ? hot.map((lead, index) => `${index + 1}. ${escapeHtml(lead.business_name)} · ${leadScore(lead, today)}/100\n   ${escapeHtml(leadAction(lead, today))}`)
      : ["Немає активних лідів"])
  ];

  if (appUrl) {
    lines.push("", `<a href="${appUrl}">Відкрити CRM</a>`);
  }

  return lines.join("\n");
}

function buildCalls(leads: LeadRow[], tasks: TaskRow[], today: string) {
  const leadCalls = leads
    .filter((lead) => !["Виграно", "Програно"].includes(lead.status) && (lead.status === "Дзвінок" || lead.status === "Дзвінок заплановано"))
    .sort((a, b) => (a.follow_up_date || "").localeCompare(b.follow_up_date || ""));
  const callTasks = tasks
    .filter((task) => task.type === "call" && task.status !== "Done")
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
  const activeLeads = leads.filter((lead) => !["Виграно", "Програно"].includes(lead.status));
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
    const chatId = update.message?.chat?.id;
    const text = update.message?.text?.trim() || "";

    if (!chatId) {
      return Response.json({ ok: true, ignored: true });
    }

    if (text === "Відкрити CRM") {
      await sendTelegram(chatId, appUrl ? `<a href="${appUrl}">Відкрити CRM</a>` : "CRM URL ще не налаштований");
      return Response.json({ ok: true });
    }

    const knownActions = ["/start", "/status", "⚡ Що робити зараз", "📊 Статус зараз", "📞 Дзвінки", "🔥 Кому писати", "⏰ Прострочені", "💶 Pipeline"];
    if (!knownActions.includes(text)) {
      await sendTelegram(chatId, "Натисни <b>⚡ Що робити зараз</b>, <b>📞 Дзвінки</b>, <b>🔥 Кому писати</b> або напиши /status.");
      return Response.json({ ok: true });
    }

    const today = dateKey();
    const [leads, tasks] = await Promise.all([
      supabaseGet<LeadRow[]>("leads", "select=id,business_name,status,deal_value,follow_up_date,next_action,updated_at,created_at&order=follow_up_date.asc"),
      supabaseGet<TaskRow[]>("tasks", "select=id,title,type,due_date,status&order=due_date.asc")
    ]);

    const activeLeads = leads.filter((lead) => !["Виграно", "Програно"].includes(lead.status));
    if (text === "🔥 Кому писати") {
      const outreach = activeLeads
        .filter((lead) => ["Новий", "Проаналізований", "Відповів", "КП відправлено", "Думає"].includes(lead.status))
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
