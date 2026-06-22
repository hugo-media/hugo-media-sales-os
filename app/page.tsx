"use client";

import {
  BarChart3,
  CalendarDays,
  Check,
  ClipboardList,
  Copy,
  Edit3,
  Euro,
  FileText,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Trash2,
  Users,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type LeadStatus =
  | "Новий"
  | "Проаналізований"
  | "Написав"
  | "Відповів"
  | "КП відправлено"
  | "Дзвінок заплановано"
  | "Думає"
  | "Виграно"
  | "Програно"
  | "Повернутись пізніше";

type Lead = {
  id: string;
  business_name: string;
  niche: string;
  city: string;
  contact_name: string;
  instagram_url: string;
  facebook_url: string;
  website_url: string;
  phone: string;
  email: string;
  contact_channel: string;
  weak_point: string;
  offer_angle: string;
  status: LeadStatus;
  package_interest: string;
  deal_value: number;
  first_contact_date: string;
  last_contact_date: string;
  follow_up_date: string;
  next_action: string;
  source: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

type Task = {
  id: string;
  title: string;
  description: string;
  type: "outreach" | "follow_up" | "call" | "proposal" | "content" | "shoot" | "admin";
  related_lead_id?: string;
  due_date: string;
  status: "To do" | "In progress" | "Done" | "Cancelled";
  priority: "Low" | "Medium" | "High";
  created_at: string;
  updated_at: string;
};

type ContentItem = {
  id: string;
  date: string;
  topic: string;
  hook: string;
  key_points: string;
  CTA: string;
  target_niche: string;
  status: "Ідея" | "Заплановано" | "Записано" | "Змонтовано" | "Опубліковано" | "Архів";
  platform: "TikTok" | "Instagram" | "Facebook" | "YouTube Shorts" | "Telegram";
  notes: string;
};

type Template = {
  id: string;
  title: string;
  category: string;
  body: string;
};

type HistoryItem = {
  id: string;
  lead_id: string;
  status: LeadStatus;
  note: string;
  created_at: string;
};

type PackageItem = {
  id: string;
  name: string;
  value: number;
  description: string;
  color: string;
  archived: boolean;
};

type DailyTarget = {
  id: string;
  title: string;
  target: number;
  done: boolean;
  custom: boolean;
};

type KpiTargets = {
  weekly_new_leads: number;
  weekly_messages: number;
  weekly_followups: number;
  weekly_calls: number;
  weekly_proposals: number;
  weekly_closed_deals: number;
  monthly_revenue: number;
  goal_30_day: string;
  goal_60_day: string;
  goal_90_day: string;
};

type BusinessProfile = {
  platform_name: string;
  owner_name: string;
  positioning_line: string;
  audience_description: string;
  website_url: string;
  currency: string;
  default_city: string;
  default_language: string;
};

type SalesSettings = {
  default_daily_lead_target: number;
  default_daily_message_target: number;
  follow_up_delay_contacted: number;
  follow_up_delay_proposal_sent: number;
  follow_up_delay_thinking: number;
  return_delay_lost: number;
};

type AppSettings = {
  business: BusinessProfile;
  sales: SalesSettings;
  packages: PackageItem[];
  dailyTargets: DailyTarget[];
  kpiTargets: KpiTargets;
};

type CrmSnapshot = {
  leads: Lead[];
  tasks: Task[];
  contentItems: ContentItem[];
  templates: Template[];
  history: HistoryItem[];
  settings: AppSettings;
};

type LeadRow = Omit<Lead, "first_contact_date" | "last_contact_date" | "follow_up_date"> & {
  first_contact_date: string | null;
  last_contact_date: string | null;
  follow_up_date: string | null;
};
type ContentRow = Omit<ContentItem, "CTA"> & { cta: string };
type SettingRow = { key: string; value: AppSettings };

const statuses: LeadStatus[] = [
  "Новий",
  "Проаналізований",
  "Написав",
  "Відповів",
  "КП відправлено",
  "Дзвінок заплановано",
  "Думає",
  "Виграно",
  "Програно",
  "Повернутись пізніше"
];

const niches = [
  "Легалізація",
  "Юристи",
  "Бухгалтерія",
  "Авто",
  "Страхування",
  "Медицина",
  "Beauty",
  "Освіта",
  "Робота",
  "Нерухомість",
  "Фінанси"
];

const templateCategories = [
  "first outreach",
  "follow-up",
  "send details",
  "price objection",
  "proposal",
  "post",
  "comment",
  "call script"
];

const defaultSettings: AppSettings = {
  business: {
    platform_name: "Hugo Media Sales OS",
    owner_name: "Сергій Гальчук / Hugo",
    positioning_line: "Показую не просто бізнес. Показую людину за бізнесом.",
    audience_description: "Українські підприємці та локальні бізнеси у Польщі й Європі.",
    website_url: "",
    currency: "EUR",
    default_city: "Варшава",
    default_language: "uk"
  },
  sales: {
    default_daily_lead_target: 10,
    default_daily_message_target: 10,
    follow_up_delay_contacted: 2,
    follow_up_delay_proposal_sent: 1,
    follow_up_delay_thinking: 3,
    return_delay_lost: 30
  },
  packages: [
    {
      id: "package-media-visit",
      name: "Медійний візит Hugo",
      value: 300,
      description: "Одна зйомка і коротка медійна присутність для старту.",
      color: "#38bdf8",
      archived: false
    },
    {
      id: "package-monthly-series",
      name: "Місячна медіасерія",
      value: 1000,
      description: "Серія матеріалів на місяць для стабільної присутності.",
      color: "#a78bfa",
      archived: false
    },
    {
      id: "package-full-presence",
      name: "Повна медійна присутність",
      value: 2000,
      description: "Комплексна упаковка, контент і регулярна комунікація.",
      color: "#34d399",
      archived: false
    },
    {
      id: "package-partnership",
      name: "Тематичне партнерство",
      value: 0,
      description: "Індивідуальний формат під подію, рубрику або партнерство.",
      color: "#f59e0b",
      archived: false
    }
  ],
  dailyTargets: [
    { id: "daily-leads", title: "Додати нові ліди", target: 10, done: false, custom: false },
    { id: "daily-messages", title: "Відправити перші повідомлення", target: 10, done: false, custom: false },
    { id: "daily-followups", title: "Зробити follow-up", target: 5, done: false, custom: false },
    { id: "daily-content", title: "Підготувати контент-одиницю", target: 1, done: false, custom: false },
    { id: "daily-crm", title: "Оновити CRM / продажі", target: 1, done: false, custom: false }
  ],
  kpiTargets: {
    weekly_new_leads: 50,
    weekly_messages: 50,
    weekly_followups: 25,
    weekly_calls: 5,
    weekly_proposals: 5,
    weekly_closed_deals: 1,
    monthly_revenue: 5000,
    goal_30_day: "Стабілізувати щоденний outreach і перші КП.",
    goal_60_day: "Побудувати прогнозований pipeline.",
    goal_90_day: "Вийти на повторюваний місячний дохід."
  }
};

const appTimeZone = "Europe/Warsaw";
const seedToday = "2026-06-21";
const seedTomorrow = "2026-06-22";
const storageKey = "hugo-media-sales-os:v1";

const leadOneId = "11111111-1111-4111-8111-111111111111";
const leadTwoId = "22222222-2222-4222-8222-222222222222";
const leadThreeId = "33333333-3333-4333-8333-333333333333";

const newId = () => crypto.randomUUID();

const getWarsawDateKey = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: appTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
};

const formatUkrainianDate = (dateKey: string) =>
  new Intl.DateTimeFormat("uk-UA", {
    timeZone: appTimeZone,
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(`${dateKey}T12:00:00Z`));

const addDays = (date: string, days: number) => {
  const next = new Date(`${date}T12:00:00`);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
};

const money = (value: number) =>
  value === 0 ? "індивідуально" : new Intl.NumberFormat("uk-UA").format(value) + " €";

const moneyAmount = (value: number) => `${new Intl.NumberFormat("uk-UA").format(Math.max(0, value))} €`;

const numericValue = (value: unknown) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const seedLeads: Lead[] = [
  {
    id: leadOneId,
    business_name: "LegalWay Poland",
    niche: "Легалізація",
    city: "Варшава",
    contact_name: "Олена",
    instagram_url: "https://instagram.com/legalway",
    facebook_url: "",
    website_url: "https://legalway.example",
    phone: "+48 500 100 200",
    email: "hello@legalway.example",
    contact_channel: "Instagram",
    weak_point: "Багато експертності, але мало людського обличчя бренду.",
    offer_angle: "Показати засновницю як провідника у складних питаннях легалізації.",
    status: "КП відправлено",
    package_interest: "Місячна медіасерія",
    deal_value: 1000,
    first_contact_date: "2026-06-17",
    last_contact_date: "2026-06-20",
    follow_up_date: seedToday,
    next_action: "Follow-up після КП",
    source: "Instagram",
    notes: "Попросили коротко показати формати зйомки.",
    created_at: "2026-06-17",
    updated_at: "2026-06-20"
  },
  {
    id: leadTwoId,
    business_name: "Beauty Pro Krakow",
    niche: "Beauty",
    city: "Краків",
    contact_name: "Марина",
    instagram_url: "https://instagram.com/beautypro",
    facebook_url: "",
    website_url: "",
    phone: "+48 501 222 333",
    email: "",
    contact_channel: "Instagram",
    weak_point: "Пости виглядають як прайс, мало довіри до майстра.",
    offer_angle: "Міні-історія про шлях майстрині та клієнтський досвід.",
    status: "Відповів",
    package_interest: "Медійний візит Hugo",
    deal_value: 300,
    first_contact_date: "2026-06-19",
    last_contact_date: seedToday,
    follow_up_date: seedTomorrow,
    next_action: "Скинути деталі пакета",
    source: "Рекомендація",
    notes: "Теплий лід, цікавиться коротким форматом.",
    created_at: "2026-06-19",
    updated_at: seedToday
  },
  {
    id: leadThreeId,
    business_name: "AutoHelp Wroclaw",
    niche: "Авто",
    city: "Вроцлав",
    contact_name: "Андрій",
    instagram_url: "",
    facebook_url: "https://facebook.com/autohelp",
    website_url: "https://autohelp.example",
    phone: "+48 502 333 444",
    email: "contact@autohelp.example",
    contact_channel: "Facebook",
    weak_point: "Сервіс сильний, але комунікація без чіткої позиції.",
    offer_angle: "Показати чесний сервіс для українців у Польщі.",
    status: "Думає",
    package_interest: "Повна медійна присутність",
    deal_value: 2000,
    first_contact_date: "2026-06-15",
    last_contact_date: "2026-06-19",
    follow_up_date: "2026-06-24",
    next_action: "Уточнити бюджет і таймінг",
    source: "Facebook",
    notes: "Потрібно дотиснути через цінність довіри.",
    created_at: "2026-06-15",
    updated_at: "2026-06-19"
  }
];

const seedTasks: Task[] = [
  {
    id: "44444444-4444-4444-8444-444444444444",
    title: "Знайти 10 нових бізнесів",
    description: "Сфокусуватися на українських бізнесах у Польщі.",
    type: "outreach",
    due_date: seedToday,
    status: "To do",
    priority: "High",
    created_at: seedToday,
    updated_at: seedToday
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    title: "Зробити follow-up після КП",
    description: "LegalWay Poland чекає на уточнення формату.",
    type: "follow_up",
    related_lead_id: leadOneId,
    due_date: seedToday,
    status: "To do",
    priority: "High",
    created_at: seedToday,
    updated_at: seedToday
  },
  {
    id: "66666666-6666-4666-8666-666666666666",
    title: "Підготувати 1 контент-ролик",
    description: "Тема про довіру для українського бізнесу у Польщі.",
    type: "content",
    due_date: seedToday,
    status: "In progress",
    priority: "Medium",
    created_at: seedToday,
    updated_at: seedToday
  },
  {
    id: "77777777-7777-4777-8777-777777777777",
    title: "Оновити CRM",
    description: "Записати відповіді та наступні дії.",
    type: "admin",
    due_date: seedToday,
    status: "To do",
    priority: "Medium",
    created_at: seedToday,
    updated_at: seedToday
  }
];

const seedContent: ContentItem[] = [
  {
    id: "88888888-8888-4888-8888-888888888888",
    date: seedToday,
    topic: "Чому українському бізнесу в Польщі потрібна довіра",
    hook: "Люди не купують у логотипу.",
    key_points: "Довіра, обличчя, історія, регулярна присутність.",
    CTA: "Напишіть Hugo, якщо бізнесу потрібна медійність.",
    target_niche: "Усі ніші",
    status: "Заплановано",
    platform: "Instagram",
    notes: "Зняти як короткий монолог."
  },
  {
    id: "99999999-9999-4999-8999-999999999999",
    date: seedTomorrow,
    topic: "Люди купують не у бізнесу, а у людини",
    hook: "Ваш продукт можуть скопіювати, вашу історію ні.",
    key_points: "Власник, цінності, шлях, доказ експертності.",
    CTA: "Покажемо людину за бізнесом.",
    target_niche: "Експерти",
    status: "Ідея",
    platform: "TikTok",
    notes: ""
  }
];

const seedTemplates: Template[] = [
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    title: "Перше повідомлення для бізнесу",
    category: "Перше повідомлення",
    body: "Вітаю! Я Hugo, незалежний журналіст і автор Hugo Media Group. Побачив ваш бізнес і думаю, що його можна показати не просто як послугу, а як історію людини за бізнесом."
  },
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    title: "Follow-up після першого контакту",
    category: "Follow-up 1",
    body: "Вітаю! Повертаюся до нашого контакту. Моя ідея проста: зробити ваш бізнес видимішим через довіру, історію і живу медійну подачу."
  },
  {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    title: "Відповідь на дорого",
    category: "Відповідь “дорого”",
    body: "Розумію. Тут оплата не за пост, а за медійну довіру: підготовка, зйомка, подача, історія і матеріали, які бізнес може використовувати далі."
  }
];

