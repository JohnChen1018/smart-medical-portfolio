import { NextResponse } from "next/server";
import { getMedicalProjectSummaries } from "@/lib/portal-admin";

export async function GET() {
  const projects = await getMedicalProjectSummaries();
  return NextResponse.json({ projects }, { headers: { "Cache-Control": "private, max-age=30" } });
}
