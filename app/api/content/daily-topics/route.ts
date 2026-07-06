import { generateDailyTopics } from "@/lib/daily-topics";

export const maxDuration = 60;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const cronSecret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const isManual = url.searchParams.get("manual") === "1";

  if (cronSecret && !isManual && auth !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const sendTelegram = url.searchParams.get("send") === "telegram";
    const run = await generateDailyTopics({ sendTelegram });
    return Response.json({ ok: true, run });
  } catch (error) {
    console.error("Daily topics generation failed", error);
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
