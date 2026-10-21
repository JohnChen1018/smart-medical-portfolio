import { NextRequest, NextResponse } from "next/server";
import { readRecentSync, syncRecentPapers } from "@/lib/research/recentPapers";
import { isDirectLocalRequest, localOnlyResponse } from "@/lib/security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isDirectLocalRequest(request)) return localOnlyResponse();
  const topicId = request.nextUrl.searchParams.get("topicId") || "survey-paper";
  const cached = readRecentSync(topicId);
  if (!cached) return NextResponse.json({ ok: true, papers: [], dir: "", cached: false });
  return NextResponse.json({ ok: true, papers: cached.papers, dir: cached.dir, syncedAt: cached.syncedAt, cached: true });
}

export async function POST(request: NextRequest) {
  if (!isDirectLocalRequest(request)) return localOnlyResponse();
  const body = (await request.json().catch(() => ({}))) as {
    topicId?: string;
    force?: boolean;
    queries?: string[];
    aiTerms?: string[];
    taskTerms?: string[];
  };
  const topicId = body.topicId || "survey-paper";
  const queries = Array.isArray(body.queries) ? body.queries.filter((query) => typeof query === "string") : undefined;
  const aiTerms = Array.isArray(body.aiTerms) ? body.aiTerms.filter((term) => typeof term === "string") : [];
  const taskTerms = Array.isArray(body.taskTerms) ? body.taskTerms.filter((term) => typeof term === "string") : undefined;
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
      };
      try {
        const result = await syncRecentPapers(topicId, Boolean(body.force), queries, (text) => {
          send({ type: "step", text });
        }, aiTerms, taskTerms);
        send({ type: "done", ...result, syncedAt: result.syncedAt || new Date().toISOString() });
      } catch (error) {
        send({ type: "error", error: error instanceof Error ? error.message : "同步失敗" });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
