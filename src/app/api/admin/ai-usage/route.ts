import { NextResponse } from "next/server";
import { getPortalSession } from "@/lib/portal-auth";
import { getAllProviderUsage, getUsageHistory } from "@/lib/aiTokenUsage";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getPortalSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ ok: false, error: "未授權" }, { status: 401 });
  }
  const today = await getAllProviderUsage();
  const history = await getUsageHistory(14);
  return NextResponse.json({ ok: true, ...today, history });
}
