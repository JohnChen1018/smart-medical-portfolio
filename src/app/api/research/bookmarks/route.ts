import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalSession } from "@/lib/portal-auth";

export const dynamic = "force-dynamic";

function accountKey(session: { accountId: string } | null) {
  return session?.accountId || "local";
}

export async function GET(request: NextRequest) {
  const session = await getPortalSession();
  const topicId = new URL(request.url).searchParams.get("topicId") || undefined;
  const accountId = accountKey(session);

  const rows = await prisma.researchBookmark.findMany({
    where: {
      accountId,
      ...(topicId ? { topicId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({
    ok: true,
    accountId,
    bookmarks: rows.map((r) => ({
      ...r,
      authors: safeJsonArray(r.authors),
    })),
  });
}

export async function POST(request: NextRequest) {
  const session = await getPortalSession();
  const accountId = accountKey(session);
  const body = await request.json();

  const title = String(body.title || "").trim();
  const url = String(body.url || "").trim();
  const source = String(body.source || "manual").trim();
  const externalId = String(body.externalId || url || title).trim().slice(0, 240);
  if (!title || !url) {
    return NextResponse.json({ ok: false, error: "標題與網址必填" }, { status: 400 });
  }

  const row = await prisma.researchBookmark.upsert({
    where: {
      accountId_source_externalId: { accountId, source, externalId },
    },
    create: {
      accountId,
      topicId: String(body.topicId || "survey-paper"),
      source,
      externalId,
      kind: String(body.kind || "paper"),
      title,
      doi: body.doi ? String(body.doi) : null,
      pmid: body.pmid ? String(body.pmid) : null,
      url,
      authors: JSON.stringify(Array.isArray(body.authors) ? body.authors : []),
      year: body.year ? String(body.year) : null,
      abstract: body.abstract ? String(body.abstract).slice(0, 4000) : null,
      notes: body.notes ? String(body.notes).slice(0, 2000) : null,
    },
    update: {
      title,
      url,
      doi: body.doi ? String(body.doi) : null,
      pmid: body.pmid ? String(body.pmid) : null,
      kind: String(body.kind || "paper"),
      topicId: String(body.topicId || "survey-paper"),
      authors: JSON.stringify(Array.isArray(body.authors) ? body.authors : []),
      year: body.year ? String(body.year) : null,
      abstract: body.abstract ? String(body.abstract).slice(0, 4000) : null,
      notes: body.notes ? String(body.notes).slice(0, 2000) : null,
    },
  });

  return NextResponse.json({
    ok: true,
    bookmark: { ...row, authors: safeJsonArray(row.authors) },
  });
}

function safeJsonArray(raw: string) {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
