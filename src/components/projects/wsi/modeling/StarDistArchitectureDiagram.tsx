"use client";

import { useState } from "react";
import { FaExternalLinkAlt } from "react-icons/fa";

const PAPER_URL = "https://arxiv.org/abs/1806.03535";
const REPO_URL = "https://github.com/stardist/stardist";
/** 官方 overview 圖（raw）；本地副本作備援 */
const OFFICIAL_FIG = "/wsi/stardist-overview-2d.png";
const OFFICIAL_FIG_FALLBACK =
  "https://raw.githubusercontent.com/stardist/stardist/main/images/overview_2d.png";

type StepId = "input" | "predict" | "candidates" | "nms" | "masks";

const STEPS: {
  id: StepId;
  title: string;
  subtitle: string;
  detail: string;
}[] = [
  {
    id: "input",
    title: "① 輸入與標註",
    subtitle: "image + GT instances",
    detail:
      "官方圖左側：輸入影像與 ground-truth instance 標註。本研究使用 CoNIC 256×256 H&E patch，每個細胞核是一顆獨立實例。",
  },
  {
    id: "predict",
    title: "② 預測 d 與 r_k",
    subtitle: "object probability + radial distances",
    detail:
      "U-Net 對每個像素預測物件機率 d，以及 n 條等角放射方向上的邊界距離 r_k（2D 常用 n_rays=32）。這兩組輸出定義星形凸多邊形。",
  },
  {
    id: "candidates",
    title: "③ 候選星形多邊形",
    subtitle: "overcomplete set",
    detail:
      "高機率像素各自產生一顆星形凸多邊形，形成過度完備（overcomplete）的候選集合——同一真實細胞核可能對應多顆候選。",
  },
  {
    id: "nms",
    title: "④ NMS",
    subtitle: "non-maximum suppression",
    detail:
      "以物件機率為分數，對重疊候選做非極大值抑制，理想上每個真實細胞核只保留一顆多邊形。",
  },
  {
    id: "masks",
    title: "⑤ Instance masks",
    subtitle: "本研究再加 6 類頭",
    detail:
      "官方流程輸出 instance masks。本研究在 CoNIC 任務上再接 6 類分類頭（neu / epi / lym / pls / eos / con），同時完成分割與分類。",
  },
];

export function StarDistArchitectureDiagram() {
  const [active, setActive] = useState<StepId>("predict");
  const [figSrc, setFigSrc] = useState(OFFICIAL_FIG);
  const current = STEPS.find((n) => n.id === active) ?? STEPS[1];

  return (
    <div className="rounded-2xl border border-[#8B5CF6]/30 bg-[#0F172A] p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-end gap-3">
        <div className="flex flex-wrap gap-2">
          <a
            href={PAPER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-3 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/20"
          >
            <FaExternalLinkAlt className="text-[10px]" />
            原始論文 arXiv
          </a>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-[#334155] bg-[#111827] px-3 py-2 text-sm font-semibold text-[#BFD2EA] transition hover:border-violet-400/50"
          >
            <FaExternalLinkAlt className="text-[10px]" />
            官方 GitHub
          </a>
        </div>
      </div>

      <figure className="overflow-hidden rounded-xl border border-[#1F2937] bg-white p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={figSrc}
          alt="StarDist official 2D overview: input, predicted d and radial distances, candidates, NMS, instance masks"
          className="mx-auto h-auto w-full max-w-3xl object-contain"
          onError={() => {
            if (figSrc !== OFFICIAL_FIG_FALLBACK) setFigSrc(OFFICIAL_FIG_FALLBACK);
          }}
        />
        <figcaption className="mt-2 text-center text-xs text-[#64748B]">
          Source: stardist/stardist · images/overview_2d.png
        </figcaption>
      </figure>

      <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {STEPS.map((step) => {
          const selected = active === step.id;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => setActive(step.id)}
              className={`rounded-xl border px-3 py-3 text-left transition wsi-hover-grow ${
                selected
                  ? "border-violet-300 bg-violet-500/20 ring-2 ring-violet-300/40"
                  : "border-[#334155] bg-[#111827] hover:border-violet-400/50"
              }`}
            >
              <div className="text-lg font-black text-[#E6EDF3]">{step.title}</div>
              <div className="mt-1 font-mono text-base text-[#BFD2EA]">{step.subtitle}</div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl border border-[#1F2937] bg-[#111827] p-5">
        <h4 className="text-2xl font-black text-[#C4B5FD]">
          {current.title}
          <span className="ml-2 font-mono text-lg font-normal text-[#BFD2EA]">{current.subtitle}</span>
        </h4>
        <p className="mt-3 text-xl leading-9 text-[#E6EDF3]">{current.detail}</p>
      </div>
    </div>
  );
}