const seedHistory: HistoryItem[] = [
  {
    id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    lead_id: leadOneId,
    status: "Написав",
    note: "Перший контакт через Instagram.",
    created_at: "2026-06-17"
  },
  {
    id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    lead_id: leadOneId,
    status: "КП відправлено",
    note: "Надіслано коротку пропозицію.",
    created_at: "2026-06-20"
  },
  {
    id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
    lead_id: leadTwoId,
    status: "Відповів",
    note: "Попросили деталі пакета.",
    created_at: seedToday
  }
];

const statusStyles: Record<LeadStatus, string> = {
  Новий: "bg-slate-500/15 text-slate-200 border-slate-400/25",
  Проаналізований: "bg-blue/15 text-sky-200 border-blue/30",
  Написав: "bg-violet/15 text-violet-200 border-violet/35",
  Відповів: "bg-mint/15 text-emerald-200 border-mint/30",
  "КП відправлено": "bg-amber/15 text-amber-200 border-amber/30",
  "Дзвінок заплановано": "bg-cyan-500/15 text-cyan-200 border-cyan-400/30",
  Думає: "bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/30",
  Виграно: "bg-emerald-500/20 text-emerald-100 border-emerald-400/35",
  Програно: "bg-rose/15 text-rose-200 border-rose/35",
  "Повернутись пізніше": "bg-zinc-500/15 text-zinc-200 border-zinc-400/25"
};

const nav = [
  { id: "dashboard", label: "Дашборд", icon: LayoutDashboard },
  { id: "leads", label: "Ліди", icon: Users },
  { id: "tasks", label: "Завдання", icon: ListChecks },
  { id: "followups", label: "Follow-up", icon: MessageSquare },
  { id: "calendar", label: "Календар", icon: CalendarDays },
  { id: "content", label: "Контент-план", icon: ClipboardList },
  { id: "scripts", label: "Скрипти", icon: FileText },
  { id: "analytics", label: "Аналітика", icon: BarChart3 },
  { id: "settings", label: "Налаштування", icon: Settings }
];

const routeById: Record<string, string> = {
  dashboard: "/",
  leads: "/leads",
  tasks: "/tasks",
  followups: "/follow-up",
  calendar: "/calendar",
  content: "/content-plan",
  scripts: "/scripts",
  analytics: "/analytics",
  settings: "/settings"
};

const idByRoute: Record<string, string> = Object.fromEntries(Object.entries(routeById).map(([id, route]) => [route, id]));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase =
  supabaseUrl && supabaseAnonKey
    ? { url: supabaseUrl.replace(/\/$/, ""), key: supabaseAnonKey }
    : null;

type SupabaseConnection = NonNullable<typeof supabase>;

const seedSnapshot: CrmSnapshot = {
  leads: seedLeads,
  tasks: seedTasks,
  contentItems: seedContent,
  templates: seedTemplates,
  history: seedHistory,
  settings: defaultSettings
};

function readLocalSnapshot(): CrmSnapshot | null {
  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as CrmSnapshot) : null;
  } catch {
    return null;
  }
}

function writeLocalSnapshot(snapshot: CrmSnapshot) {
  window.localStorage.setItem(storageKey, JSON.stringify(snapshot));
}

function contentToRow(item: ContentItem): ContentRow {
  const { CTA, ...rest } = item;
  return { ...rest, cta: CTA };
}

function rowToContent(item: ContentRow): ContentItem {
  const { cta, ...rest } = item;
  const rawStatus = String(rest.status);
  const status = rawStatus === "Підготувати" ? "Заплановано" : rawStatus === "Записати" ? "Записано" : rawStatus;
  return { ...rest, status, CTA: cta ?? "" } as ContentItem;
}

function emptyDateToNull(value: string) {
  return value?.trim() ? value : null;
}

function nullDateToEmpty(value: string | null) {
  return value ?? "";
}

function leadToRow(lead: Lead): LeadRow {
  return {
    ...lead,
    deal_value: numericValue(lead.deal_value),
    first_contact_date: emptyDateToNull(lead.first_contact_date),
    last_contact_date: emptyDateToNull(lead.last_contact_date),
    follow_up_date: emptyDateToNull(lead.follow_up_date)
  };
}

function rowToLead(lead: LeadRow): Lead {
  return {
    ...lead,
    deal_value: numericValue(lead.deal_value),
    first_contact_date: nullDateToEmpty(lead.first_contact_date),
    last_contact_date: nullDateToEmpty(lead.last_contact_date),
    follow_up_date: nullDateToEmpty(lead.follow_up_date)
  };
}

function cleanTask(task: Task) {
  return { ...task, related_lead_id: task.related_lead_id || null, due_date: emptyDateToNull(task.due_date) };
}

function mergeSettings(settings?: Partial<AppSettings> | null): AppSettings {
  return {
    business: { ...defaultSettings.business, ...(settings?.business ?? {}) },
    sales: { ...defaultSettings.sales, ...(settings?.sales ?? {}) },
    packages: settings?.packages?.length ? settings.packages : defaultSettings.packages,
    dailyTargets: settings?.dailyTargets?.length ? settings.dailyTargets : defaultSettings.dailyTargets,
    kpiTargets: { ...defaultSettings.kpiTargets, ...(settings?.kpiTargets ?? {}) }
  };
}

function recoverLocalLeads(remoteSnapshot: CrmSnapshot, localSnapshot: CrmSnapshot | null) {
  if (!localSnapshot?.leads.length || remoteSnapshot.leads.length) {
    return { snapshot: remoteSnapshot, shouldSync: false };
  }

  return {
    snapshot: { ...remoteSnapshot, leads: localSnapshot.leads },
    shouldSync: true
  };
}

async function supabaseRequest<T>(
  connection: SupabaseConnection,
  table: string,
  query: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${connection.url}/rest/v1/${table}?${query}`, {
    ...init,
    headers: {
      apikey: connection.key,
      Authorization: `Bearer ${connection.key}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${table}: ${response.status} ${body}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (null as T);
}

