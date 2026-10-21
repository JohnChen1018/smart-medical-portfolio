"use client";

import {
  barPct,
  fmtShort,
  phaseProgress,
  currentSurveyDay,
  surveyGanttRange,
  timeProgress,
  weekColumns,
  type SurveyPhase,
  type SurveyTrack,
} from "@/lib/surveyPaperData";

const phaseColors: Record<string, string> = {
  draft: "bg-amber-400 text-[#0B0F14]",
  revision: "bg-violet-500/90 text-white",
};

function PhaseLegend() {
  return (
    <div className="flex flex-wrap gap-4 text-xs">
      <span className="flex items-center gap-2">
        <span className="h-3 w-6 rounded bg-amber-400" />
        初稿（前 2 週）
      </span>
      <span className="flex items-center gap-2">
        <span className="h-3 w-6 rounded bg-violet-500/90" />
        之後每週改一次
      </span>
      <span className="flex items-center gap-2">
        <span className="h-3 w-6 rounded bg-gradient-to-r from-emerald-400 to-[#22D3EE]" />
        累積進度
      </span>
      <span className="flex items-center gap-2">
        <span className="h-3 w-0.5 bg-red-400" />
        今日
      </span>
    </div>
  );
}

function TrackRow({
  track,
  phases,
  rangeStart,
  rangeEnd,
  today,
  showMeta = true,
}: {
  track: SurveyTrack;
  phases: SurveyPhase[];
  rangeStart: string;
  rangeEnd: string;
  today: string;
  showMeta?: boolean;
}) {
  const timePct = timeProgress(track.start, track.end, today);
  const phasePct = phaseProgress(phases, today);
  const completedPhases = phases.filter((p) => parseDay(p.end) < parseDay(today)).length;

  return (
    <div className="rounded-xl border border-[#1F2937] bg-[#0F172A]/60 p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: track.color }}
            />
            <span className="text-base font-bold text-[#E6EDF3]">{track.title}</span>
            <span className="rounded-full bg-[#1F2937] px-2 py-0.5 text-[10px] text-[#9CA3AF]">
              {track.group}
            </span>
          </div>
          {showMeta && (
            <p className="mt-1 text-xs text-[#6B7280]">
              {fmtShort(track.start)} — {fmtShort(track.end)}
              {track.remark ? ` · ${track.remark}` : ""}
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-[#22D3EE]">{phasePct}%</div>
          <div className="text-[10px] text-[#6B7280]">
            階段 {completedPhases}/{phases.length} · 時間 {timePct}%
          </div>
        </div>
      </div>

      {/* 甘特分段 */}
      <div className="relative mb-3 h-12 rounded-lg bg-[#0B0F14]">
        {phases.map((phase) => {
          const { left, width } = barPct(phase.start, phase.end, rangeStart, rangeEnd);
          const cls = phase.kind === "draft" ? phaseColors.draft : phaseColors.revision;
          return (
            <div
              key={phase.id}
              className={`absolute top-2 flex h-8 items-center justify-center overflow-hidden rounded-md px-1 text-[9px] font-bold ${cls}`}
              style={{ left: `${left}%`, width: `${width}%`, minWidth: "2px" }}
              title={`${phase.label} (${fmtShort(phase.start)}–${fmtShort(phase.end)})`}
            >
              {width > 6 && <span className="truncate">{phase.label}</span>}
            </div>
          );
        })}
      </div>

      {/* 累積百分比進度條 */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] text-[#9CA3AF]">
          <span>累積進度（階段加權）</span>
          <span className="font-mono font-bold text-emerald-300">{phasePct}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-[#1F2937]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-[#22D3EE] transition-all duration-500"
            style={{ width: `${Math.min(100, phasePct)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-[#6B7280]">
          <span>時間進度</span>
          <span className="font-mono">{timePct}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#1F2937]">
          <div
            className="h-full rounded-full bg-[#6B7280]/60"
            style={{ width: `${Math.min(100, timePct)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function parseDay(iso: string) {
  return new Date(`${iso}T00:00:00`).getTime();
}

export function SurveyMasterGantt({
  tracks,
  getPhases,
}: {
  tracks: SurveyTrack[];
  getPhases: (track: SurveyTrack) => SurveyPhase[];
}) {
  const { start, end, title, subtitle } = surveyGanttRange;
  const today = currentSurveyDay();
  const cols = weekColumns(start, end);
  const rawTodayPct = ((parseDay(today) - parseDay(start)) / (parseDay(end) - parseDay(start))) * 100;
  const todayPct = Math.min(100, Math.max(0, rawTodayPct));
  const pastEnd = parseDay(today) > parseDay(end);

  return (
    <div className="rounded-2xl border border-[#1F2937] bg-[#111827] p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-black text-[#E6EDF3] md:text-2xl">{title}</h2>
        <p className="mt-2 text-sm text-[#9CA3AF]">{subtitle}</p>
      </div>

      <PhaseLegend />

      {/* 時間刻度 */}
      <div className="relative mt-6 mb-2 hidden h-8 border-b border-[#1F2937] sm:block">
        {cols.map((c, index) => (
          <span
            key={`${c.label}-${index}`}
            className="absolute -translate-x-1/2 text-[10px] text-[#6B7280]"
            style={{ left: `${c.pct}%` }}
          >
            {c.label}
          </span>
        ))}
        <div
          className="pointer-events-none absolute -top-1 bottom-0 z-20 w-0.5 bg-red-400"
          style={{ left: `${todayPct}%` }}
          title={`今日 ${fmtShort(today)}`}
        />
      </div>

      <div className="relative mt-4 space-y-4">
        <div
          className="pointer-events-none absolute top-0 bottom-0 z-10 hidden w-0.5 bg-red-400/70 sm:block"
          style={{ left: `${todayPct}%` }}
        />
        {tracks.map((track) => (
          <div key={track.id}>
            <TrackRow
              track={track}
              phases={getPhases(track)}
              rangeStart={start}
              rangeEnd={end}
              today={today}
            />
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-[#6B7280]">
        {pastEnd
          ? `預定寫到 ${fmtShort(end)}，今天是 ${fmtShort(today)}，這段已經過了。百分比依當初的排程算到結束。`
          : `紅線是今天（${fmtShort(today)}）。百分比依「初稿 + 每週修改」計算。`}
      </p>
    </div>
  );
}

export function SurveyTrackDetailGantt({ track, phases }: { track: SurveyTrack; phases: SurveyPhase[] }) {
  const { start, end } = surveyGanttRange;
  const today = currentSurveyDay();
  return (
    <div className="space-y-6">
      <TrackRow track={track} phases={phases} rangeStart={start} rangeEnd={end} today={today} showMeta />

      <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-5">
        <h3 className="mb-4 text-sm font-bold text-[#9CA3AF]">階段明細</h3>
        <div className="space-y-2">
          {phases.map((p, i) => {
            const done = parseDay(p.end) < parseDay(today);
            const active = parseDay(p.start) <= parseDay(today) && parseDay(today) <= parseDay(p.end);
            return (
              <div
                key={p.id}
                className={`flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm ${
                  active ? "border border-[#22D3EE]/40 bg-[#22D3EE]/10" : done ? "bg-emerald-400/5" : "bg-[#0F172A]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 text-[#6B7280]">{i + 1}</span>
                  <span className={`font-semibold ${p.kind === "draft" ? "text-amber-300" : "text-violet-300"}`}>
                    {p.label}
                  </span>
                </div>
                <span className="font-mono text-xs text-[#9CA3AF]">
                  {fmtShort(p.start)} — {fmtShort(p.end)}
                </span>
                <span className="text-xs text-[#6B7280]">
                  {done ? "已完成" : active ? "進行中" : "未開始"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
