export type PhaseKind = "draft" | "revision";

export interface SurveyPhase {
  id: string;
  label: string;
  kind: PhaseKind;
  start: string;
  end: string;
  revisionNum?: number;
}

export interface SurveyTrack {
  id: string;
  title: string;
  group: string;
  color: string;
  start: string;
  end: string;
  remark?: string;
}

/** 全專案時間軸：7 月–8 月（9 月延伸備援） */
export const surveyGanttRange = {
  start: "2026-07-01",
  end: "2026-09-30",
  title: "四個主題的進度（7 月到 9 月）",
  subtitle: "前兩週寫初稿，之後每週改一次。",
  today: "2026-07-06",
};

export function currentSurveyDay(now = new Date()) {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** 四條 Survey Paper（前三條對照 Excel，第四條為新增） */
export const surveyTracks: SurveyTrack[] = [
  {
    id: "survey-mpox",
    title: "猴痘 Survey Paper",
    group: "寫猴痘綜述",
    color: "#f97316",
    start: "2026-07-01",
    end: "2026-07-31",
  },
  {
    id: "survey-cat-lymphoma",
    title: "貓淋巴癌 Survey Paper",
    group: "貓淋巴癌臨床應用",
    color: "#22c55e",
    start: "2026-07-01",
    end: "2026-08-15",
  },
  {
    id: "survey-wsi",
    title: "WSI Survey Paper",
    group: "寫全切片綜述",
    color: "#a855f7",
    start: "2026-08-01",
    end: "2026-08-31",
    remark: "可以延伸到 9 月底",
  },
  {
    id: "survey-cross-review",
    title: "Survey Paper 交叉修訂",
    group: "幾篇一起再改",
    color: "#22d3ee",
    start: "2026-09-01",
    end: "2026-09-30",
    remark: "9 月再一起改一次",
  },
];

const DAY_MS = 86400000;

export const surveyTopics = Object.fromEntries(
  surveyTracks.map((t) => [
    t.id,
    {
      title: t.title,
      group: t.group,
      color: t.color,
      rangeStart: surveyGanttRange.start,
      rangeEnd: surveyGanttRange.end,
      trackStart: t.start,
      trackEnd: t.end,
      remark: t.remark,
      phases: buildSurveyPhases(t.start, t.end),
    },
  ]),
);

export type SurveyTopicPlan = (typeof surveyTopics)[string];

export const surveyHubDeadline = "初稿：各主題開始後 2 週內完成";

export function parseDay(iso: string) {
  return new Date(`${iso}T00:00:00`).getTime();
}

export function fmtShort(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function toIso(ms: number) {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 前 2 週初稿，之後每 7 天一次修改（第 2、3、4…次）直到結束 */
export function buildSurveyPhases(startIso: string, endIso: string): SurveyPhase[] {
  const start = parseDay(startIso);
  const end = parseDay(endIso);
  if (end < start) return [];

  const phases: SurveyPhase[] = [];
  const draftEnd = Math.min(start + 14 * DAY_MS - DAY_MS, end);

  phases.push({
    id: "draft",
    label: "初稿（2 週）",
    kind: "draft",
    start: startIso,
    end: toIso(draftEnd),
  });

  let cursor = draftEnd + DAY_MS;
  let revNum = 2;
  while (cursor <= end) {
    const weekEnd = Math.min(cursor + 6 * DAY_MS, end);
    phases.push({
      id: `rev-${revNum}`,
      label: `第 ${revNum} 次修改`,
      kind: "revision",
      start: toIso(cursor),
      end: toIso(weekEnd),
      revisionNum: revNum,
    });
    cursor = weekEnd + DAY_MS;
    revNum += 1;
  }

  return phases;
}

/** 時間軸累積進度（0–100） */
export function timeProgress(startIso: string, endIso: string, todayIso = currentSurveyDay()) {
  const start = parseDay(startIso);
  const end = parseDay(endIso);
  const today = parseDay(todayIso);
  if (today <= start) return 0;
  if (today >= end) return 100;
  return Math.round(((today - start) / (end - start)) * 1000) / 10;
}

/** 階段累積進度：已完成階段 + 當前階段部分 */
export function phaseProgress(phases: SurveyPhase[], todayIso = currentSurveyDay()) {
  if (!phases.length) return 0;
  const today = parseDay(todayIso);
  let completed = 0;
  for (let i = 0; i < phases.length; i++) {
    const p = phases[i];
    const ps = parseDay(p.start);
    const pe = parseDay(p.end);
    if (today > pe) {
      completed += 1;
    } else if (today >= ps) {
      const frac = (today - ps) / Math.max(pe - ps, 1);
      return Math.round(((completed + frac) / phases.length) * 1000) / 10;
    } else {
      break;
    }
  }
  return Math.round((completed / phases.length) * 1000) / 10;
}

export function weekColumns(rangeStart: string, rangeEnd: string) {
  const cols: { label: string; pct: number }[] = [];
  const t0 = parseDay(rangeStart);
  const t1 = parseDay(rangeEnd);
  const span = Math.max(t1 - t0, 1);
  let cur = t0;
  while (cur < t1) {
    cols.push({ label: fmtShort(toIso(cur)), pct: ((cur - t0) / span) * 100 });
    cur += 7 * DAY_MS;
  }
  cols.push({ label: fmtShort(rangeEnd), pct: 100 });
  return cols;
}

export function pctInRange(dateIso: string, rangeStart: string, rangeEnd: string) {
  const t0 = parseDay(rangeStart);
  const t1 = parseDay(rangeEnd);
  const span = Math.max(t1 - t0, 1);
  return ((parseDay(dateIso) - t0) / span) * 100;
}

export function barPct(startIso: string, endIso: string, rangeStart: string, rangeEnd: string) {
  const left = pctInRange(startIso, rangeStart, rangeEnd);
  const right = pctInRange(endIso, rangeStart, rangeEnd);
  return { left: Math.max(0, left), width: Math.max(0.5, right - left) };
}
