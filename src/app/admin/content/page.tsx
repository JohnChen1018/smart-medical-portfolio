"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge } from "@/components/ui/Badge";
import { AdminApplicationCardsEditor } from "@/components/admin/AdminApplicationCardsEditor";
import {
  getWorkflowContent,
  projectStatusLabels,
  projectStatusMeta,
  updateWorkflowContent,
  workflowSteps,
} from "@/lib/medicalPortfolio";
import type { Project } from "@/lib/types";
import type { ProjectSummary } from "@/lib/portal-admin";
import type { ProjectWithDashboard } from "@/lib/wsiCms";
import { wsiMeta } from "@/lib/wsiDashboard";

function cloneProjects(list: Project[]) {
  return JSON.parse(JSON.stringify(list)) as ProjectWithDashboard[];
}

function EditableText({
  value,
  onChange,
  className = "",
  multiline = false,
  as: Tag = "span",
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  multiline?: boolean;
  as?: "span" | "p" | "h1" | "h2" | "h3";
}) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (editing && ref.current) ref.current.focus();
  }, [editing]);

  if (editing) {
    return (
      <Tag
        ref={ref as never}
        contentEditable
        suppressContentEditableWarning
        className={`outline-none ring-2 ring-[#4ADE80]/50 rounded ${className}`}
        onBlur={(e) => {
          onChange(e.currentTarget.textContent || "");
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (!multiline && e.key === "Enter") {
            e.preventDefault();
            (e.target as HTMLElement).blur();
          }
        }}
      >
        {value}
      </Tag>
    );
  }

  return (
    <Tag
      role="button"
      tabIndex={0}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => e.key === "Enter" && setEditing(true)}
      className={`cursor-text rounded transition hover:ring-1 hover:ring-[#4ADE80]/40 ${className}`}
      title="點一下編輯"
    >
      {value || "（點此輸入）"}
    </Tag>
  );
}

