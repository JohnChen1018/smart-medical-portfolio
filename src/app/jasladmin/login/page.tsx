"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/simple-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "密碼錯誤，請重新輸入。");
        setPassword("");
        return;
      }

      window.location.href = "/jasladmin/dashboard";
    } catch {
      setError("登入失敗，請稍後再試。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#07111F] via-[#0B0F14] to-[#071B2A] p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(74,222,128,0.12),transparent_60%)]" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-[#1F2937] bg-[#0B0F14]/90 p-8 shadow-2xl backdrop-blur-xl">
        <Link
          href="/"
          className="mb-8 inline-flex text-sm text-[#9CA3AF] transition hover:text-[#4ADE80]"
        >
          ← 回到網站
        </Link>

        <p className="mb-3 text-xs font-mono uppercase tracking-[0.3em] text-[#4ADE80]">
          User Access
        </p>
        <h1 className="text-3xl font-black text-[#E6EDF3]">
          使用者登入
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#9CA3AF]">
          請輸入使用者密碼。訪客只能觀看，使用者登入後可進入後台修改作品、CV 與進度內容。
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#E6EDF3]">
              密碼
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="請輸入密碼"
              className="w-full rounded-2xl border border-[#1F2937] bg-[#0D1117] px-4 py-3 text-[#E6EDF3] outline-none transition placeholder:text-[#6B7280] focus:border-[#4ADE80]"
              autoFocus
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full justify-center"
            disabled={isLoading || password.length === 0}
          >
            {isLoading ? "登入中..." : "登入並進入後台"}
          </Button>
        </form>

      </div>
    </div>
  );
}
