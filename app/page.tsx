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
  status: "Ідея" | "Підготувати" | "Записати" | "Змонтовано" | "Опубліковано";
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

type CrmSnapshot = {
  leads: Lead[];
  tasks: Task[];
  contentItems: ContentItem[];
  templates: Template[];
  history: HistoryItem[];
};

type ContentRow = Omit<ContentItem, "CTA"> & { cta: string };

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

const packages = [
  { name: "Медійний візит Hugo", value: 300 },
  { name: "Місячна медіасерія", value: 1000 },
  { name: "Повна медійна присутність", value: 2000 },
  { name: "Тематичне партнерство", value: 0 }
];

const today = "2026-06-21";
const tomorrow = "2026-06-22";
const storageKey = "hugo-media-sales-os:v1";

const leadOneId = "11111111-1111-4111-8111-111111111111";
const leadTwoId = "22222222-2222-4222-8222-222222222222";
const leadThreeId = "33333333-3333-4333-8333-333333333333";

const newId = () => crypto.randomUUID();

const addDays = (date: string, days: number) => {
  const next = new Date(`${date}T12:00:00`);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
};

const money = (value: number) =>
  value === 0 ? "індивідуально" : new Intl.NumberFormat("uk-UA").format(value) + " €";

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
    follow_up_date: today,
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
    last_contact_date: today,
    follow_up_date: tomorrow,
    next_action: "Скинути деталі пакета",
    source: "Рекомендація",
    notes: "Теплий лід, цікавиться коротким форматом.",
    created_at: "2026-06-19",
    updated_at: today
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
    due_date: today,
    status: "To do",
    priority: "High",
    created_at: today,
    updated_at: today
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    title: "Зробити follow-up після КП",
    description: "LegalWay Poland чекає на уточнення формату.",
    type: "follow_up",
    related_lead_id: leadOneId,
    due_date: today,
    status: "To do",
    priority: "High",
    created_at: today,
    updated_at: today
  },
  {
    id: "66666666-6666-4666-8666-666666666666",
    title: "Підготувати 1 контент-ролик",
    description: "Тема про довіру для українського бізнесу у Польщі.",
    type: "content",
    due_date: today,
    status: "In progress",
    priority: "Medium",
    created_at: today,
    updated_at: today
  },
  {
    id: "77777777-7777-4777-8777-777777777777",
    title: "Оновити CRM",
    description: "Записати відповіді та наступні дії.",
    type: "admin",
    due_date: today,
    status: "To do",
    priority: "Medium",
    created_at: today,
    updated_at: today
  }
];