async function fetchSupabaseSnapshot(
  connection: SupabaseConnection
): Promise<{ snapshot: CrmSnapshot | null; error?: string }> {
  try {
    const [leads, tasks, contentItems, templates, history, settingsRows] = await Promise.all([
      supabaseRequest<LeadRow[]>(connection, "leads", "select=*&order=created_at.desc"),
      supabaseRequest<Task[]>(connection, "tasks", "select=*&order=due_date.asc"),
      supabaseRequest<ContentRow[]>(connection, "content_items", "select=*&order=date.asc"),
      supabaseRequest<Template[]>(connection, "templates", "select=*&order=created_at.desc"),
      supabaseRequest<HistoryItem[]>(connection, "status_history", "select=*&order=created_at.desc"),
      supabaseRequest<SettingRow[]>(connection, "settings", "select=key,value&key=eq.app")
    ]);

    const remoteSettings = settingsRows[0]?.value;
    return {
      snapshot: {
        leads: leads.map(rowToLead),
        tasks,
        contentItems: contentItems.map(rowToContent),
        templates,
        history,
        settings: mergeSettings(remoteSettings)
      }
    };
  } catch (error) {
    return {
      snapshot: null,
      error: error instanceof Error ? error.message : "Supabase request failed"
    };
  }
}

async function upsertRows<T>(connection: SupabaseConnection, table: string, rows: T[]) {
  if (!rows.length) return;

  await supabaseRequest<null>(connection, table, "", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal"
    },
    body: JSON.stringify(rows)
  });
}

async function persistLead(connection: SupabaseConnection, lead: Lead) {
  await upsertRows(connection, "leads", [leadToRow(lead)]);
}

function syncSupabaseSnapshot(connection: SupabaseConnection, snapshot: CrmSnapshot) {
  void Promise.all([
    upsertRows(connection, "leads", snapshot.leads.map(leadToRow)),
    upsertRows(connection, "tasks", snapshot.tasks.map(cleanTask)),
    upsertRows(connection, "content_items", snapshot.contentItems.map(contentToRow)),
    upsertRows(connection, "templates", snapshot.templates),
    upsertRows(connection, "status_history", snapshot.history),
    supabaseRequest<null>(connection, "settings", "on_conflict=key", {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify([{ key: "app", value: snapshot.settings }])
    })
  ]).catch((error) => {
    console.error("Supabase sync failed", error);
  });
}

function deleteSupabaseRows(connection: SupabaseConnection, table: string, filter: string) {
  void supabaseRequest<null>(connection, table, filter, {
    method: "DELETE",
    headers: {
      Prefer: "return=minimal"
    }
  }).catch((error) => {
    console.error("Supabase delete failed", error);
  });
}