export default function ContentPage() {
  const [summaries, setSummaries] = useState<ProjectSummary[]>([]);
  const [projects, setProjects] = useState<ProjectWithDashboard[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [workflow, setWorkflow] = useState(workflowSteps[0].key);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [msg, setMsg] = useState("");
  const [dirty, setDirty] = useState(false);
  const [undoStack, setUndoStack] = useState<ProjectWithDashboard[][]>([]);
  const initialRef = useRef<ProjectWithDashboard[]>([]);

  const selected = projects.find((p) => p.id === selectedId) ?? null;
  const selectedIndex = projects.findIndex((p) => p.id === selectedId);

  const pushUndo = useCallback((snapshot: ProjectWithDashboard[]) => {
    setUndoStack((prev) => [...prev.slice(-19), cloneProjects(snapshot)]);
  }, []);

  const mergeProject = useCallback((project: ProjectWithDashboard) => {
    setProjects((prev) => {
      const idx = prev.findIndex((p) => p.id === project.id);
      if (idx === -1) return [...prev, project];
      const next = [...prev];
      next[idx] = project;
      return next;
    });
    setSummaries((prev) =>
      prev.map((s) =>
        s.id === project.id
          ? {
              ...s,
              title: project.title,
              description: project.description,
              category: project.category,
              status: project.status,
              imageUrl: project.imageUrl,
            }
          : s,
      ),
    );
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    setSelectedId(id);
    if (projects.some((p) => p.id === id)) return;
    setLoadingDetail(true);
    const res = await fetch(`/api/admin/content?id=${encodeURIComponent(id)}`, {
      credentials: "include",
    });
    const data = await res.json();
    if (data.project) mergeProject(data.project);
    setLoadingDetail(false);
  }, [mergeProject, projects]);

  useEffect(() => {
    fetch("/api/admin/content?summary=1", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const list: ProjectSummary[] = d.projects || [];
        setSummaries(list);
        if (list[0]) setSelectedId(list[0].id);
        setLoadingList(false);
      });

    fetch("/api/admin/content", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.projects?.length) return;
        const full = cloneProjects(d.projects);
        initialRef.current = full;
        setProjects(full);
        setLoadingDetail(false);
      });
  }, []);

  const patchSelected = (patch: Partial<ProjectWithDashboard>) => {
    if (selectedIndex < 0) return;
    pushUndo(projects);
    const next = cloneProjects(projects);
    next[selectedIndex] = { ...next[selectedIndex], ...patch };
    setProjects(next);
    setSummaries((prev) =>
      prev.map((s) => (s.id === next[selectedIndex].id ? { ...s, ...patch } : s)),
    );
    setDirty(true);
  };

  const patchWorkflow = (body: string) => {
    if (!selected) return;
    pushUndo(projects);
    const content = updateWorkflowContent(selected, workflow, body);
    const next = cloneProjects(projects);
    const idx = next.findIndex((p) => p.id === selected.id);
    next[idx] = { ...next[idx], content };
    setProjects(next);
    setDirty(true);
  };

  const undoStep = () => {
    if (undoStack.length === 0) {
      setMsg("沒有上一步可還原");
      return;
    }
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setProjects(prev);
    setSummaries(
      prev.map(({ id, title, description, category, status, imageUrl, displayOrder }) => ({
        id,
        title,
        description,
        category,
        status,
        imageUrl,
        displayOrder,
      })),
    );
    setDirty(true);
    setMsg("已還原上一步");
  };

  const resetAll = () => {
    if (initialRef.current.length === 0) {
      setMsg("尚無法還原，請稍候載入完成");
      return;
    }
    pushUndo(projects);
    const initial = cloneProjects(initialRef.current);
    setProjects(initial);
    setSummaries(
      initial.map(({ id, title, description, category, status, imageUrl, displayOrder }) => ({
        id,
        title,
        description,
        category,
        status,
        imageUrl,
        displayOrder,
      })),
    );
    setDirty(true);
    setMsg("已一鍵還原到最初內容（尚未儲存）");
  };

  const save = async () => {
    if (projects.length === 0) {
      setMsg("作品尚未載入完成，請稍候再儲存");
      return;
    }
    setMsg("儲存中…");
    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projects, autoBackup: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(`儲存失敗：${data.error || res.statusText || "未知錯誤"}`);
        return;
      }
      initialRef.current = cloneProjects(projects);
      setUndoStack([]);
      setDirty(false);
      setMsg(
        data.backup?.started
          ? "已儲存並寫入操作紀錄！訪客重新整理可見；並已在背景自動備份"
          : "已儲存並寫入操作紀錄！訪客重新整理後會看到更新",
      );
      if (data.backup?.started) sessionStorage.setItem("backup-running", "1");
    } catch (e) {
      setMsg(`儲存失敗：${e instanceof Error ? e.message : "網路錯誤"}`);
    }
  };

  if (loadingList) {
    return <p className="text-slate-400">載入作品列表…</p>;
  }

  const statusMeta = selected
    ? projectStatusMeta[selected.status] ?? projectStatusMeta["in-progress"]
    : projectStatusMeta["in-progress"];
  const workflowContent = selected ? getWorkflowContent(selected, workflow) : null;
  const currentStep = workflowSteps.find((s) => s.key === workflow);

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700 bg-[#0f172a]/95 px-4 py-3 backdrop-blur">
        <div>
          <h1 className="text-xl font-bold">內容修改</h1>
          <p className="text-xs text-slate-400">點文字編輯 · 各流程 Markdown 與前台卡片都在此</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-slate-600 px-3 py-2 text-sm hover:bg-slate-800">
            開啟前台 ↗
          </a>
          <button type="button" disabled={undoStack.length === 0} onClick={undoStep} className="rounded-lg border border-slate-600 px-3 py-2 text-sm hover:bg-slate-800 disabled:opacity-40">
            還原上一步
          </button>
          <button type="button" onClick={resetAll} className="rounded-lg border border-amber-600/50 px-3 py-2 text-sm text-amber-300 hover:bg-amber-500/10">
            一鍵還原
          </button>
          <button type="button" disabled={!dirty || projects.length === 0} onClick={save} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold hover:bg-emerald-500 disabled:opacity-40">
            儲存變更
          </button>
        </div>
      </div>

      {msg && <p className="text-sm text-emerald-300">{msg}</p>}
      {dirty && <p className="text-sm text-amber-300">● 有未儲存的變更</p>}

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <div className="space-y-2 rounded-xl border border-[#1F2937] bg-[#0B0F14] p-2">
          <p className="px-2 pt-1 text-xs text-[#8B5CF6]">選擇題目</p>
          {summaries.map((item) => {
            const meta = projectStatusMeta[item.status] ?? projectStatusMeta["in-progress"];
            const active = item.id === selectedId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => loadDetail(item.id)}
                className={`w-full rounded-xl border p-2 text-left transition ${active ? "border-[#4ADE80] bg-[#111827]" : "border-[#1F2937] hover:border-[#4ADE80]/40"}`}
              >
                <div className="relative mb-2 h-16 overflow-hidden rounded-lg bg-[#111827]">
                  <Image
                    src={item.imageUrl || "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400&h=200&fit=crop"}
                    alt={item.title}
                    fill
                    className="object-cover opacity-80"
                    unoptimized
                    sizes="200px"
                  />
                  <span className={`absolute right-1 top-1 rounded-full border px-1.5 text-[10px] ${meta.bg} ${meta.border} ${meta.text}`}>
                    {projectStatusLabels[item.status] ?? meta.label}
                  </span>
                </div>
                <p className="truncate text-xs text-[#8B5CF6]">{item.category}</p>
                <p className="truncate text-sm font-semibold text-[#E6EDF3]">{item.title}</p>
              </button>
            );
          })}
        </div>

        <div className="overflow-hidden rounded-xl border border-[#1F2937] bg-[#0B0F14] text-[#E6EDF3]">
          {loadingDetail || !selected ? (
            <p className="p-10 text-center text-[#9CA3AF]">載入作品內容…</p>
          ) : (
            <>
              <div className="border-b border-[#1F2937] px-6 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs ${statusMeta.bg} ${statusMeta.border} ${statusMeta.text}`}>
                    {projectStatusLabels[selected.status] ?? statusMeta.label}
                  </span>
                  <select
                    className="rounded-lg border border-[#1F2937] bg-[#111827] px-2 py-1 text-xs text-[#9CA3AF]"
                    value={selected.status}
                    onChange={(e) => patchSelected({ status: e.target.value })}
                  >
                    <option value="in-progress">進行中</option>
                    <option value="completed">已完成</option>
                    <option value="not-started">未完成</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-12 lg:items-center">
                <div className="lg:col-span-7">
                  <EditableText
                    as="span"
                    className="mb-3 block text-sm font-mono uppercase tracking-[0.3em] text-[#8B5CF6]"
                    value={selected.category}
                    onChange={(v) => patchSelected({ category: v })}
                  />
                  <EditableText
                    as="h1"
                    className="text-3xl font-black leading-tight md:text-5xl"
                    value={selected.title}
                    onChange={(v) => patchSelected({ title: v })}
                  />
                  <EditableText
                    as="p"
                    multiline
                    className="mt-4 text-sm leading-7 text-[#9CA3AF]"
                    value={selected.description}
                    onChange={(v) => patchSelected({ description: v })}
                  />
                </div>
                <div className="lg:col-span-5">
                  <div className="relative aspect-video overflow-hidden rounded-2xl border border-[#1F2937] bg-[#111827] shadow-2xl">
                    <Image
                      src={selected.imageUrl || "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=900&h=650&fit=crop"}
                      alt={selected.title}
                      fill
                      className="object-cover"
                      unoptimized
                      sizes="(max-width: 768px) 100vw, 40vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F14]/80 to-transparent" />
                  </div>
                </div>
              </div>

              <div className="border-t border-[#1F2937] px-6 py-6">
                <p className="mb-4 text-sm font-mono uppercase tracking-[0.3em] text-[#8B5CF6]">五大工作流程</p>
                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {workflowSteps.map((step, index) => (
                    <button
                      key={step.key}
                      type="button"
                      onClick={() => setWorkflow(step.key)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        workflow === step.key
                          ? "border-[#8B5CF6] bg-[#8B5CF6]/10"
                          : "border-[#1F2937] bg-[#111827]/70 hover:border-[#8B5CF6]/50"
                      }`}
                    >
                      <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#8B5CF6]/15 text-sm font-bold text-[#C4B5FD]">
                        {index + 1}
                      </span>
                      <p className="font-bold">{step.label}</p>
                    </button>
                  ))}
                </div>

                <div className="rounded-3xl border border-[#1F2937] bg-[#111827]/60 p-6">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-2xl font-black">{currentStep?.label}</h2>
                    <Badge className="bg-[#4ADE80]/10 text-[#4ADE80] border-[#4ADE80]/20">訪客預覽</Badge>
                  </div>
                  {workflowContent ? (
                    <div
                      className="prose prose-invert max-w-none prose-headings:text-[#E6EDF3] prose-p:text-[#BFD2EA] prose-li:text-[#BFD2EA]"
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest("[data-edit-workflow]")) return;
                      }}
                    >
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{workflowContent}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm text-[#9CA3AF]">此流程尚無內容，請在下方編輯區輸入。</p>
                  )}
                  <div className="mt-6 border-t border-[#1F2937] pt-4" data-edit-workflow>
                    <p className="mb-2 text-xs text-[#4ADE80]">編輯此流程內容（Markdown）</p>
                    <textarea
                      className="min-h-[160px] w-full rounded-xl border border-[#1F2937] bg-[#0B0F14] px-4 py-3 text-sm leading-7 text-[#CBD5E1] outline-none focus:border-[#4ADE80]/50"
                      value={workflowContent || ""}
                      onChange={(e) => patchWorkflow(e.target.value)}
                      placeholder="輸入此流程的說明、圖表描述、分析結果…"
                    />
                  </div>
                  {selected.id === wsiMeta.projectId && workflow === "application" && (
                    <AdminApplicationCardsEditor
                      project={selected}
                      onChange={(next) => {
                        if (selectedIndex < 0) return;
                        pushUndo(projects);
                        const updated = cloneProjects(projects);
                        updated[selectedIndex] = next;
                        setProjects(updated);
                        setDirty(true);
                      }}
                    />
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
