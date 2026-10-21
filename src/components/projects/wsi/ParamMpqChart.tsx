"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const MPQ_COLOR = "#34d399";
const PARAMS_COLOR = "#38bdf8";

export type ParamMpqRow = {
  name: string;
  mPQ: number;
  paramsM: number;
  isOurs?: boolean;
};

export function ParamMpqChart({
  data,
  height = 360,
  showCaption = true,
}: {
  data: ParamMpqRow[];
  height?: number;
  showCaption?: boolean;
}) {
  const maxMPQ = Math.max(...data.map((d) => d.mPQ), 0.01);
  const maxParam = Math.max(...data.map((d) => d.paramsM), 0.01);

  return (
    <div>
      {showCaption && (
        <p className="mb-4 text-sm leading-7 text-[#9CA3AF]">
          左圖比<strong className="text-emerald-300"> mPQ+</strong>（越高越好）；右圖比
          <strong className="text-sky-300"> 參數量</strong>（越低越輕量）。同色代表同一指標，方便橫向比較各模型。
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#1F2937] bg-[#111827] p-4">
          <h4 className="mb-2 text-sm font-bold text-emerald-300">mPQ+（越高越好）</h4>
          <div style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 24, right: 12, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" tick={{ fill: "#E6EDF3", fontSize: 13, fontWeight: 600 }} />
                <YAxis
                  domain={[0, Number((maxMPQ * 1.2).toFixed(2))]}
                  tick={{ fill: "#6EE7B7", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{ background: "#0B0F14", border: "1px solid #4B5563", color: "#E6EDF3" }}
                  formatter={(v) => [Number(v).toFixed(4), "mPQ+"]}
                />
                <Bar dataKey="mPQ" fill={MPQ_COLOR} radius={[8, 8, 0, 0]} barSize={48}>
                  {data.map((d) => (
                    <Cell key={d.name} fill={d.isOurs ? MPQ_COLOR : "#64748b"} />
                  ))}
                  <LabelList
                    dataKey="mPQ"
                    position="top"
                    fill="#F9FAFB"
                    fontSize={12}
                    fontWeight={700}
                    formatter={(v) => (v == null ? "" : Number(v).toFixed(4))}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-[#1F2937] bg-[#111827] p-4">
          <h4 className="mb-2 text-sm font-bold text-sky-300">參數量 M（越低越輕量）</h4>
          <div style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 24, right: 12, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" tick={{ fill: "#E6EDF3", fontSize: 13, fontWeight: 600 }} />
                <YAxis
                  domain={[0, Number((maxParam * 1.15).toFixed(1))]}
                  tick={{ fill: "#7DD3FC", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{ background: "#0B0F14", border: "1px solid #4B5563", color: "#E6EDF3" }}
                  formatter={(v) => [`${v}M`, "參數量"]}
                />
                <Bar dataKey="paramsM" fill={PARAMS_COLOR} radius={[8, 8, 0, 0]} barSize={48}>
                  {data.map((d) => (
                    <Cell key={d.name} fill={d.isOurs ? PARAMS_COLOR : "#475569"} />
                  ))}
                  <LabelList
                    dataKey="paramsM"
                    position="top"
                    fill="#E5E7EB"
                    fontSize={12}
                    fontWeight={700}
                    formatter={(v) => (v == null ? "" : `${v}M`)}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold text-[#9CA3AF]">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-emerald-400" /> mPQ+ 柱
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-sky-400" /> 參數量柱
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-slate-500" /> 論文基準
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-emerald-400 ring-2 ring-sky-400/60" /> 本研究（兩圖皆高亮）
        </span>
      </div>
    </div>
  );
}
