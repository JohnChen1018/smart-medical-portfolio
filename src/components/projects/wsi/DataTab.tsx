"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaExternalLinkAlt } from "react-icons/fa";
import { WsiStatBox } from "@/components/projects/wsi/shared/WsiLayoutParts";
import { dataSection } from "@/lib/wsiDashboard";
import { classCounts, datasetSplit, totalNuclei } from "@/lib/wsiResults";
import { patchIndicesByClass } from "@/lib/patchClassIndex";
import { patchCountsFor, sortPatchIndices } from "@/lib/patchCounts";
import { wsiUi } from "@/lib/wsiUiLabels";

function zhName(label: string) {
  return label.split(" ")[0] || label;
}

export const PATCH_CLASS_COLORS: Record<string, string> = {
  neutrophil: "#F472B6",
  epithelial: "#22D3EE",
  lymphocyte: "#8B5CF6",
  plasma: "#FBBF24",
  eosinophil: "#F87171",
  connective: "#34D399",
};

export function PatchDetailModal({
  src,
  name,
  index,
  frame,
  frameCount,
  onClose,
  onPrev,
  onNext,
}: {
  src: string;
  name: string;
  index: number;
  frame?: number;
  frameCount?: number;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const [zoom, setZoom] = useState(100);
  const zhByKey = useMemo(() => {
    const map: Record<string, string> = {};
    classCounts.forEach((c) => {
      map[c.key] = c.zh;
    });
    return map;
  }, []);

  const rows = [...patchCountsFor(index)].sort((a, b) => b.count - a.count);
  const total = rows.reduce((a, r) => a + r.count, 0);
  const present = rows.filter((r) => r.count > 0);
  const maxCount = Math.max(1, ...rows.map((r) => r.count));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev?.();
      if (e.key === "ArrowRight") onNext?.();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, onPrev, onNext]);

  const dialog = (
    <div
      className="fixed inset-0 z-[200] flex bg-black/90"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative flex h-dvh w-dvw flex-col overflow-hidden bg-[#0B0F14] md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-black p-4">
          <div className="mb-3 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onPrev}
                disabled={!onPrev}
                className="shrink-0 rounded-full bg-[#1F2937] px-4 py-2 text-sm font-bold text-[#E6EDF3] hover:bg-[#374151] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="上一張"
              >
                上一張
              </button>
              <span className="order-first w-full min-w-0 text-center sm:order-none sm:w-auto sm:flex-1">
                <span className="block truncate text-base font-black text-[#E6EDF3]">
                  {present[0] ? zhName(zhByKey[present[0].key] ?? present[0].key) : "這張沒有細胞核"}
                  <span className="mx-2 font-normal text-[#6B7280]">·</span>
                  <span className="font-mono text-sm font-bold text-[#E6EDF3]">{name.replace("conic_", "")}</span>
                </span>
                <span className="mt-0.5 block text-sm text-[#9CA3AF]">
                  共 {total.toLocaleString()} 顆
                  {frame && frameCount ? ` · 第 ${frame.toLocaleString()} 張，共 ${frameCount.toLocaleString()} 張` : ""}
                </span>
              </span>
              <button
                type="button"
                onClick={onNext}
                disabled={!onNext}
                className="shrink-0 rounded-full bg-[#1F2937] px-4 py-2 text-sm font-bold text-[#E6EDF3] hover:bg-[#374151] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="下一張"
              >
                下一張
              </button>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-full bg-[#E6EDF3] px-4 py-2 text-sm font-bold text-[#0B0F14] hover:bg-white"
              >
                關閉
              </button>
            </div>
          </div>
          <div className="relative min-h-0 flex-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={name}
              style={{ width: `${zoom}%`, height: `${zoom}%` }}
              className="pointer-events-none absolute left-1/2 top-1/2 max-h-full max-w-full -translate-x-1/2 -translate-y-1/2 rounded-lg object-contain"
            />
            {onPrev ? (
              <button
                type="button"
                aria-label="上一張"
                onClick={onPrev}
                className="group/prev absolute inset-y-0 left-0 hidden w-[18%] cursor-w-resize sm:block"
              >
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-[#1F2937]/90 px-3 py-2 text-sm font-bold text-white opacity-70 transition-opacity group-hover/prev:opacity-100">
                  上一張
                </span>
              </button>
            ) : null}
            {onNext ? (
              <button
                type="button"
                aria-label="下一張"
                onClick={onNext}
                className="group/next absolute inset-y-0 right-0 hidden w-[18%] cursor-e-resize sm:block"
              >
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-[#1F2937]/90 px-3 py-2 text-sm font-bold text-white opacity-70 transition-opacity group-hover/next:opacity-100">
                  下一張
                </span>
              </button>
            ) : null}
          </div>
        </div>
        <div className="flex max-h-[40dvh] w-full shrink-0 flex-col gap-3 overflow-y-auto p-4 md:max-h-none md:w-[380px] md:p-6">
          <div>
            <h3 className="font-mono text-lg font-black text-[#E6EDF3]">{name.replace("conic_", "")}</h3>
            <p className="mt-1 font-mono text-sm text-[#9CA3AF]">{name}</p>
            <div className="mt-2 flex items-center gap-2 text-sm text-[#9CA3AF]">
              <span className="shrink-0">{wsiUi.data.patchZoom}</span>
              <button
                type="button"
                aria-label="縮小"
                onClick={() => setZoom((value) => Math.max(40, value - 10))}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#334155] bg-[#1F2937] text-lg font-black leading-none text-[#E6EDF3] hover:bg-[#374151]"
              >
                −
              </button>
              <input
                type="range"
                min={40}
                max={100}
                step={2}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                aria-label={wsiUi.data.patchZoom}
                className="h-2 w-full cursor-pointer accent-[#22D3EE]"
              />
              <button
                type="button"
                aria-label="放大"
                onClick={() => setZoom((value) => Math.min(100, value + 10))}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#334155] bg-[#1F2937] text-lg font-black leading-none text-[#E6EDF3] hover:bg-[#374151]"
              >
                +
              </button>
              <button
                type="button"
                aria-label="回到 100%"
                onClick={() => setZoom(100)}
                className={`shrink-0 rounded-full px-2 py-1 font-mono font-bold ${zoom === 100 ? "text-[#E6EDF3]" : "bg-[#22D3EE] text-[#0B0F14]"}`}
              >
                {zoom}%
              </button>
            </div>
          </div>
          <p className="flex flex-wrap items-baseline gap-x-4 text-sm text-[#9CA3AF]">
            <span>有幾類 <span className="text-lg font-black text-[#22D3EE]">{present.length}</span></span>
            <span>共幾顆 <span className="text-lg font-black text-[#8B5CF6]">{total.toLocaleString()}</span></span>
          </p>
          <div className="space-y-2">
            {present.map((r, i) => {
              const zh = zhName(zhByKey[r.key] ?? r.key);
              const color = PATCH_CLASS_COLORS[r.key] ?? "#8B5CF6";
              return (
                <div key={r.key} className="rounded-lg border border-[#1F2937] bg-[#111827] px-3 py-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                      <span className="font-semibold text-[#E6EDF3]">{zh}</span>
                      {i === 0 ? (
                        <span className="rounded-full px-2 py-0.5 text-xs font-bold text-[#0B0F14]" style={{ background: color }}>
                          最多
                        </span>
                      ) : null}
                    </span>
                    <span className="font-mono font-bold text-[#E6EDF3]">{r.count.toLocaleString()} 顆</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#1F2937]">
                    <div className="h-full rounded-full" style={{ width: `${(r.count / maxCount) * 100}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="sticky bottom-0 mt-auto hidden flex-wrap items-center gap-2 bg-[#0B0F14] pt-3 sm:flex">
            <button
              type="button"
              onClick={onPrev}
              disabled={!onPrev}
              className="rounded-full bg-[#1F2937] px-4 py-2 text-sm font-bold text-[#E6EDF3] hover:bg-[#374151] disabled:cursor-not-allowed disabled:opacity-40"
            >
              上一張
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!onNext}
              className="rounded-full bg-[#1F2937] px-4 py-2 text-sm font-bold text-[#E6EDF3] hover:bg-[#374151] disabled:cursor-not-allowed disabled:opacity-40"
            >
              下一張
            </button>
            <button
              type="button"
              onClick={onClose}
              className="ml-auto rounded-full bg-[#E6EDF3] px-4 py-2 text-sm font-bold text-[#0B0F14] hover:bg-white"
            >
              關閉
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(dialog, document.body);
}

export const PAGE_SIZE = 32;

export const patchFilterTabs = [
  { key: "all", label: "全部" },
  ...classCounts.map((c) => ({ key: c.key, label: zhName(c.zh) })),
];

const zhByClassKey: Record<string, string> = Object.fromEntries(classCounts.map((c) => [c.key, zhName(c.zh)]));

function topClass(index: number) {
  let best: { key: string; count: number } | null = null;
  for (const row of patchCountsFor(index)) {
    if (row.count > 0 && (!best || row.count > best.count)) best = row;
  }
  return best;
}

function countFor(index: number, key: string) {
  return patchCountsFor(index).find((row) => row.key === key)?.count ?? 0;
}

function patchTotal(index: number) {
  return patchCountsFor(index).reduce((sum, row) => sum + row.count, 0);
}

function PatchThumb({ src, name, eager }: { src: string; name: string; eager: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <span className="absolute inset-0 flex items-center justify-center px-2 text-center text-xs font-semibold text-[#9CA3AF]">載入失敗</span>;
  }
  return (
    <>
      {loaded ? null : <span className="absolute inset-0 animate-pulse bg-[#1F2937]" />}
      <img
        src={src}
        alt={name}
        width={160}
        height={160}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={eager ? "high" : "auto"}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`h-full w-full object-cover transition-opacity ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </>
  );
}

export function DataTab() {
  const d = dataSection;
  const [classFilter, setClassFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [pageInput, setPageInput] = useState("1");
  const [pctSort, setPctSort] = useState<"desc" | "asc">("desc");
  const [patchCountSort, setPatchCountSort] = useState<"desc" | "asc">("desc");
  const [patchModal, setPatchModal] = useState<{ src: string; name: string; index: number; pos: number } | null>(null);
  const [chipScroll, setChipScroll] = useState({ left: false, right: false });
  const galleryRef = useRef<HTMLDivElement>(null);
  const filterBarRef = useRef<HTMLDivElement>(null);
  const chipRowRef = useRef<HTMLDivElement>(null);
  const scrollGallery = useRef(false);
  const restoredPage = useRef<number | null>(null);
  const canSaveGallery = useRef(false);
  const [lastName, setLastName] = useState<string | null>(null);

  const sortedClassCounts = useMemo(() => {
    const list = [...classCounts];
    list.sort((a, b) => (pctSort === "desc" ? b.pct - a.pct : a.pct - b.pct));
    return list;
  }, [pctSort]);

  const sortedIndices = useMemo(() => {
    const list = patchIndicesByClass[classFilter] ?? patchIndicesByClass.all ?? [];
    return sortPatchIndices(list, classFilter, patchCountSort);
  }, [classFilter, patchCountSort]);

  const totalInFilter = sortedIndices.length;
  const totalPages = Math.max(1, Math.ceil(totalInFilter / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);

  const indices = useMemo(
    () => sortedIndices.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE),
    [sortedIndices, safePage],
  );

  const images = useMemo(
    () =>
      indices.map((i) => ({
        index: i,
        src: `/lizard-thumbs/conic_${String(i).padStart(6, "0")}.jpg`,
        name: `conic_${String(i).padStart(6, "0")}`,
      })),
    [indices],
  );

  useEffect(() => {
    if (restoredPage.current != null) {
      const next = restoredPage.current;
      restoredPage.current = null;
      setPage(next);
      setPageInput(String(next + 1));
      return;
    }
    setPage(0);
    setPageInput("1");
    if (!scrollGallery.current) return;
    scrollGallery.current = false;
    galleryRef.current?.scrollIntoView({ block: "start" });
  }, [classFilter, patchCountSort]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("wsi-gallery");
      if (!raw) return;
      const saved = JSON.parse(raw) as { classFilter?: string; page?: number; patchCountSort?: string };
      const filterOk = typeof saved.classFilter === "string" && patchFilterTabs.some((tab) => tab.key === saved.classFilter);
      const sortOk = saved.patchCountSort === "asc" || saved.patchCountSort === "desc";
      const pageOk = Number.isInteger(saved.page) && (saved.page ?? 0) >= 0;
      const filterChanges = filterOk && saved.classFilter !== "all";
      const sortChanges = sortOk && saved.patchCountSort !== "desc";
      if (filterChanges || sortChanges) {
        if (pageOk) restoredPage.current = saved.page ?? 0;
        if (filterChanges && saved.classFilter) setClassFilter(saved.classFilter);
        if (sortChanges && (saved.patchCountSort === "asc" || saved.patchCountSort === "desc")) {
          setPatchCountSort(saved.patchCountSort);
        }
      } else if (pageOk && (saved.page ?? 0) > 0) {
        setPage(saved.page ?? 0);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!canSaveGallery.current) {
      canSaveGallery.current = true;
      return;
    }
    try {
      sessionStorage.setItem("wsi-gallery", JSON.stringify({ classFilter, page: safePage, patchCountSort }));
    } catch {
      /* ignore */
    }
  }, [classFilter, safePage, patchCountSort]);

  useEffect(() => {
    const row = chipRowRef.current;
    if (!row) return;
    const update = () => {
      const max = row.scrollWidth - row.clientWidth;
      setChipScroll({
        left: row.scrollLeft > 4,
        right: max > 4 && row.scrollLeft < max - 4,
      });
    };
    update();
    row.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(row);
    return () => {
      row.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [classFilter]);

  const pickClass = (key: string) => {
    scrollGallery.current = true;
    setClassFilter(key);
  };

  useEffect(() => {
    const row = chipRowRef.current;
    const active = row?.querySelector<HTMLElement>("[data-active='true']");
    if (!row || !active || row.scrollWidth <= row.clientWidth) return;
    const left = active.offsetLeft;
    const right = left + active.offsetWidth;
    if (left < row.scrollLeft) row.scrollLeft = left;
    else if (right > row.scrollLeft + row.clientWidth) row.scrollLeft = right - row.clientWidth;
  }, [classFilter]);

  useEffect(() => {
    const bar = filterBarRef.current;
    if (!bar) return;
    const apply = () => {
      document.documentElement.style.setProperty("--wsi-bar-h", `${bar.offsetHeight}px`);
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(bar);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--wsi-bar-h");
    };
  }, []);

  useEffect(() => {
    setPageInput(String(safePage + 1));
    if (!scrollGallery.current) return;
    scrollGallery.current = false;
    galleryRef.current?.scrollIntoView({ block: "start" });
  }, [safePage]);

  const showPage = (next: number) => {
    scrollGallery.current = true;
    setPage(next);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (patchModal) return;
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (event.key === "ArrowLeft" && safePage > 0) {
        event.preventDefault();
        showPage(safePage - 1);
      }
      if (event.key === "ArrowRight" && safePage < totalPages - 1) {
        event.preventDefault();
        showPage(safePage + 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [patchModal, safePage, totalPages]);

  const openAt = (pos: number) => {
    const index = sortedIndices[pos];
    if (index == null) return;
    const nextPage = Math.floor(pos / PAGE_SIZE);
    if (nextPage !== safePage) setPage(nextPage);
    const name = `conic_${String(index).padStart(6, "0")}`;
    setLastName(name);
    setPatchModal({ src: `/lizard/${name}.png`, name, index, pos });
  };

  const closePhoto = () => {
    const name = patchModal?.name;
    setPatchModal(null);
    requestAnimationFrame(() => {
      const button = galleryRef.current?.querySelector<HTMLButtonElement>(`button[data-name="${name}"]`);
      if (!button) return;
      button.focus({ preventScroll: true });
      const rect = button.getBoundingClientRect();
      const above = rect.top < 120;
      const below = rect.bottom > window.innerHeight - 16;
      if (above || below) button.scrollIntoView({ block: "nearest" });
    });
  };

  const jumpToPage = (raw: string) => {
    const n = Number.parseInt(raw, 10);
    if (Number.isNaN(n)) {
      setPageInput(String(safePage + 1));
      return;
    }
    const next = Math.min(totalPages, Math.max(1, n)) - 1;
    showPage(next);
    setPageInput(String(next + 1));
  };

  return (
    <div>
      <div
        ref={filterBarRef}
        className="sticky z-30 -mx-4 mb-3 flex flex-col gap-2 border-b border-[#1F2937] bg-[#0B0F14] px-4 py-2 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10"
        style={{ top: "calc(var(--site-header-h, 4rem) + var(--wsi-nav-h, 7.5rem))" }}
      >
        <div className="flex items-center gap-1">
        <div className={`shrink-0 sm:hidden ${chipScroll.left ? "" : "w-0 overflow-hidden"}`}>
          <button
            type="button"
            aria-label="左邊的類別"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#22D3EE] text-lg font-black leading-none text-[#0B0F14] disabled:opacity-0"
            disabled={!chipScroll.left}
            onClick={() => {
              const row = chipRowRef.current;
              if (!row) return;
              const max = row.scrollWidth - row.clientWidth;
              row.scrollLeft = Math.max(0, row.scrollLeft - 180);
              setChipScroll({ left: row.scrollLeft > 4, right: row.scrollLeft < max - 4 });
            }}
          >
            ‹
          </button>
        </div>
        <div
          ref={chipRowRef}
          onScroll={() => {
            const row = chipRowRef.current;
            if (!row) return;
            const max = row.scrollWidth - row.clientWidth;
            setChipScroll({
              left: row.scrollLeft > 4,
              right: max > 4 && row.scrollLeft < max - 4,
            });
          }}
          className="flex min-w-0 flex-1 gap-2 overflow-x-auto sm:flex-wrap sm:overflow-x-visible"
        >
        {patchFilterTabs.map((tab) => {
          const color = PATCH_CLASS_COLORS[tab.key];
          const on = classFilter === tab.key;
          return (
          <button
            key={tab.key}
            type="button"
            data-active={on ? "true" : "false"}
            onClick={() => pickClass(tab.key)}
            className={`shrink-0 rounded-full border px-2 py-1 text-xs font-semibold transition sm:px-3 sm:py-1.5 sm:text-sm ${
              color
                ? on
                  ? ""
                  : "bg-[#111827]"
                : on
                  ? "border-[#8B5CF6] bg-[#8B5CF6] text-white"
                  : "border-[#1F2937] bg-[#111827] text-[#9CA3AF] hover:text-[#E6EDF3]"
            }`}
            style={
              color
                ? { borderColor: color, background: on ? color : undefined, color: on ? "#0B0F14" : color }
                : undefined
            }
          >
            {tab.label}
            <span className="ml-1 tabular-nums opacity-80 sm:ml-1.5">{(patchIndicesByClass[tab.key] ?? []).length.toLocaleString()} 張</span>
          </button>
          );
        })}
        </div>
        <div className={`shrink-0 sm:hidden ${chipScroll.right ? "" : "w-0 overflow-hidden"}`}>
          <button
            type="button"
            aria-label="右邊的類別"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#22D3EE] text-lg font-black leading-none text-[#0B0F14] disabled:opacity-0"
            disabled={!chipScroll.right}
            onClick={() => {
              const row = chipRowRef.current;
              if (!row) return;
              const max = row.scrollWidth - row.clientWidth;
              row.scrollLeft = Math.min(max, row.scrollLeft + 180);
              setChipScroll({ left: row.scrollLeft > 4, right: row.scrollLeft < max - 4 });
            }}
          >
            ›
          </button>
        </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2">
        {totalPages > 1 ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safePage <= 0}
              onClick={() => showPage(Math.max(0, safePage - 1))}
              className="rounded-full border border-[#1F2937] bg-[#111827] px-3 py-1.5 text-sm font-semibold text-[#E6EDF3] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {wsiUi.data.pagePrev}
            </button>
            <label className="flex items-center gap-2 text-sm text-[#E6EDF3]">
              第
              <input
                type="number"
                min={1}
                max={totalPages}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onBlur={() => jumpToPage(pageInput)}
                onFocus={(e) => e.currentTarget.select()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                aria-label="跳到指定頁碼"
                className="w-16 rounded-lg border border-[#22D3EE] bg-[#0B0F14] px-2 py-1.5 text-center font-mono font-bold text-[#E6EDF3] outline-none focus:border-cyan-200"
              />
              / {totalPages} 頁
            </label>
            <button
              type="button"
              disabled={safePage >= totalPages - 1}
              onClick={() => showPage(Math.min(totalPages - 1, safePage + 1))}
              className="rounded-full border border-[#1F2937] bg-[#111827] px-3 py-1.5 text-sm font-semibold text-[#E6EDF3] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {wsiUi.data.pageNext}
            </button>
          </div>
        ) : null}
            <span
              className="rounded-full px-3 py-1 text-sm font-bold"
              style={
                PATCH_CLASS_COLORS[classFilter]
                  ? { background: PATCH_CLASS_COLORS[classFilter], color: "#0B0F14" }
                  : { background: "#1F2937", color: "#E6EDF3" }
              }
            >
              {patchFilterTabs.find((tab) => tab.key === classFilter)?.label ?? "全部"} · 本頁 {indices.length} 張
            </span>
        <div className="ml-auto flex shrink-0 overflow-hidden rounded-full border border-[#1F2937] bg-[#111827]">
          <button
            type="button"
            onClick={() => setPatchCountSort("desc")}
            className={`px-3 py-1.5 text-sm font-semibold transition ${
              patchCountSort === "desc" ? "bg-[#22D3EE] font-bold text-[#0B0F14]" : "text-[#9CA3AF] hover:text-[#E6EDF3]"
            }`}
          >
            {classFilter === "all" ? "總數多→少" : "此類多→少"}
          </button>
          <button
            type="button"
            onClick={() => setPatchCountSort("asc")}
            className={`px-3 py-1.5 text-sm font-semibold transition ${
              patchCountSort === "asc" ? "bg-[#22D3EE] font-bold text-[#0B0F14]" : "text-[#9CA3AF] hover:text-[#E6EDF3]"
            }`}
          >
            {classFilter === "all" ? "總數少→多" : "此類少→多"}
          </button>
        </div>
        </div>
      </div>
      <div ref={galleryRef} style={{ scrollMarginTop: "calc(var(--site-header-h, 4rem) + var(--wsi-nav-h, 4rem) + var(--wsi-bar-h, 6rem))" }}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {images.map((img, position) => {
          const filtered = classFilter !== "all";
          const label = filtered
            ? { key: classFilter, count: countFor(img.index, classFilter) }
            : topClass(img.index);
          return (
          <button
            key={img.src}
            type="button"
            data-name={img.name}
            onClick={() => openAt(safePage * PAGE_SIZE + position)}
            className={`group relative aspect-square cursor-zoom-in overflow-hidden rounded-md border bg-black transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] ${lastName === img.name ? "border-[#C4B5FD] ring-2 ring-[#8B5CF6]" : "border-[#1F2937]"}`}
          >
            <PatchThumb src={img.src} name={img.name} eager={position < 8} />
            {label && label.count > 0 ? (
              <span
                className="pointer-events-none absolute bottom-1 left-1 max-w-[calc(100%-0.5rem)] truncate rounded px-1.5 py-0.5 text-[11px] font-bold leading-none"
                style={{ background: PATCH_CLASS_COLORS[label.key] ?? "#8B5CF6", color: "#0B0F14" }}
              >
                {zhByClassKey[label.key] ?? label.key} {filtered ? `${label.count.toLocaleString()} 顆` : `共 ${patchTotal(img.index).toLocaleString()} 顆`}
              </span>
            ) : null}
            <span className="pointer-events-none absolute top-1 right-1 rounded bg-black/75 px-1.5 py-0.5 font-mono text-xs font-bold leading-none text-white">
              {img.name.replace("conic_", "")}
            </span>
          </button>
          );
        })}
      </div>
      {totalPages > 1 ? (
        <div className="mt-4 flex flex-col items-center gap-2">
          <span className="px-2 text-center text-sm font-bold text-[#E6EDF3]">
            <span style={{ color: PATCH_CLASS_COLORS[classFilter] ?? "#E6EDF3" }}>
              {patchFilterTabs.find((tab) => tab.key === classFilter)?.label ?? "全部"}
            </span>
            {` · 第 ${safePage + 1} / ${totalPages} 頁 · 本頁 ${indices.length} 張`}
          </span>
          <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={safePage <= 0}
            onClick={() => showPage(Math.max(0, safePage - 1))}
            className="rounded-full border border-[#1F2937] bg-[#111827] px-3 py-1.5 text-sm font-semibold text-[#E6EDF3] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {wsiUi.data.pagePrev}
          </button>
          <button
            type="button"
            disabled={safePage >= totalPages - 1}
            onClick={() => showPage(Math.min(totalPages - 1, safePage + 1))}
            className="rounded-full border border-[#1F2937] bg-[#111827] px-3 py-1.5 text-sm font-semibold text-[#E6EDF3] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {wsiUi.data.pageNext}
          </button>
          </div>
        </div>
      ) : null}
      {patchModal && (
        <PatchDetailModal
          src={patchModal.src}
          name={patchModal.name}
          index={patchModal.index}
          frame={patchModal.pos + 1}
          frameCount={totalInFilter}
          onClose={closePhoto}
          onPrev={patchModal.pos > 0 ? () => openAt(patchModal.pos - 1) : undefined}
          onNext={patchModal.pos < totalInFilter - 1 ? () => openAt(patchModal.pos + 1) : undefined}
        />
      )}
      </div>

      <div className="mt-12 mb-6 grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
        {d.datasets.map((ds) => (
          <a
            key={ds.id}
            href={ds.paperUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-full flex-col rounded-2xl border border-[#1F2937] bg-[#111827] p-5 transition hover:border-[#22D3EE]/50 hover:bg-[#111827]/90"
          >
            <span className="inline-block w-fit rounded-full bg-[#8B5CF6]/15 px-3 py-1 text-sm text-[#C4B5FD]">{ds.tag}</span>
            <h3 className="mt-3 text-lg font-bold text-[#22D3EE]">{ds.title}</h3>
            {ds.name ? <p className="mt-1 text-xs text-[#6B7280]">{ds.name}</p> : null}
            <p className="mt-2 text-sm leading-6 text-[#9CA3AF]">{ds.subtitle}</p>
            <div className="mt-auto pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="rounded-full bg-[#1F2937] px-3 py-1 font-bold text-[#E6EDF3]">{ds.size}</span>
                {ds.paperUrl && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#22D3EE] px-3 py-1 font-bold text-[#0B0F14]">
                    <FaExternalLinkAlt className="text-[10px]" />
                    看論文
                  </span>
                )}
              </div>
              {ds.paperLabel ? <p className="mt-2 text-xs leading-5 text-[#6B7280]">{ds.paperLabel}</p> : null}
            </div>
          </a>
        ))}
      </div>
      <h3 className="mb-3 text-base font-bold text-[#9CA3AF]">{wsiUi.data.splitTitle} {datasetSplit.total.toLocaleString()} {wsiUi.data.splitSuffix}</h3>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <WsiStatBox value={`${datasetSplit.total.toLocaleString()} 張`} label={wsiUi.data.totalPatches} />
        <WsiStatBox value={`${datasetSplit.train.toLocaleString()} 張`} label={wsiUi.data.train} />
        <WsiStatBox value={`${datasetSplit.valid.toLocaleString()} 張`} label={wsiUi.data.valid} />
        <WsiStatBox value={`${datasetSplit.test.toLocaleString()} 張`} label={wsiUi.data.test} />
      </div>
      <h3 className="mb-3 text-base font-bold text-[#9CA3AF]">{classCounts.length} 類細胞核，共 {totalNuclei.toLocaleString()} 顆</h3>
      <div className="mb-8 overflow-x-auto rounded-2xl border border-[#1F2937]">
        <table className="w-full border-collapse text-base">
          <thead><tr className="bg-[#0F172A] text-left text-[#9CA3AF]">
            <th className="px-2 py-2 sm:px-4 sm:py-3">名次</th>
            <th className="px-2 py-2 sm:px-4 sm:py-3">{wsiUi.data.colClass}</th>
            <th className="px-2 py-2 text-right sm:px-4 sm:py-3">顆數</th>
            <th className="px-2 py-2 sm:px-4 sm:py-3 text-right">
              <button
                type="button"
                onClick={() => setPctSort((s) => (s === "desc" ? "asc" : "desc"))}
                className="rounded-full bg-[#22D3EE] px-3 py-1 text-sm font-bold text-[#0B0F14] transition hover:brightness-110"
              >
                {pctSort === "desc" ? "占比多→少" : "占比少→多"}
              </button>
            </th>
            <th className="hidden px-2 py-2 sm:table-cell sm:px-4 sm:py-3">比例條</th>
            <th className="px-2 py-2 sm:px-4 sm:py-3 text-right">看圖</th>
          </tr></thead>
          <tbody>{sortedClassCounts.map((c, i) => (
            <tr
              key={c.key}
              onClick={() => pickClass(c.key)}
              className={`cursor-pointer border-t border-[#1F2937] ${classFilter === c.key ? "bg-white/5" : "hover:bg-[#111827]"}`}
            >
              <td className="px-2 py-2 sm:px-4 sm:py-3 text-[#9CA3AF]">{i + 1}</td>
              <td className="px-2 py-2 sm:px-4 sm:py-3">
                <span className="font-semibold" style={{ color: PATCH_CLASS_COLORS[c.key] ?? "#E6EDF3" }}>
                  {zhName(c.zh)}
                </span>
              </td>
              <td className="px-2 py-2 sm:px-4 sm:py-3 text-right text-[#BFD2EA]">{c.count.toLocaleString()} 顆</td>
              <td className="px-2 py-2 sm:px-4 sm:py-3 text-right text-[#BFD2EA]">{c.pct}%</td>
              <td className="hidden px-2 py-2 sm:table-cell sm:px-4 sm:py-3"><div className="h-2 w-full max-w-[220px] overflow-hidden rounded-full bg-[#1F2937]"><div className="h-full rounded-full" style={{ width: `${Math.max(c.pct, 1.2)}%`, background: PATCH_CLASS_COLORS[c.key] ?? "#8B5CF6" }} /></div></td>
              <td className="px-2 py-2 sm:px-4 sm:py-3 text-right">
                <span
                  className="inline-block rounded-full px-3 py-1 text-sm font-bold text-[#0B0F14]"
                  style={{ background: PATCH_CLASS_COLORS[c.key] ?? "#8B5CF6" }}
                >
                  {classFilter === c.key ? "正在看" : "看圖"}
                </span>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
