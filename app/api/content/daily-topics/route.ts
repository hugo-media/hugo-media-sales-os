import { generateDailyTopics } from "@/lib/daily-topics";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

async function handleGenerate(request: Request) {
  const url = new URL(request.url);
  const cronSecret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const isManual = url.searchParams.get("manual") === "1";

  if (cronSecret && !isManual && auth !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const sendTelegram = url.searchParams.get("send") === "telegram";
    const focusKey = url.searchParams.get("focus") || "all";
    const run = await generateDailyTopics({ sendTelegram, requireReady: isManual, focusKey });
    return Response.json(
      { ok: true, run },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("Daily topics generation failed", error);
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
}

export async function GET(request: Request) {
  return handleGenerate(request);
}

export async function POST(request: Request) {
  return handleGenerate(request);
}
