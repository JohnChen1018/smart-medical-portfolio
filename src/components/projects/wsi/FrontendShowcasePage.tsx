"use client";

import { useEffect, useState } from "react";
import { FaChevronLeft, FaMicroscope } from "react-icons/fa";
import { wsiUi } from "@/lib/wsiUiLabels";

export function FrontendShowcasePage({ onBack }: { onBack: () => void }) {
  const [frameUrl, setFrameUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let stopped = false;
    let currentUrl = "";

    const showFrame = async () => {
      try {
        const res = await fetch("/api/qupath/frame", { cache: "no-store" });
        if (!res.ok) return;
        const blob = await res.blob();
        if (stopped || blob.size < 32) return;
        const nextUrl = URL.createObjectURL(blob);
        if (currentUrl) URL.revokeObjectURL(currentUrl);
        currentUrl = nextUrl;
        setFrameUrl(nextUrl);
        setError("");
      } catch {
        // QuPath 視窗還沒出現時繼續抓。
      }
    };

    const start = async () => {
      try {
        const res = await fetch("/api/qupath", { method: "POST" });
        const data = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok || !data.ok) {
          if (!stopped) setError(data.error || "無法開啟 QuPath");
          return;
        }
        await showFrame();
      } catch {
        if (!stopped) setError("無法開啟 QuPath");
      }
    };

    void start();
    let frameBusy = false;
    const timer = setInterval(() => {
      if (frameBusy) return;
      frameBusy = true;
      void showFrame().finally(() => {
        frameBusy = false;
      });
    }, 2000);
    return () => {
      stopped = true;
      clearInterval(timer);
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, []);

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

      <header className="mb-4 flex items-center gap-3">
        <FaMicroscope className="text-2xl text-[#C4B5FD]" />
        <h1 className="text-3xl font-black text-[#E6EDF3] md:text-4xl">前端成果展示</h1>
      </header>

      <div className="overflow-hidden rounded-2xl border border-[#1F2937] bg-black">
        {frameUrl ? (
          // blob URL of the live QuPath window
          // eslint-disable-next-line @next/next/no-img-element
          <img src={frameUrl} alt="QuPath" className="h-auto w-full" />
        ) : (
          <div className="flex min-h-[70vh] items-center justify-center text-lg text-[#9CA3AF]">
            {error || "QuPath"}
          </div>
        )}
      </div>
    </div>
  );
}
