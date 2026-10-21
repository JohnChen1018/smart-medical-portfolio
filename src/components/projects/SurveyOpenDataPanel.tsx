"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { FaChevronDown, FaExternalLinkAlt } from "react-icons/fa";
import type { RecentPaper } from "@/lib/research/recentPapers";
import {
  aiSearchKeywords,
  cleanSearchKeyword,
  classifySurveyPaper,
  diseaseFromTopic,
  isMpoxTopic,
  keywordsForTopic,
  matchesAiKeyword,
  mpoxAiKeywords,
  mpoxTaskGroups,
  shelfForDisease,
  surveyShelves,
  unfiledShelf,
  type ApplicationKeywordPlan,
} from "@/lib/research/surveySearchTopics";
import { useI18n } from "@/components/i18n/LocaleProvider";

type SyncPayload = {
  ok?: boolean;
  error?: string;
  dir?: string;
  papers?: RecentPaper[];
  cached?: boolean;
  syncedAt?: string;
};

function formatSynced(iso: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 16).replace("T", " ");
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function plainNote(note: string) {
  return note
    .replace("已下載公開 PDF", "已放進雲端")
    .replace("已在雲端", "已放進雲端")
    .replace("有公開全文", "有 PDF")
    .replace("沒有公開 PDF，只收錄書目", "沒有 PDF，只留下標題")
    .replace("公開連結不是 PDF，只收錄書目", "連結不是 PDF，只留下標題")
    .replace("PDF 下載失敗，只收錄書目", "PDF 沒下載成功，只留下標題")
    .replace("只收錄書目", "只留下標題");
}

