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
  niche: string;
  city: string | null;
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
  type: string;
  due_date: string | null;
  status: string;
  priority: string;
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

async function sendTelegram(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    throw new Error("Missing Telegram env vars");
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

function buildMorningDigest(leads: LeadRow[], tasks: TaskRow[], today: string) {
  const activeLeads = leads.filter((lead) => !["Виграно", "Програно"].includes(lead.status));
  const due = activeLeads
    .filter((lead) => lead.follow_up_date && lead.follow_up_date <= today)
    .sort((a, b) => (a.follow_up_date || "").localeCompare(b.follow_up_date || ""));
  const overdue = due.filter((lead) => lead.follow_up_date && lead.follow_up_date < today);
  const hot = [...activeLeads].sort((a, b) => leadScore(b, today) - leadScore(a, today)).slice(0, 5);
  const todayTasks = tasks.filter((task) => task.due_date && task.due_date <= today && task.status !== "Done");
  const todayCalls = activeLeads.filter((lead) => (lead.status === "Дзвінок" || lead.status === "Дзвінок заплановано") && lead.follow_up_date === today);
  const todayCallTasks = tasks.filter((task) => task.type === "call" && task.due_date === today && task.status !== "Done");
  const pipeline = activeLeads.reduce((sum, lead) => sum + (Number(lead.deal_value) || 0), 0);

  const lines = [
    "<b>Hugo Media Sales OS — ранок</b>",
    `Дата: ${today}`,
    "",
    `🔥 Гарячих дій: ${hot.length}`,
    `⏰ Прострочено: ${overdue.length}`,
    `✉️ Follow-up сьогодні: ${due.length}`,
    `📞 Дзвінки: ${todayCalls.length + todayCallTasks.length}`,
    `✅ Задач: ${todayTasks.length}`,
    `💶 Pipeline: ${money(pipeline)}`,
    "",
    "<b>Фокус на сьогодні</b>",
    ...hot.map((lead, index) => `${index + 1}. ${escapeHtml(lead.business_name)} · ${leadScore(lead, today)}/100\n   ${escapeHtml(leadAction(lead, today))}`)
  ];

  if (todayCalls.length || todayCallTasks.length) {
    lines.push(
      "",
      "<b>Дзвінки сьогодні</b>",
      ...todayCalls.map((lead) => `• ${escapeHtml(lead.business_name)} — ${escapeHtml(leadAction(lead, today))}`),
      ...todayCallTasks.map((task) => `• ${escapeHtml(task.title)}`)
    );
  }

  if (appUrl) {
    lines.push("", `<a href="${appUrl}">Відкрити CRM</a>`);
  }

  return lines.join("\n");
}

function buildEveningDigest(leads: LeadRow[], tasks: TaskRow[], today: string) {
  const updatedToday = leads.filter((lead) => lead.updated_at?.startsWith(today));
  const newToday = leads.filter((lead) => lead.created_at?.startsWith(today));
  const replies = leads.filter((lead) => ["Відповів", "КП відправлено", "Думає", "Виграно"].includes(lead.status));
  const overdueTomorrow = leads.filter((lead) => lead.follow_up_date && lead.follow_up_date <= today && lead.status !== "Виграно");
  const doneTasks = tasks.filter((task) => task.status === "Done" && task.due_date === today);

  const lines = [
    "<b>Hugo Media Sales OS — вечір</b>",
    `Дата: ${today}`,
    "",
    `➕ Нових лідів: ${newToday.length}`,
    `🔄 Оновлено лідів: ${updatedToday.length}`,
    `💬 Лідів з відповіддю/КП: ${replies.length}`,
    `✅ Закрито задач: ${doneTasks.length}`,
    `➡️ Залишається на завтра: ${overdueTomorrow.length}`,
    "",
    "<b>Що не забути</b>",
    ...(overdueTomorrow.length
      ? overdueTomorrow.slice(0, 5).map((lead) => `• ${escapeHtml(lead.business_name)}: ${escapeHtml(leadAction(lead, today))}`)
      : ["Все чисто"])
  ];

  if (appUrl) {
    lines.push("", `<a href="${appUrl}">Відкрити CRM</a>`);
  }

  return lines.join("\n");
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const type = url.searchParams.get("type") === "evening" ? "evening" : "morning";
    const today = dateKey();
    const [leads, tasks] = await Promise.all([
      supabaseGet<LeadRow[]>("leads", "select=id,business_name,niche,city,status,deal_value,follow_up_date,next_action,updated_at,created_at&order=follow_up_date.asc"),
      supabaseGet<TaskRow[]>("tasks", "select=id,title,type,due_date,status,priority&order=due_date.asc")
    ]);

    const message = type === "evening" ? buildEveningDigest(leads, tasks, today) : buildMorningDigest(leads, tasks, today);
    await sendTelegram(message);

    return Response.json({ ok: true, type, date: today });
  } catch (error) {
    console.error("Telegram daily digest failed", error);
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
