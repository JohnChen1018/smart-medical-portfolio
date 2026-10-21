"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ProjectSummaryGrid, statusToneFor, type ProjectCard } from "@/components/projects/ProjectSummaryGrid";
import { statusCounts, StatusFilter } from "@/components/projects/StatusFilter";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { statusLabel, workCopy } from "@/lib/i18n/copy";

export default function Home() {
  const [role, setRole] = useState<"guest" | "user" | null>(null);
  const [ready, setReady] = useState(false);
  const [showGuestDialog, setShowGuestDialog] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginStep, setLoginStep] = useState<"password" | "code" | "setup">("password");
  const [otp, setOtp] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [manualSecret, setManualSecret] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState<ProjectCard[]>([]);
  const [canAdmin, setCanAdmin] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const { t } = useI18n();

  useEffect(() => {
    const savedRole = window.localStorage.getItem("medical-portfolio-role");

    fetch("/api/portal/session", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        const ok = Boolean(data.authenticated && data.canAccessAdmin);
        setCanAdmin(ok);
        if (savedRole === "user" && !ok) {
          window.localStorage.removeItem("medical-portfolio-role");
          setRole(null);
          return;
        }
        if (savedRole === "guest" || savedRole === "user") {
          setRole(savedRole);
        }
      })
      .catch(() => {
        if (savedRole === "guest" || savedRole === "user") setRole(savedRole);
      });

    fetch("/api/public/projects")
      .then((r) => r.json())
      .then((d) => setProjects(d.projects || []))
      .catch(() => setProjects([]));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!showGuestDialog && !showUserDialog) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setShowGuestDialog(false);
      setShowUserDialog(false);
      setError("");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showGuestDialog, showUserDialog]);

  const enterGuest = async (e: FormEvent) => {
    e.preventDefault();
    const name = guestName.trim();
    if (!name) {
      setError(t.home.needName);
      return;
    }
    setError("");
    const res = await fetch("/api/portal/guest-enter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: name }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || t.home.enterFailed);
      return;
    }
    window.localStorage.setItem("medical-portfolio-role", "guest");
    window.localStorage.setItem("medical-portfolio-guest-id", data.guestId);
    window.localStorage.setItem("medical-portfolio-guest-name", name);
    window.dispatchEvent(new Event("medical-portfolio-role-change"));
    setRole("guest");
    setShowGuestDialog(false);
    setGuestName("");
  };

  const closeLogin = () => {
    setShowUserDialog(false);
    setError("");
    setLoginStep("password");
    setOtp("");
    setRecoveryCodes([]);
  };

  const loginUser = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/portal/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        username,
        password,
        code: loginStep === "password" ? undefined : otp,
      }),
    });
    const data = await res.json();
    if (data.qrCodeUrl) setQrCodeUrl(data.qrCodeUrl);
    if (data.secret) setManualSecret(data.secret);
    if (Array.isArray(data.recoveryCodes)) setRecoveryCodes(data.recoveryCodes.filter((item: unknown) => typeof item === "string"));
    if (data.step === "setup" || data.step === "code") {
      setLoginStep(data.step);
      setOtp("");
      if (!res.ok) setError(data.error || t.home.loginFailed);
      return;
    }
    if (!res.ok) {
      setError(data.error || t.home.loginFailed);
      return;
    }
    window.localStorage.setItem("medical-portfolio-role", "user");
    window.dispatchEvent(new Event("medical-portfolio-role-change"));
    setRole("user");
    setCanAdmin(Boolean(data.canAccessAdmin));
    setShowUserDialog(false);
    setPassword("");
    setLoginStep("password");
    setOtp("");
    setRecoveryCodes([]);
  };

  return (
    <div className="min-h-screen bg-[#0B0F14] text-[#E6EDF3]">
      {!ready && (
        <div className="flex min-h-[calc(100vh-73px)] items-center justify-center">
          <p className="text-sm text-[#9CA3AF]">{t.home.loading}</p>
        </div>
      )}

      {ready && !role && (
        <section className="px-6 py-10 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-4xl font-black leading-tight md:text-5xl">{t.home.welcome}</h1>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowGuestDialog(true);
                  setError("");
                }}
                className="rounded-full bg-[#4ADE80] px-6 py-3 text-lg font-black text-[#0B0F14] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4ADE80]"
              >
                {t.home.look}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUserDialog(true);
                  setError("");
                }}
                className="rounded-full border border-[#1F2937] bg-[#111827] px-6 py-3 text-lg font-bold text-[#E6EDF3] hover:border-[#4ADE80]/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4ADE80]"
              >
                {t.home.manage}
              </button>
            </div>
            <ul className="mt-8 flex flex-col gap-2">
              {projects.map((project) => {
                const tone = statusToneFor(project.status);
                return (
                <li key={project.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowGuestDialog(true);
                      setError("");
                    }}
                    className={`flex w-full items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-left transition-colors hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4ADE80] ${tone.card}`}
                  >
                    <span>
                      <span className="block text-lg font-bold">{workCopy(t, project.id, project).title}</span>
                      <span className="mt-1 block text-sm text-[#9CA3AF]">{project.id === "face" ? t.about.empty : workCopy(t, project.id, project).description}</span>
                    </span>
                    <span className={`flex shrink-0 items-center gap-2 text-base font-bold ${tone.text}`}>
                      <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
                      {statusLabel(t, project.status)}
                    </span>
                  </button>
                </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {showGuestDialog && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target !== event.currentTarget) return;
            setShowGuestDialog(false);
            setError("");
          }}
        >
          <form onSubmit={enterGuest} role="dialog" aria-modal="true" aria-labelledby="guest-title" className="w-full max-w-md rounded-3xl border border-[#1F2937] bg-[#0B0F14] p-7">
            <h2 id="guest-title" className="text-2xl font-black">{t.home.nameTitle}</h2>
            <label className="mt-6 block text-sm font-semibold text-[#C4B5FD]" htmlFor="guest-name">{t.home.nameLabel}</label>
            <input
              id="guest-name"
              className="mt-2 w-full rounded-2xl border border-[#1F2937] bg-[#111827] px-4 py-3 outline-none focus:border-[#8B5CF6]"
              placeholder={t.home.namePlaceholder}
              maxLength={40}
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              autoFocus
            />
            {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setShowGuestDialog(false)} className="rounded-2xl border border-[#1F2937] py-3 text-[#9CA3AF]">
                {t.home.cancel}
              </button>
              <button type="submit" className="rounded-2xl bg-[#8B5CF6] py-3 font-bold text-white">
                {t.home.start}
              </button>
            </div>
          </form>
        </div>
      )}

      {showUserDialog && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target !== event.currentTarget) return;
            closeLogin();
          }}
        >
          <form onSubmit={loginUser} role="dialog" aria-modal="true" aria-labelledby="login-title" className="w-full max-w-md rounded-3xl border border-[#1F2937] bg-[#0B0F14] p-7">
            <h2 id="login-title" className="text-2xl font-black">
              {loginStep === "setup" ? t.home.setupTitle : loginStep === "code" ? t.home.codeTitle : t.home.loginTitle}
            </h2>
            {loginStep === "password" && (
              <>
                <label className="mt-6 block text-sm font-semibold text-[#4ADE80]" htmlFor="login-user">{t.home.username}</label>
                <input
                  id="login-user"
                  className="mt-2 w-full rounded-2xl border border-[#1F2937] bg-[#111827] px-4 py-3 outline-none focus:border-[#4ADE80]"
                  placeholder={t.home.username}
                  autoComplete="username"
                  maxLength={80}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                />
                <label className="mt-3 block text-sm font-semibold text-[#4ADE80]" htmlFor="login-pass">{t.home.password}</label>
                <input
                  id="login-pass"
                  type="password"
                  autoComplete="current-password"
                  className="mt-2 w-full rounded-2xl border border-[#1F2937] bg-[#111827] px-4 py-3 outline-none focus:border-[#4ADE80]"
                  placeholder={t.home.password}
                  maxLength={200}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </>
            )}
            {loginStep !== "password" && (
              <>
                {loginStep === "setup" && qrCodeUrl && (
                  <img src={qrCodeUrl} alt="" className="mx-auto mt-4 h-44 w-44 rounded-2xl bg-white p-2" />
                )}
                {loginStep === "setup" && <p className="mt-3 text-sm text-[#9CA3AF]">{t.home.setupHint}</p>}
                {loginStep === "setup" && manualSecret && (
                  <p className="mt-2 break-all text-xs text-[#BFD2EA]">{manualSecret}</p>
                )}
                {loginStep === "setup" && recoveryCodes.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-[#9CA3AF]">{t.home.recoveryHint}</p>
                    <ul className="mt-2 grid grid-cols-2 gap-1 text-xs text-[#E6EDF3]">
                      {recoveryCodes.map((item) => (
                        <li key={item} className="rounded-lg bg-[#111827] px-2 py-1 font-mono">{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <label className="mt-4 block text-sm font-semibold text-[#4ADE80]" htmlFor="login-code">{t.home.codeLabel}</label>
                <input
                  id="login-code"
                  inputMode={loginStep === "setup" ? "numeric" : "text"}
                  autoComplete="one-time-code"
                  className="mt-2 w-full rounded-2xl border border-[#1F2937] bg-[#111827] px-4 py-3 tracking-[0.3em] outline-none focus:border-[#4ADE80]"
                  maxLength={loginStep === "setup" ? 6 : 8}
                  value={otp}
                  onChange={(e) => {
                    const raw = loginStep === "setup"
                      ? e.target.value.replace(/\D/g, "")
                      : e.target.value.replace(/[^a-zA-Z0-9]/g, "");
                    setOtp(raw.slice(0, loginStep === "setup" ? 6 : 8));
                  }}
                  autoFocus
                />
              </>
            )}
            {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" onClick={closeLogin} className="rounded-2xl border border-[#1F2937] py-3 text-[#9CA3AF]">
                {t.home.cancel}
              </button>
              <button type="submit" className="rounded-2xl bg-[#4ADE80] py-3 font-bold text-[#0B0F14]">
                {loginStep === "password" ? t.home.login : t.home.confirm}
              </button>
            </div>
          </form>
        </div>
      )}

      {ready && role && (
        <section id="project-status" className="px-6 py-8 lg:px-8">
          <div className="mx-auto mb-6 flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-3xl font-black">{t.home.works}</h2>
              {role === "user" && canAdmin && (
                <Link href="/admin" className="rounded-full bg-[#4ADE80] px-4 py-2 text-base font-bold text-[#0B0F14]">
                  {t.home.openAdmin}
                </Link>
              )}
            </div>
            <StatusFilter value={statusFilter} onChange={setStatusFilter} counts={statusCounts(projects)} />
          </div>
          <div className="mx-auto max-w-7xl">
            <ProjectSummaryGrid
              projects={projects.filter((project) => statusFilter === "all" || project.status === statusFilter)}
            />
          </div>
          {projects.filter((project) => statusFilter === "all" || project.status === statusFilter).length === 0 && (
            <div className="mx-auto max-w-7xl rounded-2xl border border-dashed border-[#374151] bg-[#111827]/20 py-16 text-center">
              <p className="text-lg text-[#9CA3AF]">{t.home.emptyCategory}</p>
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className="mt-4 text-base font-semibold text-[#4ADE80] hover:underline"
              >
                {t.home.seeAll}
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
