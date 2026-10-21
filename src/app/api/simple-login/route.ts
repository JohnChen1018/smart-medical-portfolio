import { NextResponse } from "next/server";
import { createSession, setSessionCookie } from "@/lib/server-auth";
import { rolePassword } from "@/lib/medicalPortfolio";
import { allowRequest, clientAddress } from "@/lib/security";

export async function POST(request: Request) {
  if (!allowRequest(`simple-login:${clientAddress(request)}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ success: false, error: "嘗試太多次，請稍後再試" }, { status: 429 });
  }
  try {
    const { password } = await request.json();

    if (password !== rolePassword) {
      return NextResponse.json(
        { success: false, error: "密碼錯誤。" },
        { status: 401 },
      );
    }

    const session = await createSession("medical-portfolio-user");
    const response = NextResponse.json({ success: true });
    response.headers.set("Set-Cookie", await setSessionCookie(session));

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: "登入失敗。" },
      { status: 500 },
    );
  }
}
