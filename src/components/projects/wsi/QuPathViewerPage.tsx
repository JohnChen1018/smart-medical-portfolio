"use client";

import { useState } from "react";
import { FaChevronLeft, FaExternalLinkAlt } from "react-icons/fa";
import { wsiUi } from "@/lib/wsiUiLabels";

const DEFAULT_QUPATH_URL =
  process.env.NEXT_PUBLIC_QUPATH_URL ?? "http://127.0.0.1:8080";

export function QuPathViewerPage({ onBack }: { onBack: () => void }) {
  const [url, setUrl] = useState(DEFAULT_QUPATH_URL);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className="text-base leading-relaxed">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 text-base text-[#9CA3AF] transition hover:text-[#E6EDF3]"
      >
        <FaChevronLeft className="text-xs" />
        {wsiUi.analysis.backToAnalysis}
      </button>

      <header className="mb-6 overflow-hidden rounded-3xl border border-cyan-400/30 bg-gradient-to-br from-[#083344]/80 via-[#111827] to-[#0B0F14] p-6">
        <p className="text-sm font-mono uppercase tracking-[0.25em] text-[#67E8F9]">QuPath</p>
        <h1 className="mt-2 text-3xl font-black text-[#E6EDF3]">前端成果展示 · QuPath</h1>
        <p className="mt-3 max-w-3xl text-base leading-8 text-[#BFD2EA]">
          單一畫面嵌入 QuPath／OpenMicroanatomy Web 檢視器。請先在本機啟動 QuPath 相關服務，再於下方載入。
          可在 <code className="text-cyan-300">.env.local</code> 設定{" "}
          <code className="text-cyan-300">NEXT_PUBLIC_QUPATH_URL</code>。
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setLoaded(false);
              setError(false);
            }}
            className="min-w-[240px] flex-1 rounded-lg border border-[#1F2937] bg-[#0B0F14] px-3 py-2 text-sm text-[#E6EDF3] outline-none focus:border-cyan-400/50"
            placeholder="http://127.0.0.1:8080"
          />
          <button
            type="button"
            onClick={() => {
              setError(false);
              setLoaded(true);
            }}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500"
          >
            載入檢視器
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#1F2937] px-3 py-2 text-sm text-[#22D3EE]"
          >
            <FaExternalLinkAlt className="text-[10px]" /> 新分頁開啟
          </a>
        </div>
      </header>

      <div className="overflow-hidden rounded-2xl border border-[#1F2937] bg-[#0B0F14]">
        {!loaded ? (
          <div className="flex min-h-[70vh] items-center justify-center text-[#9CA3AF]">
            按「載入檢視器」連線至 QuPath API／Web 介面
          </div>
        ) : (
          <>
            {error && (
              <div className="border-b border-amber-400/30 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
                無法嵌入此網址（可能被 X-Frame-Options 阻擋）。請改用「新分頁開啟」，或確認 QuPath Web 服務已啟動。
              </div>
            )}
            <iframe
              title="QuPath Viewer"
              src={url}
              className="min-h-[70vh] w-full border-0 bg-black"
              onError={() => setError(true)}
              allow="fullscreen"
            />
          </>
        )}
      </div>
    </div>
  );
}
