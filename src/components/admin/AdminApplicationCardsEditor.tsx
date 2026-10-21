"use client";

import type { ApplicationCard } from "@/lib/wsiDashboard";
import { applicationSection } from "@/lib/wsiDashboard";
import {
  getMergedApplicationSection,
  patchApplicationOverrides,
  type ProjectWithDashboard,
} from "@/lib/wsiCms";

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  const Tag = multiline ? "textarea" : "input";
  return (
    <label className="block text-xs text-slate-400">
      {label}
      <Tag
        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500/50"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={multiline ? 3 : undefined}
      />
    </label>
  );
}

export function AdminApplicationCardsEditor({
  project,
  onChange,
}: {
  project: ProjectWithDashboard;
  onChange: (next: ProjectWithDashboard) => void;
}) {
  const app = getMergedApplicationSection(project);
  const defaults = applicationSection;

  const patchCard = (id: string, patch: Partial<ApplicationCard>) => {
    onChange(patchApplicationOverrides(project, { cards: [{ id, ...patch }] }));
  };

  const patchSection = (patch: { title?: string; intro?: string }) => {
    onChange(patchApplicationOverrides(project, patch));
  };

  return (
    <div className="mt-6 space-y-4 border-t border-slate-700 pt-6">
      <div>
        <h3 className="text-lg font-bold text-slate-100">前台「應用」分頁卡片</h3>
        <p className="mt-1 text-xs text-slate-400">
          訪客看到的翻轉卡片由此編輯；儲存變更後重新整理前台即可看到。
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="區塊標題" value={app.title} onChange={(v) => patchSection({ title: v })} />
        <Field
          label="區塊說明"
          value={app.intro}
          onChange={(v) => patchSection({ intro: v })}
          multiline
        />
      </div>

      <div className="space-y-4">
        {app.cards.map((card) => (
          <details
            key={card.id}
            className="rounded-xl border border-slate-700 bg-slate-900/50 p-4"
            open={card.id === "ai-quant"}
          >
            <summary className="cursor-pointer text-sm font-semibold text-slate-200">
              {card.icon} {card.title}
            </summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="標題" value={card.title} onChange={(v) => patchCard(card.id, { title: v })} />
              <Field label="圖示（emoji）" value={card.icon} onChange={(v) => patchCard(card.id, { icon: v })} />
              <Field
                label="正面摘要"
                value={card.summary}
                onChange={(v) => patchCard(card.id, { summary: v })}
                multiline
              />
              <Field
                label="背面詳述"
                value={card.detail}
                onChange={(v) => patchCard(card.id, { detail: v })}
                multiline
              />
              <Field
                label="來源標籤"
                value={card.sourceLabel}
                onChange={(v) => patchCard(card.id, { sourceLabel: v })}
              />
              <Field
                label="來源網址"
                value={card.sourceUrl}
                onChange={(v) => patchCard(card.id, { sourceUrl: v })}
              />
            </div>
            <button
              type="button"
              className="mt-2 text-xs text-amber-400 hover:underline"
              onClick={() => {
                const d = defaults.cards.find((c) => c.id === card.id);
                if (d) patchCard(card.id, d);
              }}
            >
              還原此卡預設文字
            </button>
          </details>
        ))}
      </div>
    </div>
  );
}