export function SurveyOpenDataPanel({ topicId = "survey-paper" }: { topicId?: string }) {
  const { t } = useI18n();
  const sp = t.surveyPanel;
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [dir, setDir] = useState("");
  const [papers, setPapers] = useState<RecentPaper[]>([]);
  const [syncedAt, setSyncedAt] = useState("");
  const [keywords, setKeywords] = useState<string[]>(() => keywordsForTopic(topicId));
  const [picked, setPicked] = useState<string[]>(() => keywordsForTopic(topicId));
  const [draft, setDraft] = useState("");
  const [listFilter, setListFilter] = useState("");
  const [aiPicked, setAiPicked] = useState<string[]>(() => (isMpoxTopic(topicId) ? [...mpoxAiKeywords] : [...aiSearchKeywords]));
  const [taskPicked, setTaskPicked] = useState<string[]>(() => (isMpoxTopic(topicId) ? mpoxTaskGroups.map((group) => group.id) : []));
  const [activeTopic, setActiveTopic] = useState(topicId);
  const [planId, setPlanId] = useState<string | null>(null);
  const [customPlan, setCustomPlan] = useState<ApplicationKeywordPlan | null>(null);
  const [diseaseDraft, setDiseaseDraft] = useState("");
  const [asking, setAsking] = useState(false);
  const [openShelves, setOpenShelves] = useState<Record<string, boolean>>({});
  const [openPapers, setOpenPapers] = useState<Record<string, boolean>>({});
  const appliedQueries = useRef<string[] | null>(null);

  useEffect(() => {
    setActiveTopic(topicId);
  }, [topicId]);

  useEffect(() => {
    const custom = appliedQueries.current;
    appliedQueries.current = null;
    const next = custom ?? keywordsForTopic(activeTopic);
    setKeywords(next);
    setPicked(next);
    if (isMpoxTopic(activeTopic)) {
      setAiPicked([...mpoxAiKeywords]);
      setTaskPicked(mpoxTaskGroups.map((group) => group.id));
    } else if (diseaseFromTopic(activeTopic)) {
      setAiPicked([]);
      setTaskPicked([]);
    } else {
      setAiPicked([...aiSearchKeywords]);
      setTaskPicked([]);
    }
    setPapers([]);
    setDir("");
    setSyncedAt("");
    setOpenPapers({});
    fetch(`/api/research/sync-recent?topicId=${encodeURIComponent(activeTopic)}`)
      .then((res) => res.json())
      .then((data: SyncPayload) => {
        if (!data.ok) return;
        setPapers(data.papers || []);
        setDir(data.dir || "");
        setSyncedAt(data.syncedAt || "");
      })
      .catch(() => null);
  }, [activeTopic]);

  const run = async () => {
    if (picked.length === 0) {
      setError(isMpoxTopic(activeTopic) ? sp.needDisease : sp.needKeyword);
      return;
    }
    if (isMpoxTopic(activeTopic) && aiPicked.length === 0) {
      setError(sp.needAi);
      return;
    }
    const taskTerms = isMpoxTopic(activeTopic)
      ? mpoxTaskGroups.filter((group) => taskPicked.includes(group.id)).flatMap((group) => group.words)
      : undefined;
    setLoading(true);
    setError("");
    setSteps(["準備開始"]);
    try {
      const res = await fetch("/api/research/sync-recent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId: activeTopic, force: true, queries: picked, aiTerms: aiPicked, taskTerms }),
      });
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => ({}))) as SyncPayload;
        throw new Error(data.error || "同步失敗");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as { type?: string; text?: string; error?: string; papers?: RecentPaper[]; dir?: string; syncedAt?: string };
          if (event.type === "step" && event.text) {
            setSteps((current) => [...current, event.text as string]);
          } else if (event.type === "error") {
            throw new Error(event.error || "同步失敗");
          } else if (event.type === "done") {
            setPapers(event.papers || []);
            setDir(event.dir || "");
            setSyncedAt(event.syncedAt || new Date().toISOString());
            setSteps((current) => [...current, "找完了"]);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "同步失敗");
    } finally {
      setLoading(false);
    }
  };

  const usePlan = (plan: ApplicationKeywordPlan) => {
    const queries = plan.keywords.map((item) => item.keyword);
    appliedQueries.current = queries;
    setPlanId(plan.id);
    setKeywords(queries);
    setPicked(queries);
    if (plan.aiTerms && plan.aiTerms.length > 0) {
      setAiPicked(plan.aiTerms);
      setTaskPicked([]);
    } else if (isMpoxTopic(plan.topicId)) {
      setAiPicked([...mpoxAiKeywords]);
      setTaskPicked(mpoxTaskGroups.map((group) => group.id));
    } else if (diseaseFromTopic(plan.topicId)) {
      setAiPicked([]);
      setTaskPicked([]);
    } else {
      setAiPicked([...aiSearchKeywords]);
      setTaskPicked([]);
    }
    setActiveTopic(plan.topicId);
    window.setTimeout(() => {
      document.getElementById("survey-paper-search")?.scrollIntoView({ block: "start" });
    }, 50);
  };

  const addKeyword = (event: FormEvent) => {
    event.preventDefault();
    const next = cleanSearchKeyword(draft);
    if (!next) return;
    setKeywords((current) => (current.some((item) => item.toLowerCase() === next.toLowerCase()) ? current : [...current, next]));
    setPicked((current) => (current.some((item) => item.toLowerCase() === next.toLowerCase()) ? current : [...current, next]));
    setDraft("");
  };

  const ordered = useMemo(() => {
    const needle = listFilter.trim().toLowerCase();
    const mpox = isMpoxTopic(activeTopic);
    const taskWords = mpoxTaskGroups.filter((group) => taskPicked.includes(group.id)).flatMap((group) => group.words);
    return [...papers]
      .filter((paper) => {
        const blob = mpox ? paper.title : `${paper.title} ${paper.authors.join(" ")}`;
        if (mpox && !matchesAiKeyword(paper.title, picked)) return false;
        if (!matchesAiKeyword(blob, aiPicked)) return false;
        if (mpox && !matchesAiKeyword(paper.title, taskWords)) return false;
        return !needle || `${paper.title} ${paper.authors.join(" ")}`.toLowerCase().includes(needle);
      })
      .sort((a, b) => (b.date || "0000").localeCompare(a.date || "0000"));
  }, [papers, listFilter, aiPicked, picked, taskPicked, activeTopic]);

  const saved = papers.filter((paper) => paper.savedFile).length;
  const syncedLabel = formatSynced(syncedAt);
  const chosenPlan = customPlan && customPlan.id === planId ? customPlan : null;

  const askDisease = async (event: FormEvent) => {
    event.preventDefault();
    const name = cleanSearchKeyword(diseaseDraft);
    if (!name || asking) return;
    setAsking(true);
    setError("");
    try {
      const res = await fetch("/api/research/topic-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: name }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; plan?: ApplicationKeywordPlan };
      if (!res.ok || !data.ok || !data.plan) throw new Error(data.error || "這次沒有找出關鍵字");
      setCustomPlan(data.plan);
      setPlanId(data.plan.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "這次沒有找出關鍵字");
    } finally {
      setAsking(false);
    }
  };
  const paperKey = (paper: RecentPaper) => paper.doi || paper.title;
  const shelves = useMemo(() => {
    const buckets = new Map<string, { id: string; title: string; folder: string; papers: RecentPaper[]; hits: Record<string, string> }>();
    for (const paper of ordered) {
      const found = classifySurveyPaper(paper.title, diseaseFromTopic(activeTopic));
      const current = buckets.get(found.shelf.id) ?? {
        id: found.shelf.id,
        title: found.shelf.title,
        folder: found.shelf.folder,
        papers: [],
        hits: {},
      };
      current.papers.push(paper);
      current.hits[paperKey(paper)] = found.hit;
      buckets.set(found.shelf.id, current);
    }
    const disease = diseaseFromTopic(activeTopic);
    const shelfOrder = disease ? [shelfForDisease(disease), ...surveyShelves, unfiledShelf] : [...surveyShelves, unfiledShelf];
    return shelfOrder
      .map((shelf) => buckets.get(shelf.id))
      .filter((shelf): shelf is NonNullable<typeof shelf> => Boolean(shelf && shelf.papers.length > 0));
  }, [ordered, activeTopic]);

  return (
    <section className="space-y-6 rounded-3xl border border-cyan-400/25 bg-gradient-to-br from-cyan-950/20 to-[#111827] p-6 md:p-8">
      <div className="rounded-2xl border border-[#334155] bg-[#0B0F14] p-4">
        <p className="text-lg font-semibold text-[#E6EDF3]">{sp.now}</p>
        <form onSubmit={(event) => void askDisease(event)} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={diseaseDraft}
            onChange={(event) => setDiseaseDraft(event.target.value)}
            placeholder={sp.topicPlaceholder}
            className="min-w-0 flex-1 rounded-xl border border-[#334155] bg-[#111827] px-4 py-3 text-base text-[#E6EDF3] outline-none focus:border-cyan-400"
          />
          <button type="submit" disabled={asking} className="rounded-xl bg-cyan-500 px-4 py-3 text-base font-bold text-[#06202A] disabled:opacity-50">
            {asking ? sp.findingKeywords : sp.getKeywords}
          </button>
        </form>
        {chosenPlan && (
          <div className="mt-4 space-y-3">
            {chosenPlan.keywords.map((item) => (
              <div key={item.keyword} className="rounded-xl border border-[#1F2937] bg-[#111827] p-3">
                <p className="text-sm font-bold text-[#E6EDF3]">{item.keyword}</p>
                <p className="mt-1 text-sm leading-6 text-[#BFD2EA]">{sp.source}{item.source}</p>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-cyan-300"
                  >
                    <FaExternalLinkAlt className="text-[10px]" />
                    {sp.seeSource}
                  </a>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => usePlan(chosenPlan)}
              className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-[#06202A]"
            >
              {sp.useKeywords}
            </button>
          </div>
        )}
      </div>

      <div id="survey-paper-search" className="flex scroll-mt-28 flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-[#E6EDF3]">{sp.cloudTitle}</h2>
        </div>
        <button
          type="button"
          onClick={() => void run()}
          disabled={loading}
          className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-bold text-[#06202A] disabled:opacity-50"
        >
          {loading ? sp.searching : sp.startSearch}
        </button>
      </div>

      <div className="rounded-2xl border border-[#334155] bg-[#0B0F14] p-4">
        <p className="text-sm font-semibold text-[#E6EDF3]">{isMpoxTopic(activeTopic) ? sp.diseaseTerms : sp.searchKeywords}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {keywords.map((keyword) => {
            const on = picked.some((item) => item.toLowerCase() === keyword.toLowerCase());
            return (
              <button
                key={keyword}
                type="button"
                onClick={() =>
                  setPicked((current) =>
                    on ? current.filter((item) => item.toLowerCase() !== keyword.toLowerCase()) : [...current, keyword],
                  )
                }
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  on ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-100" : "border-[#334155] text-[#9CA3AF]"
                }`}
              >
                {on ? sp.selected : sp.unselected} {keyword}
              </button>
            );
          })}
        </div>
        <form onSubmit={addKeyword} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={sp.addPlaceholder}
            className="min-w-0 flex-1 rounded-xl border border-[#334155] bg-[#111827] px-4 py-2 text-sm text-[#E6EDF3] outline-none focus:border-cyan-400"
          />
          <button type="submit" className="rounded-xl border border-cyan-400/40 px-4 py-2 text-sm font-semibold text-cyan-200">
            {sp.add}
          </button>
        </form>
        <p className="mt-5 text-sm font-semibold text-[#E6EDF3]">{isMpoxTopic(activeTopic) ? sp.aiTerms : sp.aiKeywords}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(isMpoxTopic(activeTopic) ? mpoxAiKeywords : aiSearchKeywords).map((keyword) => {
            const on = aiPicked.some((item) => item.toLowerCase() === keyword.toLowerCase());
            return (
              <button
                key={keyword}
                type="button"
                onClick={() =>
                  setAiPicked((current) =>
                    on ? current.filter((item) => item.toLowerCase() !== keyword.toLowerCase()) : [...current, keyword],
                  )
                }
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  on ? "border-[#8B5CF6]/60 bg-[#8B5CF6]/15 text-[#E9D5FF]" : "border-[#334155] text-[#9CA3AF]"
                }`}
              >
                {on ? sp.selected : sp.unselected} {keyword}
              </button>
            );
          })}
        </div>
        {isMpoxTopic(activeTopic) && (
          <>
            <p className="mt-5 text-sm font-semibold text-[#E6EDF3]">{sp.taskTerms}</p>
            <div className="mt-3 flex flex-col gap-2">
              {mpoxTaskGroups.map((group) => {
                const on = taskPicked.includes(group.id);
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() =>
                      setTaskPicked((current) => (on ? current.filter((item) => item !== group.id) : [...current, group.id]))
                    }
                    className={`rounded-xl border px-3 py-2 text-left text-sm ${
                      on ? "border-[#8B5CF6]/60 bg-[#8B5CF6]/15 text-[#E9D5FF]" : "border-[#334155] text-[#9CA3AF]"
                    }`}
                  >
                    {on ? "已選" : "未選"} {group.label}：{group.words.join("、")}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {loading && (
        <div className="rounded-2xl border border-cyan-400/30 bg-[#06202A] p-5">
          <p className="text-lg font-black text-cyan-100">正在找</p>
          <ol className="mt-3 space-y-2">
            {steps.map((step, index) => (
              <li key={`${step}-${index}`} className="flex items-start gap-2 text-sm leading-6 text-[#BFD2EA]">
                <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${index === steps.length - 1 ? "animate-pulse bg-cyan-300" : "bg-emerald-400"}`} />
                <span>{index === steps.length - 1 ? "現在：" : "完成："}{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {dir && (
        <p className="rounded-xl border border-[#334155] bg-[#0B0F14] px-4 py-3 text-sm leading-7 text-[#BFD2EA]">
          {sp.savedLine(dir.split(/[/\\]/).filter(Boolean).pop() || dir, papers.length, saved)}
          <span className="mt-1 block font-mono text-xs text-[#6B7280]">{dir}</span>
          {syncedLabel && <span className="mt-1 block text-xs text-[#6B7280]">{sp.updated(syncedLabel)}</span>}
        </p>
      )}

      {error && (
        <p className="text-sm leading-6 text-amber-300">
          {error.includes("只允許這台電腦") ? sp.localOnly : error}
        </p>
      )}

      <label className="block text-sm text-[#9CA3AF]">
        {sp.filterList}
        <input
          value={listFilter}
          onChange={(event) => setListFilter(event.target.value)}
          placeholder={sp.filterPlaceholder}
          className="mt-2 w-full rounded-xl border border-[#334155] bg-[#0B0F14] px-4 py-2 text-sm text-[#E6EDF3] outline-none focus:border-cyan-400"
        />
      </label>

      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-base font-semibold text-[#E6EDF3]">{sp.byTitle}</p>
        </div>
        {ordered.length > 0 && (
          <button
            type="button"
            onClick={() => {
              const allOpen = ordered.every((paper) => openPapers[paperKey(paper)]);
              setOpenPapers(allOpen ? {} : Object.fromEntries(ordered.map((paper) => [paperKey(paper), true])));
            }}
            className="text-sm text-cyan-300"
          >
            {ordered.every((paper) => openPapers[paperKey(paper)]) ? sp.collapseAll : sp.expandAll}
          </button>
        )}
      </div>

      {!loading && ordered.length === 0 && <p className="text-sm text-[#9CA3AF]">{sp.none}</p>}

      <div className="space-y-4">
        {shelves.map((shelf) => {
          const shelfOpen = openShelves[shelf.id] !== false;
          return (
            <section key={shelf.id} className="rounded-2xl border border-[#334155] bg-[#0B0F14]">
              <button
                type="button"
                onClick={() => setOpenShelves((current) => ({ ...current, [shelf.id]: current[shelf.id] === false }))}
                className="flex w-full items-start gap-3 px-4 py-4 text-left"
              >
                <FaChevronDown className={`mt-1 shrink-0 text-xs text-cyan-300 transition ${shelfOpen ? "" : "-rotate-90"}`} />
                <span>
                  <span className="block text-lg font-black text-[#E6EDF3]">
                    {shelf.title}
                    <span className="ml-2 text-sm font-semibold text-cyan-200">{shelf.papers.length} 篇</span>
                  </span>
                  <span className="mt-1 block text-sm text-[#9CA3AF]">
                    {shelf.folder ? `資料放在雲端資料夾「${shelf.folder}」。` : "標題對不到現有主題，先放這裡。"}
                  </span>
                </span>
              </button>
              {shelfOpen && (
                <div className="space-y-2 border-t border-[#1F2937] px-3 py-3">
                  {shelf.papers.map((paper) => {
                    const key = paperKey(paper);
                    const open = Boolean(openPapers[key]);
                    const hit = shelf.hits[key];
                    return (
                      <article key={key} className="rounded-xl border border-[#1F2937] bg-[#111827]">
                        <button
                          type="button"
                          onClick={() => setOpenPapers((current) => ({ ...current, [key]: !current[key] }))}
                          className="flex w-full items-start gap-3 px-4 py-3 text-left"
                        >
                          <FaChevronDown className={`mt-1 shrink-0 text-xs text-[#9CA3AF] transition ${open ? "" : "-rotate-90"}`} />
                          <span>
                            <span className="block text-xs text-[#9CA3AF]">
                              {paper.date || "日期未標"} · {plainNote(paper.note)}
                              {hit ? ` · 標題有 ${hit}` : ""}
                            </span>
                            <span className="mt-1 block text-base font-bold text-[#E6EDF3]">{paper.title}</span>
                          </span>
                        </button>
                        {open && (
                          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#1F2937] px-4 py-3 pl-10">
                            <p className="text-sm text-[#9CA3AF]">
                              {paper.authors.slice(0, 4).join(", ") || "作者未標"}
                              {paper.doi ? ` · ${paper.doi}` : ""}
                            </p>
                            {paper.url && (
                              <a
                                href={paper.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/40 px-3 py-1.5 text-sm font-semibold text-cyan-300"
                              >
                                <FaExternalLinkAlt className="text-[10px]" />
                                看原文
                              </a>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </section>
  );
}
