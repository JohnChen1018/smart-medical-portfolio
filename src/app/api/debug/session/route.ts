import { NextResponse } from "next/server";

/** 不提供偵錯用的 cookie 內容。 */
export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