const seedContent: ContentItem[] = [
  {
    id: "88888888-8888-4888-8888-888888888888",
    date: today,
    topic: "Чому українському бізнесу в Польщі потрібна довіра",
    hook: "Люди не купують у логотипу.",
    key_points: "Довіра, обличчя, історія, регулярна присутність.",
    CTA: "Напишіть Hugo, якщо бізнесу потрібна медійність.",
    target_niche: "Усі ніші",
    status: "Підготувати",
    platform: "Instagram",
    notes: "Зняти як короткий монолог."
  },
  {
    id: "99999999-9999-4999-8999-999999999999",
    date: tomorrow,
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
    created_at: today
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
  history: seedHistory
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
  return { ...rest, CTA: cta ?? "" };
}

function cleanTask(task: Task) {
  return { ...task, related_lead_id: task.related_lead_id || null };
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
    const [leads, tasks, contentItems, templates, history] = await Promise.all([
      supabaseRequest<Lead[]>(connection, "leads", "select=*&order=created_at.desc"),
      supabaseRequest<Task[]>(connection, "tasks", "select=*&order=due_date.asc"),
      supabaseRequest<ContentRow[]>(connection, "content_items", "select=*&order=date.asc"),
      supabaseRequest<Template[]>(connection, "templates", "select=*&order=created_at.desc"),
      supabaseRequest<HistoryItem[]>(connection, "status_history", "select=*&order=created_at.desc")
    ]);

    return {
      snapshot: {
        leads,
        tasks,
        contentItems: contentItems.map(rowToContent),
        templates,
        history
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

function syncSupabaseSnapshot(connection: SupabaseConnection, snapshot: CrmSnapshot) {
  void Promise.all([
    upsertRows(connection, "leads", snapshot.leads),
    upsertRows(connection, "tasks", snapshot.tasks.map(cleanTask)),
    upsertRows(connection, "content_items", snapshot.contentItems.map(contentToRow)),
    upsertRows(connection, "templates", snapshot.templates),
    upsertRows(connection, "status_history", snapshot.history)
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
          const nextSnapshot = remoteHasData ? remoteSnapshot : seedSnapshot;
          applySnapshot(nextSnapshot);
          writeLocalSnapshot(nextSnapshot);
          if (!remoteHasData) {
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
    const snapshot = { leads, tasks, contentItems, templates, history };
    writeLocalSnapshot(snapshot);

    if (!supabase || dataSource !== "supabase") return;
    const timer = window.setTimeout(() => syncSupabaseSnapshot(supabase, snapshot), 450);
    return () => window.clearTimeout(timer);
  }, [contentItems, dataSource, history, isHydrated, leads, tasks, templates]);

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
  const selectedLead = leads.find((lead) => lead.id === selectedLeadId) ?? null;
  const stats = {
    total: leads.length,
    contacted: leads.filter((lead) => ["Написав", "Відповів", "КП відправлено", "Думає", "Виграно"].includes(lead.status)).length,
    replies: leads.filter((lead) => ["Відповів", "КП відправлено", "Думає", "Виграно"].includes(lead.status)).length,
    proposals: leads.filter((lead) => lead.status === "КП відправлено").length,
    calls: leads.filter((lead) => lead.status === "Дзвінок заплановано").length,
    won: leads.filter((lead) => lead.status === "Виграно").length,
    pipeline: leads.filter((lead) => lead.status !== "Програно" && lead.status !== "Виграно").reduce((sum, lead) => sum + lead.deal_value, 0),
    revenue: leads.filter((lead) => lead.status === "Виграно").reduce((sum, lead) => sum + lead.deal_value, 0)
  };

  function updateLeadStatus(leadId: string, status: LeadStatus) {
    const baseDate = today;
    const followUpByStatus: Partial<Record<LeadStatus, string>> = {
      Написав: addDays(baseDate, 2),
      Відповів: addDays(baseDate, 1),
      "КП відправлено": addDays(baseDate, 1),
      Думає: addDays(baseDate, 3),
      Програно: addDays(baseDate, 30)
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

  function saveLead(lead: Lead) {
    setLeads((current) => {
      const exists = current.some((item) => item.id === lead.id);
      return exists
        ? current.map((item) => (item.id === lead.id ? { ...lead, updated_at: today } : item))
        : [{ ...lead, created_at: today, updated_at: today }, ...current];
    });
    setIsLeadFormOpen(false);
    setEditingLead(null);
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
      setActive("leads");
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
          <button className="text-left" onClick={() => { setActive("dashboard"); setSelectedLeadId(null); }}>
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
                onClick={() => { setActive(item.id); setSelectedLeadId(null); }}
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
            <p className="text-sm text-slate-400">Сьогодні: 21 червня 2026</p>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">{pageTitle}</h1>
            <p className="mt-2 text-xs text-slate-500">
              Дані: {dataSource === "supabase" ? "Supabase" : "локальне збереження у браузері"}
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
              onClick={() => setActive("tasks")}
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
            onBack={() => { setSelectedLeadId(null); setActive("leads"); }}
            onStatus={updateLeadStatus}
            onEdit={() => { setEditingLead(selectedLead); setIsLeadFormOpen(true); }}
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
          <Dashboard stats={stats} leads={leads} tasks={tasks} onDone={markTaskDone} onOpenLead={setSelectedLeadId} onStatus={updateLeadStatus} />
        ) : active === "leads" ? (
          <LeadsPage
            leads={filteredLeads}
            allLeads={leads}
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
            onStatus={updateLeadStatus}
          />
        ) : active === "tasks" ? (
          <TasksPage tasks={tasks} leads={leads} onDone={markTaskDone} setTasks={setTasks} />
        ) : active === "followups" ? (
          <FollowupsPage leads={leads} onDone={(id) => updateLeadStatus(id, "Проаналізований")} onOpen={setSelectedLeadId} />
        ) : active === "calendar" ? (
          <CalendarPage leads={leads} tasks={tasks} contentItems={contentItems} />
        ) : active === "content" ? (
          <ContentPage items={contentItems} setItems={setContentItems} />
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
          <SettingsPage />
        )}
      </section>

      {isLeadFormOpen && (
        <LeadForm
          lead={editingLead}
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

function Dashboard({ stats, leads, tasks, onDone, onOpenLead, onStatus }: {
  stats: Record<string, number>;
  leads: Lead[];
  tasks: Task[];
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
    ["Потенційний дохід", money(stats.pipeline)],
    ["Закритий дохід", money(stats.revenue)]
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
              money(lead.deal_value),
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
        <Select value={props.packageFilter} onChange={props.setPackageFilter} options={["Усі", ...packages.map((pkg) => pkg.name)]} />
      </div>
      <DataTable
        headers={["Бізнес", "Ніша", "Місто", "Контакт", "Статус", "Пакет", "Сума", "Дії"]}
        rows={props.leads.map((lead) => [
          <button key="name" className="font-semibold text-blue" onClick={() => props.onOpen(lead.id)}>{lead.business_name}</button>,
          lead.niche,
          lead.city,
          lead.contact_name,
          <Badge key="status" status={lead.status} />,
          lead.package_interest,
          money(lead.deal_value),
          <div key="actions" className="flex flex-wrap gap-1">
            {(["Написав", "Відповів", "КП відправлено", "Дзвінок заплановано", "Виграно", "Програно"] as LeadStatus[]).map((status) => (
              <button key={status} className="rounded-md border border-line px-2 py-1 text-xs text-slate-200 hover:bg-white hover:text-ink" onClick={() => props.onStatus(lead.id, status)}>
                {status}
              </button>
            ))}
            <IconButton label="Редагувати" onClick={() => props.onEdit(lead)}><Edit3 className="h-4 w-4" /></IconButton>
            <IconButton label="Видалити" onClick={() => props.onDelete(lead.id)}><Trash2 className="h-4 w-4" /></IconButton>
          </div>
        ])}
      />
    </Card>
  );
}

function LeadDetail({ lead, history, onBack, onStatus, onEdit, onTask }: {
  lead: Lead;
  history: HistoryItem[];
  onBack: () => void;
  onStatus: (id: string, status: LeadStatus) => void;
  onEdit: () => void;
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
    ["Сума", money(lead.deal_value)],
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

function TasksPage({ tasks, leads, onDone, setTasks }: { tasks: Task[]; leads: Lead[]; onDone: (id: string) => void; setTasks: React.Dispatch<React.SetStateAction<Task[]>> }) {
  const [typeFilter, setTypeFilter] = useState("Усі");
  const [statusFilter, setStatusFilter] = useState("Усі");
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
            onClick={() =>
              setTasks((current) => [
                {
                  id: newId(),
                  title: "Нова задача",
                  description: "Опишіть дію",
                  type: "admin",
                  due_date: today,
                  status: "To do",
                  priority: "Medium",
                  created_at: today,
                  updated_at: today
                },
                ...current
              ])
            }
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
              task.status,
              task.priority,
              <IconButton key="done" label="Виконано" onClick={() => onDone(task.id)}><Check className="h-4 w-4" /></IconButton>
            ])}
          />
        </Card>
      ))}
    </div>
  );
}

function FollowupsPage({ leads, onDone, onOpen }: { leads: Lead[]; onDone: (id: string) => void; onOpen: (id: string) => void }) {
  const items = leads.filter((lead) => lead.follow_up_date && lead.status !== "Виграно");
  return (
    <Card>
      <SectionTitle title="Усі follow-up" />
      <DataTable
        headers={["Бізнес", "Ніша", "Місто", "Статус", "Наступна дія", "Дата", ""]}
        rows={items.map((lead) => [
          <button key="name" className="font-semibold text-blue" onClick={() => onOpen(lead.id)}>{lead.business_name}</button>,
          lead.niche,
          lead.city,
          <Badge key="status" status={lead.status} />,
          lead.next_action,
          lead.follow_up_date,
          <IconButton key="done" label="Виконано" onClick={() => onDone(lead.id)}><Check className="h-4 w-4" /></IconButton>
        ])}
      />
    </Card>
  );
}

function CalendarPage({ leads, tasks, contentItems }: { leads: Lead[]; tasks: Task[]; contentItems: ContentItem[] }) {
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

function ContentPage({ items, setItems }: { items: ContentItem[]; setItems: React.Dispatch<React.SetStateAction<ContentItem[]>> }) {
  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SectionTitle title="Контент-план" />
        <button
          className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-white px-4 font-semibold text-ink"
          onClick={() =>
            setItems((current) => [
              {
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
              },
              ...current
            ])
          }
        >
          <Plus className="h-4 w-4" />
          Додати
        </button>
      </div>
      <DataTable
        headers={["Дата", "Тема", "Хук", "Ключові пункти", "CTA", "Ніша", "Статус", "Платформа", "Нотатки"]}
        rows={items.map((item) => [item.date, item.topic, item.hook, item.key_points, item.CTA, item.target_niche, item.status, item.platform, item.notes])}
      />
    </Card>
  );
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
        onClick={() => setTemplates((current) => [{ id: newId(), title: "Новий шаблон", category: "Перше повідомлення", body: "" }, ...current])}
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
                    <IconButton label="Редагувати" onClick={() => setEditing(template)}><Edit3 className="h-4 w-4" /></IconButton>
                    <IconButton label="Видалити" onClick={() => onDelete(template.id)}><Trash2 className="h-4 w-4" /></IconButton>
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
          ["Потенційний дохід", money(leads.reduce((sum, lead) => sum + lead.deal_value, 0))],
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

function SettingsPage() {
  const kpis = ["10 нових лідів", "10 перших повідомлень", "5 follow-up", "1 контент-одиниця", "1 година CRM / продажів"];
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card>
        <SectionTitle title="Проєкт" />
        <div className="space-y-3">
          <Input label="Назва проєкту" defaultValue="Hugo Media Sales OS" />
          <Input label="Власник" defaultValue="Сергій Гальчук / Hugo" />
          <Input label="Email" defaultValue="hugo@example.com" />
          <Input label="Валюта" defaultValue="EUR" />
        </div>
      </Card>
      <Card>
        <SectionTitle title="KPI на день" />
        <div className="space-y-2">
          {kpis.map((kpi) => (
            <label key={kpi} className="flex items-center gap-3 rounded-lg border border-line bg-panel2 p-3">
              <input type="checkbox" className="h-4 w-4 accent-blue" defaultChecked />
              <span>{kpi}</span>
            </label>
          ))}
        </div>
      </Card>
      <Card>
        <SectionTitle title="Пакети" />
        <div className="space-y-2">{packages.map((pkg) => <Input key={pkg.name} label={pkg.name} defaultValue={money(pkg.value)} />)}</div>
      </Card>
      <Card>
        <SectionTitle title="Статуси та ніші" />
        <p className="text-sm leading-6 text-slate-300">{statuses.join(" · ")}</p>
        <p className="mt-4 text-sm leading-6 text-slate-300">{niches.join(" · ")}</p>
      </Card>
    </div>
  );
}

function LeadForm({ lead, onClose, onSave }: { lead: Lead | null; onClose: () => void; onSave: (lead: Lead) => void }) {
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
      package_interest: packages[0].name,
      deal_value: 300,
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
          <Select label="Пакет" value={form.package_interest} onChange={(value) => setField("package_interest", value)} options={packages.map((pkg) => pkg.name)} />
          <Input label="Сума" value={String(form.deal_value)} onChange={(value) => setField("deal_value", Number(value) || 0)} />
          <Input label="Follow-up date" value={form.follow_up_date} onChange={(value) => setField("follow_up_date", value)} />
          <Textarea label="Слабке місце" value={form.weak_point} onChange={(value) => setField("weak_point", value)} />
          <Textarea label="Кут офферу" value={form.offer_angle} onChange={(value) => setField("offer_angle", value)} />
          <Textarea label="Наступна дія" value={form.next_action} onChange={(value) => setField("next_action", value)} />
          <Textarea label="Нотатки" value={form.notes} onChange={(value) => setField("notes", value)} />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="rounded-lg border border-line px-4 py-2 font-semibold" onClick={onClose}>Скасувати</button>
          <button className="rounded-lg bg-white px-4 py-2 font-semibold text-ink" onClick={() => onSave(form)}>Зберегти</button>
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
      <Input label="Категорія" value={draft.category} onChange={(value) => setDraft((current) => ({ ...current, category: value }))} />
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
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} className="border-b border-line px-3 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="align-top">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="border-b border-line/70 px-3 py-3 text-slate-200">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
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
