"use client";

import { useEffect, useState } from "react";

const phases = [
  { key: "center", label: "① 找細胞中心", desc: "U-Net 預測每顆細胞核的中心點——相鄰細胞各自一個中心（下圖 2 個粉紅點）" },
  { key: "rays", label: "② 放射距離", desc: "從各中心沿 n_rays 條方向向量量測到邊界的距離" },
  { key: "polygon", label: "③ 星形輪廓", desc: "距離連成星形凸多邊形，切開相鄰細胞核" },
  { key: "class", label: "④ 分類", desc: "對每顆 instance 預測細胞類別（6 類）" },
] as const;

const cells = [
  { cx: 62, cy: 112, r: 34, label: "Epithelial", color: "#8B5CF6", num: 1 },
  { cx: 138, cy: 88, r: 32, label: "Lymphocyte", color: "#059669", num: 2 },
] as const;

export function StarDistAnimation() {
  const [phase, setPhase] = useState(0);
  const nRays = 16;

  useEffect(() => {
    const t = setInterval(() => setPhase((p) => (p + 1) % phases.length), 2800);
    return () => clearInterval(t);
  }, []);

  const p = phases[phase];

  return (
    <div className="rounded-2xl border border-[#8B5CF6]/30 bg-[#0F172A] p-6 md:p-8">
      <div className="flex flex-col items-center gap-6">
        <div className="relative mx-auto aspect-square w-full max-w-[520px]">
          <svg viewBox="0 0 200 200" className="h-full w-full rounded-2xl">
            <rect width="200" height="200" fill="#0B0F14" rx="16" />

            {cells.map((cell) => {
              const rayLen = phase >= 2 ? cell.r + 2 : phase === 1 ? cell.r + 2 : 0;
              const points =
                phase >= 2
                  ? Array.from({ length: nRays }, (_, i) => {
                      const angle = (i / nRays) * Math.PI * 2 - Math.PI / 2;
                      const r = cell.r + (i % 3) * 3;
                      return `${cell.cx + Math.cos(angle) * r},${cell.cy + Math.sin(angle) * r}`;
                    }).join(" ")
                  : "";

              return (
                <g key={cell.label}>
                  <circle
                    cx={cell.cx}
                    cy={cell.cy}
                    r={cell.r + 5}
                    fill="#1E293B"
                    stroke="#475569"
                    strokeWidth="1.2"
                    opacity="0.85"
                  />
                  {phase >= 1 &&
                    Array.from({ length: nRays }, (_, i) => {
                      const angle = (i / nRays) * Math.PI * 2 - Math.PI / 2;
                      const x2 = cell.cx + Math.cos(angle) * rayLen;
                      const y2 = cell.cy + Math.sin(angle) * rayLen;
                      return (
                        <line
                          key={i}
                          x1={cell.cx}
                          y1={cell.cy}
                          x2={x2}
                          y2={y2}
                          stroke="#22D3EE"
                          strokeWidth="2"
                          opacity={phase === 1 ? 0.85 : 0.95}
                        />
                      );
                    })}
                  {phase >= 2 && points && (
                    <polygon points={points} fill={`${cell.color}40`} stroke={cell.color} strokeWidth="2.5" />
                  )}
                  <circle cx={cell.cx} cy={cell.cy} r={7} fill="#F472B6" stroke="#fff" strokeWidth="1.5" />
                  <text x={cell.cx} y={cell.cy + 4} textAnchor="middle" fill="#0B0F14" fontSize="8" fontWeight="bold">
                    {cell.num}
                  </text>
                  {phase >= 3 && (
                    <g>
                      <rect x={cell.cx - 30} y={cell.cy - cell.r - 24} width="60" height="18" rx="5" fill={cell.color} />
                      <text x={cell.cx} y={cell.cy - cell.r - 12} textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">
                        {cell.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        <div className="w-full max-w-xl">
          <div className="mb-4 flex flex-wrap justify-center gap-2">
            {phases.map((ph, i) => (
              <button
                key={ph.key}
                type="button"
                onClick={() => setPhase(i)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  i === phase ? "bg-[#8B5CF6] text-white ring-2 ring-[#C4B5FD]/50" : "bg-[#1F2937] text-[#9CA3AF] hover:text-[#E6EDF3]"
                }`}
              >
                {ph.label}
              </button>
            ))}
          </div>
          <h4 className="text-center text-2xl font-bold text-[#C4B5FD]">{p.label}</h4>
          <p className="mt-3 text-center text-base leading-8 text-[#E6EDF3]">{p.desc}</p>
        </div>
      </div>
    </div>
  );
}