export default function SalesOs() {
  const [active, setActive] = useState("dashboard");
  const [leads, setLeads] = useState(seedSnapshot.leads);
  const [tasks, setTasks] = useState(seedSnapshot.tasks);
  const [contentItems, setContentItems] = useState(seedSnapshot.contentItems);
  const [templates, setTemplates] = useState(seedSnapshot.templates);
  const [history, setHistory] = useState(seedSnapshot.history);
  const [settings, setSettings] = useState(seedSnapshot.settings);
  const [isHydrated, setIsHydrated] = useState(false);
  const [dataSource, setDataSource] = useState<"local" | "supabase">(supabase ? "supabase" : "local");
  const [dataSourceNote, setDataSourceNote] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Усі");
  const [nicheFilter, setNicheFilter] = useState("Усі");
  const [cityFilter, setCityFilter] = useState("Усі");
  const [packageFilter, setPackageFilter] = useState("Усі");
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [toast, setToast] = useState("");
  const [today, setToday] = useState(getWarsawDateKey);
  const tomorrow = addDays(today, 1);
  const todayLabel = formatUkrainianDate(today);

  useEffect(() => {
    const updateDate = () => setToday(getWarsawDateKey());
    updateDate();
    const timer = window.setInterval(updateDate, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const applyRoute = () => {
      const nextActive = idByRoute[window.location.pathname] ?? "dashboard";
      setActive(nextActive);
      setSelectedLeadId(null);
    };
    applyRoute();
    window.addEventListener("popstate", applyRoute);
    return () => window.removeEventListener("popstate", applyRoute);
  }, []);

  function navigate(activeId: string) {
    const nextRoute = routeById[activeId] ?? "/";
    setActive(activeId);
    setSelectedLeadId(null);
    if (window.location.pathname !== nextRoute) {
      window.history.pushState(null, "", nextRoute);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const localSnapshot = readLocalSnapshot();
      const applySnapshot = (snapshot: CrmSnapshot) => {
        setLeads(snapshot.leads);
        setTasks(snapshot.tasks);
        setContentItems(snapshot.contentItems);
        setTemplates(snapshot.templates);
        setHistory(snapshot.history);
        setSettings(mergeSettings(snapshot.settings));
      };

      if (localSnapshot) {
        applySnapshot(localSnapshot);
      }

      if (supabase) {
        const { snapshot: remoteSnapshot, error } = await fetchSupabaseSnapshot(supabase);
        if (cancelled) return;

        if (remoteSnapshot) {
          const remoteHasData =
            remoteSnapshot.leads.length ||
            remoteSnapshot.tasks.length ||
            remoteSnapshot.contentItems.length ||
            remoteSnapshot.templates.length ||
            remoteSnapshot.history.length;
          const recovered = remoteHasData ? recoverLocalLeads(remoteSnapshot, localSnapshot) : { snapshot: localSnapshot ?? seedSnapshot, shouldSync: true };
          const nextSnapshot = recovered.snapshot;
          applySnapshot(nextSnapshot);
          writeLocalSnapshot(nextSnapshot);
          if (!remoteHasData || recovered.shouldSync) {
            syncSupabaseSnapshot(supabase, nextSnapshot);
          }
          setDataSource("supabase");
          setDataSourceNote("");
        } else {
          setDataSource("local");
          setDataSourceNote(`Supabase не підключився: ${error ?? "невідома помилка"}`);
        }
      } else {
        setDataSourceNote("Supabase змінні не задані у Vercel.");
      }

      setIsHydrated(true);
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const snapshot = { leads, tasks, contentItems, templates, history, settings };
    writeLocalSnapshot(snapshot);

    if (!supabase || dataSource !== "supabase") return;
    const timer = window.setTimeout(() => syncSupabaseSnapshot(supabase, snapshot), 450);
    return () => window.clearTimeout(timer);
  }, [contentItems, dataSource, history, isHydrated, leads, settings, tasks, templates]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredLeads = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesQuery =
        !normalized ||
        [lead.business_name, lead.city, lead.contact_name, lead.niche].some((value) =>
          value.toLowerCase().includes(normalized)
        );
      return (
        matchesQuery &&
        (statusFilter === "Усі" || lead.status === statusFilter) &&
        (nicheFilter === "Усі" || lead.niche === nicheFilter) &&
        (cityFilter === "Усі" || lead.city === cityFilter) &&
        (packageFilter === "Усі" || lead.package_interest === packageFilter)
      );
    });
  }, [cityFilter, leads, nicheFilter, packageFilter, query, statusFilter]);

  const cities = Array.from(new Set(leads.map((lead) => lead.city))).sort();
  const activePackages = settings.packages.filter((item) => !item.archived);
  const selectedLead = leads.find((lead) => lead.id === selectedLeadId) ?? null;
  const stats = {
    total: leads.length,
    contacted: leads.filter((lead) => ["Написав", "Відповів", "КП відправлено", "Думає", "Виграно"].includes(lead.status)).length,
    replies: leads.filter((lead) => ["Відповів", "КП відправлено", "Думає", "Виграно"].includes(lead.status)).length,
    proposals: leads.filter((lead) => lead.status === "КП відправлено").length,
    calls: leads.filter((lead) => lead.status === "Дзвінок заплановано").length,
    won: leads.filter((lead) => lead.status === "Виграно").length,
    pipeline: leads.filter((lead) => lead.status !== "Програно" && lead.status !== "Виграно").reduce((sum, lead) => sum + numericValue(lead.deal_value), 0),
    revenue: leads.filter((lead) => lead.status === "Виграно").reduce((sum, lead) => sum + numericValue(lead.deal_value), 0)
  };

  function updateLeadStatus(leadId: string, status: LeadStatus) {
    const baseDate = today;
    const followUpByStatus: Partial<Record<LeadStatus, string>> = {
      Написав: addDays(baseDate, settings.sales.follow_up_delay_contacted),
      Відповів: addDays(baseDate, 1),
      "КП відправлено": addDays(baseDate, settings.sales.follow_up_delay_proposal_sent),
      Думає: addDays(baseDate, settings.sales.follow_up_delay_thinking),
      Програно: addDays(baseDate, settings.sales.return_delay_lost)
    };

    setLeads((current) =>
      current.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              status,
              last_contact_date: baseDate,
              follow_up_date: status === "Виграно" ? "" : followUpByStatus[status] ?? lead.follow_up_date,
              next_action:
                status === "Виграно"
                  ? "Підготувати зйомку / бриф"
                  : status === "КП відправлено"
                    ? "Зробити follow-up після КП"
                    : status === "Дзвінок заплановано"
                      ? "Підготувати дзвінок"
                      : lead.next_action,
              updated_at: baseDate
            }
          : lead
      )
    );

    setHistory((current) => [
      {
        id: newId(),
        lead_id: leadId,
        status,
        note: "Статус змінено вручну у CRM.",
        created_at: baseDate
      },
      ...current
    ]);

    const taskByStatus: Partial<Record<LeadStatus, Pick<Task, "title" | "type" | "priority">>> = {
      "КП відправлено": { title: "Зробити follow-up після КП", type: "follow_up", priority: "High" },
      "Дзвінок заплановано": { title: "Підготувати дзвінок", type: "call", priority: "High" },
      Виграно: { title: "Підготувати зйомку / бриф", type: "shoot", priority: "High" }
    };

    const nextTask = taskByStatus[status];
    if (nextTask) {
      setTasks((current) => [
        {
          id: newId(),
          title: nextTask.title,
          description: "Автоматично створено після зміни статусу ліда.",
          type: nextTask.type,
          related_lead_id: leadId,
          due_date: status === "Виграно" ? addDays(baseDate, 1) : baseDate,
          status: "To do",
          priority: nextTask.priority,
          created_at: baseDate,
          updated_at: baseDate
        },
        ...current
      ]);
    }
  }

  async function saveLead(lead: Lead) {
    const leadToSave = {
      ...lead,
      business_name: lead.business_name.trim(),
      created_at: lead.created_at || today,
      updated_at: today
    };

    if (supabase && dataSource === "supabase") {
      try {
        await persistLead(supabase, leadToSave);
      } catch (error) {
        console.error("Lead save failed", error);
        setToast("Не вдалося зберегти лід у Supabase");
        throw error;
      }
    }

    setLeads((current) => {
      const exists = current.some((item) => item.id === leadToSave.id);
      return exists
        ? current.map((item) => (item.id === leadToSave.id ? leadToSave : item))
        : [leadToSave, ...current];
    });
    setIsLeadFormOpen(false);
    setEditingLead(null);
    setToast("Лід збережено");
  }

  function deleteLead(id: string) {
    setLeads((current) => current.filter((lead) => lead.id !== id));
    setTasks((current) => current.filter((task) => task.related_lead_id !== id));
    setHistory((current) => current.filter((item) => item.lead_id !== id));
    if (supabase && dataSource === "supabase") {
      deleteSupabaseRows(supabase, "tasks", `related_lead_id=eq.${encodeURIComponent(id)}`);
      deleteSupabaseRows(supabase, "leads", `id=eq.${encodeURIComponent(id)}`);
    }
    if (selectedLeadId === id) {
      setSelectedLeadId(null);
      navigate("leads");
    }
  }

  function markTaskDone(id: string) {
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, status: "Done", updated_at: today } : task))
    );
  }

  const pageTitle = selectedLead ? selectedLead.business_name : nav.find((item) => item.id === active)?.label ?? "Дашборд";

  return (
    <main className="min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="border-b border-line bg-ink/92 px-4 py-4 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r lg:px-5">
        <div className="mb-6 flex items-center justify-between gap-3">
          <button className="text-left" onClick={() => navigate("dashboard")}>
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-blue">Hugo Media</div>
            <div className="text-2xl font-black">Sales OS</div>
          </button>
          <div className="rounded-full border border-violet/30 bg-violet/15 px-3 py-1 text-xs text-violet-100">Private</div>
        </div>
        <nav className="grid grid-cols-2 gap-2 lg:grid-cols-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const activeItem = active === item.id && !selectedLead;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-left text-sm transition ${
                  activeItem ? "bg-white text-ink" : "text-slate-300 hover:bg-white/8 hover:text-white"
                }`}
                title={item.label}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="mt-6 rounded-lg border border-line bg-panel p-4">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Hugo Media Group</div>
          <p className="mt-3 text-sm leading-6 text-slate-200">
            Показую не просто бізнес.
            <br />
            Показую людину за бізнесом.
          </p>
        </div>
      </aside>

      <section className="min-w-0 px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm text-slate-400">Сьогодні: {todayLabel}</p>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">{pageTitle}</h1>
            <p className="mt-2 text-xs text-slate-500">
              Дані: {dataSource === "supabase" ? "Supabase" : "Demo/local browser storage"}
            </p>
            {dataSourceNote ? <p className="mt-1 text-xs text-amber-300">{dataSourceNote}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 font-semibold text-ink"
              onClick={() => { setEditingLead(null); setIsLeadFormOpen(true); }}
            >
              <Plus className="h-4 w-4" />
              Додати лід
            </button>
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-panel px-4 font-semibold text-white"
              onClick={() => navigate("tasks")}
            >
              <Check className="h-4 w-4" />
              Завдання
            </button>
          </div>
        </header>

        {selectedLead ? (
          <LeadDetail
            lead={selectedLead}
            history={history.filter((item) => item.lead_id === selectedLead.id)}
            onBack={() => navigate("leads")}
            onStatus={updateLeadStatus}
            onEdit={() => { setEditingLead(selectedLead); setIsLeadFormOpen(true); }}
            onDelete={() => window.confirm("Видалити лід?") && deleteLead(selectedLead.id)}
            onTask={() =>
              setTasks((current) => [
                {
                  id: newId(),
                  title: `Задача для ${selectedLead.business_name}`,
                  description: selectedLead.next_action,
                  type: "admin",
                  related_lead_id: selectedLead.id,
                  due_date: today,
                  status: "To do",
                  priority: "Medium",
                  created_at: today,
                  updated_at: today
                },
                ...current
              ])
            }
          />
        ) : active === "dashboard" ? (
          <Dashboard today={today} stats={stats} leads={leads} tasks={tasks} packages={activePackages} dailyTargets={settings.dailyTargets} onDailyTargetsChange={(dailyTargets) => setSettings((current) => ({ ...current, dailyTargets }))} onResetDailyTargets={() => setSettings((current) => ({ ...current, dailyTargets: current.dailyTargets.map((target) => ({ ...target, done: false })) }))} onOpenSettings={() => navigate("settings")} onDone={markTaskDone} onOpenLead={setSelectedLeadId} onStatus={updateLeadStatus} />
        ) : active === "leads" ? (
          <LeadsPage
            leads={filteredLeads}
            allLeads={leads}
            packages={activePackages}
            query={query}
            setQuery={setQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            nicheFilter={nicheFilter}
            setNicheFilter={setNicheFilter}
            cityFilter={cityFilter}
            setCityFilter={setCityFilter}
            packageFilter={packageFilter}
            setPackageFilter={setPackageFilter}
            cities={cities}
            onOpen={setSelectedLeadId}
            onEdit={(lead) => { setEditingLead(lead); setIsLeadFormOpen(true); }}
            onDelete={deleteLead}
            onDuplicate={(lead) => saveLead({ ...lead, id: newId(), business_name: `${lead.business_name} копія`, created_at: today, updated_at: today })}
            onPatch={(id, patch) => setLeads((current) => current.map((lead) => (lead.id === id ? { ...lead, ...patch, updated_at: today } : lead)))}
            onStatus={updateLeadStatus}
          />
        ) : active === "tasks" ? (
          <TasksPage today={today} tomorrow={tomorrow} tasks={tasks} leads={leads} onDone={markTaskDone} setTasks={setTasks} />
        ) : active === "followups" ? (
          <FollowupsPage today={today} leads={leads} setLeads={setLeads} setTasks={setTasks} onDone={(id) => updateLeadStatus(id, "Проаналізований")} onOpen={setSelectedLeadId} />
        ) : active === "calendar" ? (
          <CalendarPage today={today} leads={leads} tasks={tasks} contentItems={contentItems} />
        ) : active === "content" ? (
          <ContentPage today={today} items={contentItems} setItems={setContentItems} />
        ) : active === "scripts" ? (
          <TemplatesPage
            templates={templates}
            setTemplates={setTemplates}
            onDelete={(id) => {
              setTemplates((current) => current.filter((item) => item.id !== id));
              if (supabase && dataSource === "supabase") {
                deleteSupabaseRows(supabase, "templates", `id=eq.${encodeURIComponent(id)}`);
              }
            }}
            onCopied={() => setToast("Текст скопійовано")}
          />
        ) : active === "analytics" ? (
          <AnalyticsPage leads={leads} />
        ) : (
          <SettingsPage settings={settings} onChange={setSettings} />
        )}
      </section>

      {isLeadFormOpen && (
        <LeadForm
          lead={editingLead}
          packages={activePackages}
          today={today}
          onClose={() => { setIsLeadFormOpen(false); setEditingLead(null); }}
          onSave={saveLead}
        />
      )}

      {toast && <div className="fixed bottom-5 right-5 rounded-lg bg-white px-4 py-3 font-semibold text-ink shadow-glow">{toast}</div>}
    </main>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-line bg-panel/92 p-4 shadow-glow ${className}`}>{children}</section>;
}

function Badge({ status }: { status: LeadStatus }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}>{status}</span>;
}

