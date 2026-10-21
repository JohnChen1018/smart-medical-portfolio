"use client";

import { FaChevronLeft } from "react-icons/fa";
import { AiChatPanel } from "@/components/projects/wsi/AiChatPanel";
import { wsiUi } from "@/lib/wsiUiLabels";
import type { WsiConfig } from "@/lib/wsiResults";

export function AiSuggestPage({
  onBack,
  effectiveBest,
}: {
  onBack: () => void;
  effectiveBest: WsiConfig;
}) {
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

      <header className="mb-6 overflow-hidden rounded-3xl border border-violet-500/30 bg-gradient-to-br from-[#1a1033]/90 via-[#111827] to-[#0B0F14] p-6 md:p-8">
        <p className="text-xs font-mono uppercase tracking-[0.25em] text-violet-300">AI Assistant</p>
        <h1 className="mt-2 text-3xl font-black text-[#E6EDF3] md:text-4xl">{wsiUi.analysis.aiSuggestTitle}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[#BFD2EA]">
          已載入本研究最佳實驗與論文對比數據。選擇 Gemini／GPT／Cursor 後即可提問；金鑰在{" "}
          <a href="/admin/tokens" target="_blank" className="text-violet-300 underline">
            後台 Token 頁
          </a>{" "}
          設定。
        </p>
      </header>

      <AiChatPanel effectiveBest={effectiveBest} />
    </div>
  );
}