function Dashboard({ today, stats, leads, tasks, packages, dailyTargets, onDailyTargetsChange, onResetDailyTargets, onOpenSettings, onDone, onOpenLead, onStatus }: {
  today: string;
  stats: Record<string, number>;
  leads: Lead[];
  tasks: Task[];
  packages: PackageItem[];
  dailyTargets: DailyTarget[];
  onDailyTargetsChange: (targets: DailyTarget[]) => void;
  onResetDailyTargets: () => void;
  onOpenSettings: () => void;
  onDone: (id: string) => void;
  onOpenLead: (id: string) => void;
  onStatus: (id: string, status: LeadStatus) => void;
}) {
  const todayTasks = tasks.filter((task) => task.due_date <= today && task.status !== "Done");
  const followUps = leads.filter((lead) => lead.follow_up_date && lead.follow_up_date <= today && lead.status !== "Виграно");
  const statCards = [
    ["Всього лідів", stats.total],
    ["Написано", stats.contacted],
    ["Відповіді", stats.replies],
    ["КП відправлено", stats.proposals],
    ["Дзвінки", stats.calls],
    ["Угоди виграно", stats.won],
    ["Потенційний дохід", moneyAmount(stats.pipeline)],
    ["Закритий дохід", moneyAmount(stats.revenue)]
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(([label, value]) => (
          <Card key={label}>
            <div className="text-sm text-slate-400">{label}</div>
            <div className="mt-2 text-2xl font-black">{value}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <SectionTitle title="Daily plan" />
            <div className="flex gap-2">
              <button className="rounded-lg border border-line px-3 py-2 text-sm font-semibold" onClick={onOpenSettings}>Редагувати</button>
              <button className="rounded-lg border border-line px-3 py-2 text-sm font-semibold" onClick={onResetDailyTargets}>Reset</button>
            </div>
          </div>
          <div className="mb-4 space-y-2">
            {dailyTargets.map((target) => (
              <label key={target.id} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-panel2 p-3">
                <span className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-blue"
                    checked={target.done}
                    onChange={(event) => onDailyTargetsChange(dailyTargets.map((item) => (item.id === target.id ? { ...item, done: event.target.checked } : item)))}
                  />
                  <span>{target.title}</span>
                </span>
                <span className="rounded-md bg-ink px-2 py-1 text-xs text-blue">{target.done ? target.target : 0}/{target.target}</span>
              </label>
            ))}
          </div>
          <SectionTitle title="Завдання на сьогодні" />
          <div className="space-y-2">
            {todayTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-panel2 p-3">
                <div>
                  <div className="font-semibold">{task.title}</div>
                  <div className="text-xs text-slate-400">{task.priority} · {task.type}</div>
                </div>
                <IconButton label="Виконано" onClick={() => onDone(task.id)}>
                  <Check className="h-4 w-4" />
                </IconButton>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle title="Follow-up сьогодні" />
          <DataTable
            headers={["Бізнес", "Ніша", "Місто", "Статус", "Наступна дія", "Дата", ""]}
            rows={followUps.map((lead) => [
              <button key="name" className="font-semibold text-blue" onClick={() => onOpenLead(lead.id)}>{lead.business_name}</button>,
              lead.niche,
              lead.city,
              <Badge key="status" status={lead.status} />,
              lead.next_action,
              lead.follow_up_date,
              <IconButton key="done" label="Виконано" onClick={() => onStatus(lead.id, "Проаналізований")}><Check className="h-4 w-4" /></IconButton>
            ])}
          />
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <SectionTitle title="Останні ліди" />
          <DataTable
            headers={["Бізнес", "Ніша", "Місто", "Статус", "Пакет", "Сума", "Наступна дія"]}
            rows={leads.slice(0, 6).map((lead) => [
              <button key="name" className="font-semibold text-blue" onClick={() => onOpenLead(lead.id)}>{lead.business_name}</button>,
              lead.niche,
              lead.city,
              <Badge key="status" status={lead.status} />,
              lead.package_interest,
              moneyAmount(numericValue(lead.deal_value)),
              lead.next_action
            ])}
          />
        </Card>
        <Card>
          <SectionTitle title="Pipeline по пакетах" />
          <div className="space-y-3">
            {packages.map((pkg) => {
              const count = leads.filter((lead) => lead.package_interest === pkg.name && lead.status !== "Програно").length;
              return (
                <div key={pkg.name} className="rounded-lg border border-line bg-panel2 p-3">
                  <div className="flex justify-between gap-3">
                    <span className="font-semibold">{pkg.name}</span>
                    <span className="text-blue">{money(pkg.value)}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-blue" style={{ width: `${Math.min(count * 28, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function LeadsPage(props: {
  leads: Lead[];
  allLeads: Lead[];
  packages: PackageItem[];
  query: string;
  setQuery: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  nicheFilter: string;
  setNicheFilter: (value: string) => void;
  cityFilter: string;
  setCityFilter: (value: string) => void;
  packageFilter: string;
  setPackageFilter: (value: string) => void;
  cities: string[];
  onOpen: (id: string) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
  onDuplicate: (lead: Lead) => void;
  onPatch: (id: string, patch: Partial<Lead>) => void;
  onStatus: (id: string, status: LeadStatus) => void;
}) {
  return (
    <Card>
      <div className="mb-4 grid gap-3 lg:grid-cols-[1.3fr_repeat(4,1fr)]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <input className="field pl-10" value={props.query} onChange={(event) => props.setQuery(event.target.value)} placeholder="Пошук: бізнес, місто, контакт, ніша" />
        </label>
        <Select value={props.statusFilter} onChange={props.setStatusFilter} options={["Усі", ...statuses]} />
        <Select value={props.nicheFilter} onChange={props.setNicheFilter} options={["Усі", ...niches]} />
        <Select value={props.cityFilter} onChange={props.setCityFilter} options={["Усі", ...props.cities]} />
        <Select value={props.packageFilter} onChange={props.setPackageFilter} options={["Усі", ...props.packages.map((pkg) => pkg.name)]} />
      </div>
      <DataTable
        headers={["Бізнес", "Ніша", "Місто", "Контакт", "Статус", "Пакет", "Сума", "Follow-up", "Наступна дія", "Дії"]}
        rows={props.leads.map((lead) => [
          <button key="name" className="font-semibold text-blue" onClick={() => props.onOpen(lead.id)}>{lead.business_name}</button>,
          lead.niche,
          lead.city,
          lead.contact_name,
          <Select key="status" value={lead.status} onChange={(status) => props.onStatus(lead.id, status as LeadStatus)} options={statuses} />,
          lead.package_interest,
          moneyAmount(numericValue(lead.deal_value)),
          <Input key="followup" label="" value={lead.follow_up_date} onChange={(value) => props.onPatch(lead.id, { follow_up_date: value })} />,
          <span key="action" className="block min-w-56 whitespace-normal leading-6">{lead.next_action || "—"}</span>,
          <div key="actions" className="flex flex-wrap gap-1">
            <button className="rounded-md border border-line px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-white hover:text-ink" onClick={() => props.onOpen(lead.id)}>Відкрити</button>
            <IconButton label="Редагувати" onClick={() => props.onEdit(lead)}><Edit3 className="h-4 w-4" /></IconButton>
            <IconButton label="Дублювати" onClick={() => props.onDuplicate(lead)}><Copy className="h-4 w-4" /></IconButton>
            <IconButton label="Видалити" onClick={() => window.confirm("Видалити лід?") && props.onDelete(lead.id)}><Trash2 className="h-4 w-4" /></IconButton>
          </div>
        ])}
      />
    </Card>
  );
}

function LeadDetail({ lead, history, onBack, onStatus, onEdit, onDelete, onTask }: {
  lead: Lead;
  history: HistoryItem[];
  onBack: () => void;
  onStatus: (id: string, status: LeadStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
  onTask: () => void;
}) {
  const fields = [
    ["Ніша", lead.niche],
    ["Місто", lead.city],
    ["Контакт", lead.contact_name],
    ["Канал", lead.contact_channel],
    ["Телефон", lead.phone],
    ["Email", lead.email],
    ["Instagram", lead.instagram_url],
    ["Facebook", lead.facebook_url],
    ["Сайт", lead.website_url],
    ["Слабке місце", lead.weak_point],
    ["Кут офферу", lead.offer_angle],
    ["Пакет", lead.package_interest],
    ["Сума", moneyAmount(numericValue(lead.deal_value))],
    ["Перший контакт", lead.first_contact_date],
    ["Останній контакт", lead.last_contact_date],
    ["Follow-up", lead.follow_up_date || "не заплановано"],
    ["Наступна дія", lead.next_action],
    ["Джерело", lead.source],
    ["Нотатки", lead.notes]
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <button className="rounded-lg border border-line px-4 py-2 text-sm font-semibold" onClick={onBack}>Назад до лідів</button>
        <button className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-ink" onClick={onEdit}>Редагувати</button>
        <button className="rounded-lg border border-line px-4 py-2 text-sm font-semibold" onClick={onTask}>Створити задачу</button>
        <button className="rounded-lg border border-red-400/40 px-4 py-2 text-sm font-semibold text-red-200" onClick={onDelete}>Видалити</button>
      </div>
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-sm text-slate-400">Lead detail</div>
            <h2 className="text-3xl font-black">{lead.business_name}</h2>
          </div>
          <Badge status={lead.status} />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {fields.map(([label, value]) => (
            <div key={label} className="rounded-lg border border-line bg-panel2 p-3">
              <div className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</div>
              <div className="mt-1 break-words text-sm text-slate-100">{value || "—"}</div>
            </div>
          ))}
        </div>
      </Card>
      <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <Card>
          <SectionTitle title="Швидкі статуси" />
          <div className="flex flex-wrap gap-2">
            {(["Написав", "Відповів", "КП відправлено", "Думає", "Виграно", "Програно"] as LeadStatus[]).map((status) => (
              <button key={status} className="rounded-lg border border-line bg-panel2 px-4 py-2 text-sm font-semibold hover:bg-white hover:text-ink" onClick={() => onStatus(lead.id, status)}>
                {status}
              </button>
            ))}
          </div>
        </Card>
        <Card>
          <SectionTitle title="Історія статусів" />
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.id} className="rounded-lg border border-line bg-panel2 p-3">
                <div className="flex items-center justify-between gap-3">
                  <Badge status={item.status} />
                  <span className="text-xs text-slate-400">{item.created_at}</span>
                </div>
                <p className="mt-2 text-sm text-slate-300">{item.note}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function TasksPage({ today, tomorrow, tasks, leads, onDone, setTasks }: { today: string; tomorrow: string; tasks: Task[]; leads: Lead[]; onDone: (id: string) => void; setTasks: React.Dispatch<React.SetStateAction<Task[]>> }) {
  const [typeFilter, setTypeFilter] = useState("Усі");
  const [statusFilter, setStatusFilter] = useState("Усі");
  const [editing, setEditing] = useState<Task | null>(null);
  const filtered = tasks.filter((task) => (typeFilter === "Усі" || task.type === typeFilter) && (statusFilter === "Усі" || task.status === statusFilter));
  const groups = [
    ["Прострочені", filtered.filter((task) => task.due_date < today && task.status !== "Done")],
    ["Сьогодні", filtered.filter((task) => task.due_date === today)],
    ["Завтра", filtered.filter((task) => task.due_date === tomorrow)],
    ["Усі задачі", filtered]
  ] as const;

  return (
    <div className="space-y-5">
      <Card>
        <div className="grid gap-3 md:grid-cols-3">
          <Select value={typeFilter} onChange={setTypeFilter} options={["Усі", "outreach", "follow_up", "call", "proposal", "content", "shoot", "admin"]} />
          <Select value={statusFilter} onChange={setStatusFilter} options={["Усі", "To do", "In progress", "Done", "Cancelled"]} />
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 font-semibold text-ink"
            onClick={() => setEditing(newTask(today))}
          >
            <Plus className="h-4 w-4" />
            Додати задачу
          </button>
        </div>
      </Card>
      {groups.map(([title, items]) => (
        <Card key={title}>
          <SectionTitle title={title} />
          <DataTable
            headers={["Назва", "Тип", "Лід", "Дата", "Статус", "Пріоритет", ""]}
            rows={items.map((task) => [
              task.title,
              task.type,
              leads.find((lead) => lead.id === task.related_lead_id)?.business_name ?? "—",
              task.due_date,
              <Select key="status" value={task.status} onChange={(status) => setTasks((current) => current.map((item) => (item.id === task.id ? { ...item, status: status as Task["status"], updated_at: today } : item)))} options={["To do", "In progress", "Done", "Cancelled"]} />,
              task.priority,
              <div key="actions" className="flex gap-1">
                <IconButton label="Редагувати" onClick={() => setEditing(task)}><Edit3 className="h-4 w-4" /></IconButton>
                <IconButton label="Виконано" onClick={() => onDone(task.id)}><Check className="h-4 w-4" /></IconButton>
                <IconButton label="Видалити" onClick={() => window.confirm("Видалити задачу?") && setTasks((current) => current.filter((item) => item.id !== task.id))}><Trash2 className="h-4 w-4" /></IconButton>
              </div>
            ])}
          />
        </Card>
      ))}
      {editing ? (
        <TaskEditor
          today={today}
          task={editing}
          leads={leads}
          onCancel={() => setEditing(null)}
          onSave={(task) => {
            setTasks((current) => (current.some((item) => item.id === task.id) ? current.map((item) => (item.id === task.id ? task : item)) : [task, ...current]));
            setEditing(null);
          }}
        />
      ) : null}
    </div>
  );
}

function newTask(today: string, overrides: Partial<Task> = {}): Task {
  return {
    id: newId(),
    title: "Нова задача",
    description: "",
    type: "admin",
    related_lead_id: "",
    due_date: today,
    status: "To do",
    priority: "Medium",
    created_at: today,
    updated_at: today,
    ...overrides
  };
}

function FollowupsPage({
  today,
  leads,
  setLeads,
  setTasks,
  onDone,
  onOpen
}: {
  today: string;
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onDone: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  const items = leads.filter((lead) => lead.follow_up_date && lead.status !== "Виграно");
  const updateLead = (id: string, patch: Partial<Lead>) => setLeads((current) => current.map((lead) => (lead.id === id ? { ...lead, ...patch, updated_at: today } : lead)));
  return (
    <Card>
      <SectionTitle title="Усі follow-up" />
      <DataTable
        headers={["Бізнес", "Статус", "Наступна дія", "Дата", "Перенести", ""]}
        rows={items.map((lead) => [
          <button key="name" className="font-semibold text-blue" onClick={() => onOpen(lead.id)}>{lead.business_name}</button>,
          <Badge key="status" status={lead.status} />,
          <Input key="action" label="" value={lead.next_action} onChange={(value) => updateLead(lead.id, { next_action: value })} />,
          <Input key="date" label="" value={lead.follow_up_date} onChange={(value) => updateLead(lead.id, { follow_up_date: value })} />,
          <div key="postpone" className="flex flex-wrap gap-1">
            {[1, 3, 7, 30].map((days) => (
              <button key={days} className="rounded-md border border-line px-2 py-1 text-xs hover:bg-white hover:text-ink" onClick={() => updateLead(lead.id, { follow_up_date: addDays(lead.follow_up_date || today, days) })}>
                +{days}
              </button>
            ))}
          </div>,
          <div key="actions" className="flex gap-1">
            <IconButton label="Створити follow-up task" onClick={() => setTasks((current) => [newTask(today, { title: `Follow-up: ${lead.business_name}`, type: "follow_up", related_lead_id: lead.id, due_date: lead.follow_up_date || today, priority: "High" }), ...current])}><Plus className="h-4 w-4" /></IconButton>
            <IconButton label="Виконано" onClick={() => onDone(lead.id)}><Check className="h-4 w-4" /></IconButton>
            <IconButton label="Видалити дату" onClick={() => updateLead(lead.id, { follow_up_date: "" })}><Trash2 className="h-4 w-4" /></IconButton>
          </div>
        ])}
      />
    </Card>
  );
}

function CalendarPage({ today, leads, tasks, contentItems }: { today: string; leads: Lead[]; tasks: Task[]; contentItems: ContentItem[] }) {
  const days = Array.from({ length: 7 }, (_, index) => addDays(today, index));
  return (
    <div className="grid gap-4 lg:grid-cols-7">
      {days.map((day) => {
        const dayLeads = leads.filter((lead) => lead.follow_up_date === day);
        const dayTasks = tasks.filter((task) => task.due_date === day);
        const dayContent = contentItems.filter((item) => item.date === day);
        return (
          <Card key={day} className="min-h-52">
            <div className="font-black">{day}</div>
            <div className="mt-3 space-y-2 text-sm">
              <CalendarLine label="Follow-up" value={dayLeads.length} />
              <CalendarLine label="Задачі" value={dayTasks.length} />
              <CalendarLine label="Контент" value={dayContent.length} />
              {dayLeads.map((lead) => <p key={lead.id} className="rounded-md bg-panel2 p-2 text-slate-200">{lead.business_name}</p>)}
              {dayContent.map((item) => <p key={item.id} className="rounded-md bg-violet/15 p-2 text-violet-100">{item.topic}</p>)}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function ContentPage({ today, items, setItems }: { today: string; items: ContentItem[]; setItems: React.Dispatch<React.SetStateAction<ContentItem[]>> }) {
  const [editing, setEditing] = useState<ContentItem | null>(null);
  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SectionTitle title="Контент-план" />
        <button
          className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-white px-4 font-semibold text-ink"
          onClick={() => setEditing(newContentItem(today))}
        >
          <Plus className="h-4 w-4" />
          Додати
        </button>
      </div>
      <DataTable
        headers={["Дата", "Тема", "Хук", "Ніша", "Статус", "Платформа", "Дії"]}
        rows={items.map((item) => [
          item.date,
          item.topic,
          item.hook,
          item.target_niche,
          item.status,
          item.platform,
          <div key="actions" className="flex gap-1">
            <IconButton label="Редагувати" onClick={() => setEditing(item)}><Edit3 className="h-4 w-4" /></IconButton>
            <IconButton label="Дублювати" onClick={() => setItems((current) => [{ ...item, id: newId(), topic: `${item.topic} копія`, date: today }, ...current])}><Copy className="h-4 w-4" /></IconButton>
            <IconButton label="Видалити" onClick={() => window.confirm("Видалити контент?") && setItems((current) => current.filter((currentItem) => currentItem.id !== item.id))}><Trash2 className="h-4 w-4" /></IconButton>
          </div>
        ])}
      />
      {editing ? (
        <ContentEditor
          item={editing}
          onCancel={() => setEditing(null)}
          onSave={(item) => {
            setItems((current) => (current.some((currentItem) => currentItem.id === item.id) ? current.map((currentItem) => (currentItem.id === item.id ? item : currentItem)) : [item, ...current]));
            setEditing(null);
          }}
        />
      ) : null}
    </Card>
  );
}

function newContentItem(today: string): ContentItem {
  return {
    id: newId(),
    date: today,
    topic: "Нова тема",
    hook: "",
    key_points: "",
    CTA: "",
    target_niche: "",
    status: "Ідея",
    platform: "Instagram",
    notes: ""
  };
}

function TemplatesPage({
  templates,
  setTemplates,
  onDelete,
  onCopied
}: {
  templates: Template[];
  setTemplates: React.Dispatch<React.SetStateAction<Template[]>>;
  onDelete: (id: string) => void;
  onCopied: () => void;
}) {
  const [editing, setEditing] = useState<Template | null>(null);

  function save(template: Template) {
    setTemplates((current) => current.map((item) => (item.id === template.id ? template : item)));
    setEditing(null);
  }

  return (
    <div className="space-y-4">
      <button
        className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 font-semibold text-ink"
        onClick={() => setTemplates((current) => [{ id: newId(), title: "Новий шаблон", category: templateCategories[0], body: "" }, ...current])}
      >
        <Plus className="h-4 w-4" />
        Створити шаблон
      </button>
      <div className="grid gap-4 lg:grid-cols-2">
        {templates.map((template) => (
          <Card key={template.id}>
            {editing?.id === template.id ? (
              <TemplateEditor template={editing} onSave={save} onCancel={() => setEditing(null)} />
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-blue">{template.category}</div>
                    <h3 className="mt-1 text-lg font-black">{template.title}</h3>
                  </div>
                  <div className="flex gap-1">
                    <IconButton label="Копіювати" onClick={() => { void navigator.clipboard?.writeText(template.body); onCopied(); }}><Copy className="h-4 w-4" /></IconButton>
                    <IconButton label="Дублювати" onClick={() => setTemplates((current) => [{ ...template, id: newId(), title: `${template.title} копія` }, ...current])}><Copy className="h-4 w-4" /></IconButton>
                    <IconButton label="Редагувати" onClick={() => setEditing(template)}><Edit3 className="h-4 w-4" /></IconButton>
                    <IconButton label="Видалити" onClick={() => window.confirm("Видалити шаблон?") && onDelete(template.id)}><Trash2 className="h-4 w-4" /></IconButton>
                  </div>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-300">{template.body}</p>
              </>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function AnalyticsPage({ leads }: { leads: Lead[] }) {
  const written = leads.filter((lead) => ["Написав", "Відповів", "КП відправлено", "Думає", "Виграно"].includes(lead.status)).length;
  const replied = leads.filter((lead) => ["Відповів", "КП відправлено", "Думає", "Виграно"].includes(lead.status)).length;
  const proposals = leads.filter((lead) => lead.status === "КП відправлено").length;
  const won = leads.filter((lead) => lead.status === "Виграно").length;
  const byStatus = statuses.map((status) => ({ label: status, count: leads.filter((lead) => lead.status === status).length }));
  const byNiche = niches.map((niche) => ({ label: niche, count: leads.filter((lead) => lead.niche === niche).length })).filter((item) => item.count > 0);
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Лідів за тиждень", leads.length],
          ["Написано", written],
          ["Відповідей", replied],
          ["КП", proposals],
          ["Виграно", won],
          ["Програно", leads.filter((lead) => lead.status === "Програно").length],
          ["Потенційний дохід", moneyAmount(leads.reduce((sum, lead) => sum + numericValue(lead.deal_value), 0))],
          ["Конверсія написав → відповів", written ? `${Math.round((replied / written) * 100)}%` : "0%"]
        ].map(([label, value]) => (
          <Card key={label}>
            <div className="text-sm text-slate-400">{label}</div>
            <div className="mt-2 text-2xl font-black">{value}</div>
          </Card>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <BarPanel title="Ліди по статусах" data={byStatus} />
        <BarPanel title="Ліди по нішах" data={byNiche} />
      </div>
    </div>
  );
}

function SettingsPage({ settings, onChange }: { settings: AppSettings; onChange: React.Dispatch<React.SetStateAction<AppSettings>> }) {
  const updateBusiness = <K extends keyof BusinessProfile>(key: K, value: BusinessProfile[K]) =>
    onChange((current) => ({ ...current, business: { ...current.business, [key]: value } }));
  const updateSales = <K extends keyof SalesSettings>(key: K, value: SalesSettings[K]) =>
    onChange((current) => ({ ...current, sales: { ...current.sales, [key]: value } }));
  const updateKpi = <K extends keyof KpiTargets>(key: K, value: KpiTargets[K]) =>
    onChange((current) => ({ ...current, kpiTargets: { ...current.kpiTargets, [key]: value } }));
  const updatePackage = (id: string, patch: Partial<PackageItem>) =>
    onChange((current) => ({ ...current, packages: current.packages.map((pkg) => (pkg.id === id ? { ...pkg, ...patch } : pkg)) }));
  const updateDaily = (id: string, patch: Partial<DailyTarget>) =>
    onChange((current) => ({ ...current, dailyTargets: current.dailyTargets.map((target) => (target.id === id ? { ...target, ...patch } : target)) }));

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card>
        <SectionTitle title="Business profile" />
        <div className="space-y-3">
          <Input label="Назва платформи" value={settings.business.platform_name} onChange={(value) => updateBusiness("platform_name", value)} />
          <Input label="Власник" value={settings.business.owner_name} onChange={(value) => updateBusiness("owner_name", value)} />
          <Textarea label="Позиціонування" value={settings.business.positioning_line} onChange={(value) => updateBusiness("positioning_line", value)} />
          <Textarea label="Аудиторія" value={settings.business.audience_description} onChange={(value) => updateBusiness("audience_description", value)} />
          <Input label="Website URL" value={settings.business.website_url} onChange={(value) => updateBusiness("website_url", value)} />
          <Input label="Валюта" value={settings.business.currency} onChange={(value) => updateBusiness("currency", value)} />
          <Input label="Місто за замовчуванням" value={settings.business.default_city} onChange={(value) => updateBusiness("default_city", value)} />
          <Input label="Мова" value={settings.business.default_language} onChange={(value) => updateBusiness("default_language", value)} />
        </div>
      </Card>
      <Card>
        <SectionTitle title="Daily targets" />
        <div className="space-y-2">
          {settings.dailyTargets.map((target) => (
            <div key={target.id} className="grid gap-2 rounded-lg border border-line bg-panel2 p-3 md:grid-cols-[1fr_100px_auto]">
              <Input label="Назва" value={target.title} onChange={(value) => updateDaily(target.id, { title: value })} />
              <Input label="Ціль" value={String(target.target)} onChange={(value) => updateDaily(target.id, { target: Number(value) || 0 })} />
              <div className="flex items-end gap-1">
                <IconButton label={target.done ? "Повернути" : "Виконано"} onClick={() => updateDaily(target.id, { done: !target.done })}><Check className="h-4 w-4" /></IconButton>
                <IconButton label="Видалити" onClick={() => onChange((current) => ({ ...current, dailyTargets: current.dailyTargets.filter((item) => item.id !== target.id) }))}><Trash2 className="h-4 w-4" /></IconButton>
              </div>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <button className="rounded-lg bg-white px-4 py-2 font-semibold text-ink" onClick={() => onChange((current) => ({ ...current, dailyTargets: [...current.dailyTargets, { id: newId(), title: "Нова daily задача", target: 1, done: false, custom: true }] }))}>Додати daily task</button>
            <button className="rounded-lg border border-line px-4 py-2 font-semibold" onClick={() => onChange((current) => ({ ...current, dailyTargets: current.dailyTargets.map((target) => ({ ...target, done: false })) }))}>Скинути прогрес</button>
          </div>
        </div>
      </Card>
      <Card>
        <SectionTitle title="Sales settings" />
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Daily lead target" value={String(settings.sales.default_daily_lead_target)} onChange={(value) => updateSales("default_daily_lead_target", Number(value) || 0)} />
          <Input label="Daily message target" value={String(settings.sales.default_daily_message_target)} onChange={(value) => updateSales("default_daily_message_target", Number(value) || 0)} />
          <Input label="Delay after Contacted" value={String(settings.sales.follow_up_delay_contacted)} onChange={(value) => updateSales("follow_up_delay_contacted", Number(value) || 0)} />
          <Input label="Delay after Proposal Sent" value={String(settings.sales.follow_up_delay_proposal_sent)} onChange={(value) => updateSales("follow_up_delay_proposal_sent", Number(value) || 0)} />
          <Input label="Delay after Thinking" value={String(settings.sales.follow_up_delay_thinking)} onChange={(value) => updateSales("follow_up_delay_thinking", Number(value) || 0)} />
          <Input label="Return delay after Lost" value={String(settings.sales.return_delay_lost)} onChange={(value) => updateSales("return_delay_lost", Number(value) || 0)} />
        </div>
      </Card>
      <Card>
        <SectionTitle title="Пакети" />
        <div className="space-y-3">
          {settings.packages.map((pkg) => (
            <div key={pkg.id} className={`space-y-2 rounded-lg border border-line bg-panel2 p-3 ${pkg.archived ? "opacity-60" : ""}`}>
              <div className="grid gap-2 md:grid-cols-[1fr_120px_120px]">
                <Input label="Назва" value={pkg.name} onChange={(value) => updatePackage(pkg.id, { name: value })} />
                <Input label="Ціна" value={String(pkg.value)} onChange={(value) => updatePackage(pkg.id, { value: Number(value) || 0 })} />
                <Input label="Колір" value={pkg.color} onChange={(value) => updatePackage(pkg.id, { color: value })} />
              </div>
              <Textarea label="Опис" value={pkg.description} onChange={(value) => updatePackage(pkg.id, { description: value })} />
              <div className="flex flex-wrap gap-2">
                <button className="rounded-lg border border-line px-3 py-2 text-sm font-semibold" onClick={() => updatePackage(pkg.id, { archived: !pkg.archived })}>{pkg.archived ? "Відновити" : "Архівувати"}</button>
                <button className="rounded-lg border border-line px-3 py-2 text-sm font-semibold" onClick={() => window.confirm("Видалити пакет?") && onChange((current) => ({ ...current, packages: current.packages.filter((item) => item.id !== pkg.id) }))}>Видалити</button>
              </div>
            </div>
          ))}
          <button className="rounded-lg bg-white px-4 py-2 font-semibold text-ink" onClick={() => onChange((current) => ({ ...current, packages: [...current.packages, { id: newId(), name: "Новий пакет", value: 0, description: "", color: "#38bdf8", archived: false }] }))}>Додати пакет</button>
        </div>
      </Card>
      <Card>
        <SectionTitle title="KPI targets" />
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Weekly new leads" value={String(settings.kpiTargets.weekly_new_leads)} onChange={(value) => updateKpi("weekly_new_leads", Number(value) || 0)} />
          <Input label="Weekly messages" value={String(settings.kpiTargets.weekly_messages)} onChange={(value) => updateKpi("weekly_messages", Number(value) || 0)} />
          <Input label="Weekly follow-ups" value={String(settings.kpiTargets.weekly_followups)} onChange={(value) => updateKpi("weekly_followups", Number(value) || 0)} />
          <Input label="Weekly calls" value={String(settings.kpiTargets.weekly_calls)} onChange={(value) => updateKpi("weekly_calls", Number(value) || 0)} />
          <Input label="Weekly proposals" value={String(settings.kpiTargets.weekly_proposals)} onChange={(value) => updateKpi("weekly_proposals", Number(value) || 0)} />
          <Input label="Weekly closed deals" value={String(settings.kpiTargets.weekly_closed_deals)} onChange={(value) => updateKpi("weekly_closed_deals", Number(value) || 0)} />
          <Input label="Monthly revenue" value={String(settings.kpiTargets.monthly_revenue)} onChange={(value) => updateKpi("monthly_revenue", Number(value) || 0)} />
          <Textarea label="30-day goal" value={settings.kpiTargets.goal_30_day} onChange={(value) => updateKpi("goal_30_day", value)} />
          <Textarea label="60-day goal" value={settings.kpiTargets.goal_60_day} onChange={(value) => updateKpi("goal_60_day", value)} />
          <Textarea label="90-day goal" value={settings.kpiTargets.goal_90_day} onChange={(value) => updateKpi("goal_90_day", value)} />
        </div>
      </Card>
    </div>
  );
}

function LeadForm({ lead, packages, today, onClose, onSave }: { lead: Lead | null; packages: PackageItem[]; today: string; onClose: () => void; onSave: (lead: Lead) => Promise<void> | void }) {
  const [form, setForm] = useState<Lead>(
    lead ?? {
      id: newId(),
      business_name: "",
      niche: niches[0],
      city: "",
      contact_name: "",
      instagram_url: "",
      facebook_url: "",
      website_url: "",
      phone: "",
      email: "",
      contact_channel: "Instagram",
      weak_point: "",
      offer_angle: "",
      status: "Новий",
      package_interest: packages[0]?.name ?? "",
      deal_value: packages[0]?.value ?? 0,
      first_contact_date: today,
      last_contact_date: today,
      follow_up_date: "",
      next_action: "",
      source: "",
      notes: "",
      created_at: today,
      updated_at: today
    }
  );
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function setField<K extends keyof Lead>(key: K, value: Lead[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-black/70 p-4">
      <div className="mx-auto max-w-4xl rounded-lg border border-line bg-panel p-5 shadow-glow">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-black">{lead ? "Редагувати лід" : "Додати лід"}</h2>
          <IconButton label="Закрити" onClick={onClose}><X className="h-4 w-4" /></IconButton>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Бізнес" value={form.business_name} onChange={(value) => setField("business_name", value)} />
          <Select label="Ніша" value={form.niche} onChange={(value) => setField("niche", value)} options={niches} />
          <Input label="Місто" value={form.city} onChange={(value) => setField("city", value)} />
          <Input label="Контактна особа" value={form.contact_name} onChange={(value) => setField("contact_name", value)} />
          <Input label="Instagram" value={form.instagram_url} onChange={(value) => setField("instagram_url", value)} />
          <Input label="Facebook" value={form.facebook_url} onChange={(value) => setField("facebook_url", value)} />
          <Input label="Сайт" value={form.website_url} onChange={(value) => setField("website_url", value)} />
          <Input label="Телефон" value={form.phone} onChange={(value) => setField("phone", value)} />
          <Input label="Email" value={form.email} onChange={(value) => setField("email", value)} />
          <Input label="Канал контакту" value={form.contact_channel} onChange={(value) => setField("contact_channel", value)} />
          <Select label="Статус" value={form.status} onChange={(value) => setField("status", value as LeadStatus)} options={statuses} />
          <Select label="Пакет" value={form.package_interest} onChange={(value) => {
            const selectedPackage = packages.find((pkg) => pkg.name === value);
            setForm((current) => ({ ...current, package_interest: value, deal_value: selectedPackage?.value ?? current.deal_value }));
          }} options={packages.map((pkg) => pkg.name)} />
          <Input label="Сума" value={String(form.deal_value)} onChange={(value) => setField("deal_value", Number(value) || 0)} />
          <Input label="Follow-up date" value={form.follow_up_date} onChange={(value) => setField("follow_up_date", value)} />
          <Textarea label="Слабке місце" value={form.weak_point} onChange={(value) => setField("weak_point", value)} />
          <Textarea label="Кут офферу" value={form.offer_angle} onChange={(value) => setField("offer_angle", value)} />
          <Textarea label="Наступна дія" value={form.next_action} onChange={(value) => setField("next_action", value)} />
          <Textarea label="Нотатки" value={form.notes} onChange={(value) => setField("notes", value)} />
        </div>
        {error ? <p className="mt-3 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button className="rounded-lg border border-line px-4 py-2 font-semibold disabled:opacity-50" disabled={isSaving} onClick={onClose}>Скасувати</button>
          <button className="rounded-lg bg-white px-4 py-2 font-semibold text-ink disabled:opacity-60" disabled={isSaving} onClick={async () => {
            if (!form.business_name.trim()) {
              setError("Назва бізнесу обов'язкова.");
              return;
            }
            setError("");
            setIsSaving(true);
            try {
              await onSave(form);
            } catch {
              setError("Не вдалося зберегти лід у Supabase. Перевір підключення і спробуй ще раз.");
            } finally {
              setIsSaving(false);
            }
          }}>{isSaving ? "Зберігаю..." : "Зберегти"}</button>
        </div>
      </div>
    </div>
  );
}

function TaskEditor({ today, task, leads, onSave, onCancel }: { today: string; task: Task; leads: Lead[]; onSave: (task: Task) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState(task);
  const setField = <K extends keyof Task>(key: K, value: Task[K]) => setDraft((current) => ({ ...current, [key]: value, updated_at: today }));

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-black/70 p-4">
      <div className="mx-auto max-w-3xl rounded-lg border border-line bg-panel p-5 shadow-glow">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-black">Редагувати задачу</h2>
          <IconButton label="Закрити" onClick={onCancel}><X className="h-4 w-4" /></IconButton>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Назва" value={draft.title} onChange={(value) => setField("title", value)} />
          <Select label="Тип" value={draft.type} onChange={(value) => setField("type", value as Task["type"])} options={["outreach", "follow_up", "call", "proposal", "content", "shoot", "admin"]} />
          <Input label="Дата" value={draft.due_date} onChange={(value) => setField("due_date", value)} />
          <Select label="Статус" value={draft.status} onChange={(value) => setField("status", value as Task["status"])} options={["To do", "In progress", "Done", "Cancelled"]} />
          <Select label="Пріоритет" value={draft.priority} onChange={(value) => setField("priority", value as Task["priority"])} options={["Low", "Medium", "High"]} />
          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">Лід</span>
            <select className="field" value={draft.related_lead_id ?? ""} onChange={(event) => setField("related_lead_id", event.target.value)}>
              <option value="">Без ліда</option>
              {leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.business_name}</option>)}
            </select>
          </label>
          <Textarea label="Опис" value={draft.description} onChange={(value) => setField("description", value)} />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="rounded-lg border border-line px-4 py-2 font-semibold" onClick={onCancel}>Скасувати</button>
          <button className="rounded-lg bg-white px-4 py-2 font-semibold text-ink" onClick={() => onSave(draft)}>Зберегти</button>
        </div>
      </div>
    </div>
  );
}

function ContentEditor({ item, onSave, onCancel }: { item: ContentItem; onSave: (item: ContentItem) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState(item);
  const setField = <K extends keyof ContentItem>(key: K, value: ContentItem[K]) => setDraft((current) => ({ ...current, [key]: value }));

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-black/70 p-4">
      <div className="mx-auto max-w-4xl rounded-lg border border-line bg-panel p-5 shadow-glow">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-black">Редагувати контент</h2>
          <IconButton label="Закрити" onClick={onCancel}><X className="h-4 w-4" /></IconButton>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Дата" value={draft.date} onChange={(value) => setField("date", value)} />
          <Input label="Тема" value={draft.topic} onChange={(value) => setField("topic", value)} />
          <Input label="Хук" value={draft.hook} onChange={(value) => setField("hook", value)} />
          <Input label="Ніша" value={draft.target_niche} onChange={(value) => setField("target_niche", value)} />
          <Select label="Статус" value={draft.status} onChange={(value) => setField("status", value as ContentItem["status"])} options={["Ідея", "Заплановано", "Записано", "Змонтовано", "Опубліковано", "Архів"]} />
          <Select label="Платформа" value={draft.platform} onChange={(value) => setField("platform", value as ContentItem["platform"])} options={["TikTok", "Instagram", "Facebook", "YouTube Shorts", "Telegram"]} />
          <Textarea label="Ключові пункти" value={draft.key_points} onChange={(value) => setField("key_points", value)} />
          <Textarea label="CTA" value={draft.CTA} onChange={(value) => setField("CTA", value)} />
          <Textarea label="Нотатки" value={draft.notes} onChange={(value) => setField("notes", value)} />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="rounded-lg border border-line px-4 py-2 font-semibold" onClick={onCancel}>Скасувати</button>
          <button className="rounded-lg bg-white px-4 py-2 font-semibold text-ink" onClick={() => onSave(draft)}>Зберегти</button>
        </div>
      </div>
    </div>
  );
}

function TemplateEditor({ template, onSave, onCancel }: { template: Template; onSave: (template: Template) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState(template);
  return (
    <div className="space-y-3">
      <Input label="Назва" value={draft.title} onChange={(value) => setDraft((current) => ({ ...current, title: value }))} />
      <Select label="Категорія" value={draft.category} onChange={(value) => setDraft((current) => ({ ...current, category: value }))} options={templateCategories} />
      <Textarea label="Текст" value={draft.body} onChange={(value) => setDraft((current) => ({ ...current, body: value }))} />
      <div className="flex gap-2">
        <button className="rounded-lg bg-white px-4 py-2 font-semibold text-ink" onClick={() => onSave(draft)}>Зберегти</button>
        <button className="rounded-lg border border-line px-4 py-2 font-semibold" onClick={onCancel}>Скасувати</button>
      </div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="mb-4 text-lg font-black">{title}</h2>;
}

function DataTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line/70">
      <table className="w-full min-w-[1040px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} className={`border-b border-line bg-panel2/60 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-500 ${tableColumnClass(header)}`}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row, index) => (
            <tr key={index} className="align-top hover:bg-white/[0.03]">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className={`border-b border-line/70 px-4 py-3 text-slate-200 ${tableColumnClass(headers[cellIndex] ?? "")}`}>{cell}</td>
              ))}
            </tr>
          )) : (
            <tr>
              <td className="px-4 py-6 text-center text-slate-400" colSpan={headers.length}>Немає даних</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function tableColumnClass(header: string) {
  const lower = header.toLowerCase();
  if (["сума", "дата", "follow-up"].some((item) => lower.includes(item))) return "min-w-32 whitespace-nowrap";
  if (["наступна дія", "нотатки", "ключові", "хук"].some((item) => lower.includes(item))) return "min-w-56 max-w-80 whitespace-normal leading-6";
  if (["бізнес", "назва", "тема"].some((item) => lower.includes(item))) return "min-w-52";
  if (["дії", ""].includes(lower)) return "min-w-40";
  return "min-w-36";
}

function Select({ value, onChange, options, label }: { value: string; onChange: (value: string) => void; options: string[]; label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-xs text-slate-400">{label}</span>}
      <select className="field" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function Input({ label, value, onChange, defaultValue }: { label: string; value?: string; onChange?: (value: string) => void; defaultValue?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-slate-400">{label}</span>
      <input className="field" value={value} defaultValue={defaultValue} onChange={(event) => onChange?.(event.target.value)} />
    </label>
  );
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-slate-400">{label}</span>
      <textarea className="field min-h-24 resize-y" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-panel2 text-slate-200 hover:bg-white hover:text-ink" onClick={onClick} title={label} aria-label={label}>
      {children}
    </button>
  );
}

function CalendarLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between rounded-md border border-line bg-panel2 px-2 py-1">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function BarPanel({ title, data }: { title: string; data: { label: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((item) => item.count));
  return (
    <Card>
      <SectionTitle title={title} />
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex justify-between gap-3 text-sm">
              <span>{item.label}</span>
              <span className="text-slate-400">{item.count}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-blue" style={{ width: `${(item.count / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
