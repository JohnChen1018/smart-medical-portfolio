import fs from "node:fs";

const path = "src/components/projects/WorkflowDashboard.tsx";
let s = fs.readFileSync(path, "utf8");

const u = JSON.parse(
  fs.readFileSync("src/lib/wsiUiLabels.ts", "utf8").match(/export const wsiUi = (\{[\s\S]*?\n\};)/)?.[1]
    ?.replace(/;$/, "") ?? "{}",
);

// Fix highlight badge (only in application card)
s = s.replace(
  /(\{card\.highlight && \(\s*<span[^>]*>\s*)\?\?/,
  `$1{wsiUi.application.highlight}`,
);

// Data tab - use wsiUi.data for hardcoded Chinese that's still OK, fix labels that use direct strings
const d = u.data;
s = s.replace(
  /<span>授權：\{ds\.license\}<\/span>/,
  `<span>{wsiUi.data.licensePrefix}{ds.license}</span>`,
);
s = s.replace(
  /資料位置：<span className="font-mono">\{d\.path\}<\/span>/,
  `{wsiUi.data.pathPrefix}<span className="font-mono">{d.path}</span>`,
);
s = s.replace(
  /訓練 \/ 驗證 \/ 測試影像張數（80 \/ 10 \/ 10，共 \{datasetSplit\.total\} 張）/,
  `{wsiUi.data.splitTitle} {datasetSplit.total} {wsiUi.data.splitSuffix}`,
);
s = s.replace(/label="總 patch 數"/g, `label={wsiUi.data.totalPatches}`);
s = s.replace(/label="訓練 Train \(80%\)"/g, `label={wsiUi.data.train}`);
s = s.replace(/label="驗證 Valid \(10%\)"/g, `label={wsiUi.data.valid}`);
s = s.replace(/label="測試 Test \(10%\)"/g, `label={wsiUi.data.test}`);
s = s.replace(
  /細胞核類別：共 \{classCounts\.length\} 類，總計 \{totalNuclei\.toLocaleString\(\)\} 顆（中央 224x224 計數）/,
  `{wsiUi.data.classTitlePrefix} {classCounts.length} {wsiUi.data.classTitleMid} {totalNuclei.toLocaleString()} {wsiUi.data.classTitleSuffix}`,
);
s = s.replace(/<th className="px-4 py-3">類別<\/th>/, `<th className="px-4 py-3">{wsiUi.data.colClass}</th>`);
s = s.replace(/<th className="px-4 py-3 text-right">細胞核數量<\/th>/, `<th className="px-4 py-3 text-right">{wsiUi.data.colCount}</th>`);
s = s.replace(/<th className="px-4 py-3 text-right">占比<\/th>/, `<th className="px-4 py-3 text-right">{wsiUi.data.colPct}</th>`);
s = s.replace(/<th className="px-4 py-3">分佈<\/th>/, `<th className="px-4 py-3">{wsiUi.data.colDist}</th>`);
s = s.replace(
  /全部 patch 影像（共 \{datasetSplit\.total\.toLocaleString\(\)\} 張，已顯示 \{images\.length\} 張）/,
  `{wsiUi.data.galleryPrefix} {datasetSplit.total.toLocaleString()} {wsiUi.data.galleryMid} {images.length} {wsiUi.data.gallerySuffix}`,
);
s = s.replace(
  /載入更多（\{shownCount\} \/ \{datasetSplit\.total\}）/,
  `{wsiUi.data.loadMore}（{shownCount} / {datasetSplit.total}）`,
);

// Modeling
const m = u.modeling;
s = s.replace(
  /<SectionHeader title="\?\?\?\?" subtitle="\?\?\?\?\?\?\?\?\?\?\?\?\?\?\?\?\?\?\?\?" \/>/,
  `<SectionHeader title={wsiUi.modeling.title} subtitle={wsiUi.modeling.subtitle} />`,
);
s = s.replace(
  /<div className="text-xs uppercase tracking-\[0\.3em\] text-\[#6B7280\]">\s*\?\?\?\?\s*<\/div>\s*<div className="mt-4 text-5xl font-black text-\[#8B5CF6\]/,
  `<div className="text-xs uppercase tracking-[0.3em] text-[#6B7280]">{wsiUi.modeling.archLabel}</div>\n          <div className="mt-4 text-5xl font-black text-[#8B5CF6]`,
);
s = s.replace(
  /star-convex polygon\?\?\?\? instance segmentation/,
  `{wsiUi.modeling.archDesc}`,
);
s = s.replace(
  /<div className="text-xs uppercase tracking-\[0\.3em\] text-\[#6B7280\]">\s*\?\?\?\s*<\/div>\s*<div className="mt-4 text-5xl font-black text-\[#22D3EE\]/,
  `<div className="text-xs uppercase tracking-[0.3em] text-[#6B7280]">{wsiUi.modeling.optLabel}</div>\n          <div className="mt-4 text-5xl font-black text-[#22D3EE]`,
);
s = s.replace(
  /decoupled weight decay\?\?\?\?\?\?\?\?\?\?/,
  `{wsiUi.modeling.optDesc}`,
);
s = s.replace(/title="\?\?\?\?\? StarDist\?"/, `title={wsiUi.modeling.whyStarDist}`);
s = s.replace(/title="\?\?\?\?\? AdamW\?"/, `title={wsiUi.modeling.whyAdamW}`);
s = s.replace(/<th className="px-4 py-3">\?\?<\/th>\s*<th className="px-4 py-3">\?\?<\/th>/, `<th className="px-4 py-3">{wsiUi.modeling.colPoint}</th>\n                <th className="px-4 py-3">{wsiUi.modeling.colDetail}</th>`);

// StarDist / AdamW figures
s = s.replace(
  /\?\?StarDist[\s\S]*?<br \/>\?\?\?\?\?\?\?\? PPT \?\?\?\?\?/,
  `{wsiUi.modeling.starDistCaption1}\n        <br />{wsiUi.modeling.starDistCaption2}`,
);
s = s.replace(
  /weight decay \?\?\?\?\?\?\?\?\?\?\?\?\?\?\?\?\?\?\?\?\?\?\?\?\?/,
  `{wsiUi.modeling.adamDesc}`,
);
s = s.replace(/\? \?\? weight decay/, `{wsiUi.modeling.adamWArrow}`);
s = s.replace(/AdamW\?\?\?\?\?/, `{wsiUi.modeling.adamWLabel}`);
s = s.replace(
  /weight decay \?\?\?\?\?\?\?\?decoupled\?\?\?\?\?\?\?\?\?\?\?\?/,
  `{wsiUi.modeling.adamWDesc}`,
);
s = s.replace(
  /\?\?AdamW \? weight decay \?\?\?\?\?\?\?\?\?\?/,
  `{wsiUi.modeling.adamWCaption}`,
);

// Simulation
s = s.replace(/<SectionHeader title="\?\?\?\?" \/>/, `<SectionHeader title={wsiUi.simulation.title} />`);
s = s.replace(/\?\?\?\?\?\?/, `{wsiUi.simulation.metricsBtn}`);
s = s.replace(/<h3 className="text-sm font-bold text-\[#E6EDF3\]">\?\?\?\?\?\?<\/h3>/, `<h3 className="text-sm font-bold text-[#E6EDF3]">{wsiUi.simulation.liveTitle}</h3>`);
s = s.replace(
  /\{status\?\.connected \? `\?\?\?\?\$\{status\.machine\}` : "\?\?\?\?"\}/,
  `{status?.connected ? \`\${wsiUi.simulation.connected}\${status.machine}\` : wsiUi.simulation.disconnected}`,
);
s = s.replace(/<LiveBox label="\?\?" value=\{status\?\.framework/, `<LiveBox label={wsiUi.simulation.framework} value={status?.framework`);
s = s.replace(/<LiveBox label="\?\?\?\?" value=\{status\?\.currentConfig/, `<LiveBox label={wsiUi.simulation.currentConfig} value={status?.currentConfig`);
s = s.replace(/label="RUN \?\?"/, `label={wsiUi.simulation.runProgress}`);
s = s.replace(/label="EPOCH \?\?"/, `label={wsiUi.simulation.epochProgress}`);
s = s.replace(
  /value=\{status \? `\? \$\{status\.run\} \/ \$\{status\.totalRuns\} Run` : "-"\}/,
  `value={status ? fmtRun(status.run, status.totalRuns) : "-"}`,
);
s = s.replace(
  /value=\{status \? `\? \$\{status\.epoch\} \/ \$\{status\.totalEpochs\} Epoch` : "-"\}/,
  `value={status ? fmtEpoch(status.epoch, status.totalEpochs) : "-"}`,
);
s = s.replace(/<span>Epoch \?\?<\/span>/, `<span>{wsiUi.simulation.epochBar}</span>`);
s = s.replace(
  /\?\?\? \{status\.elapsedSeconds\} \?\?\?\? \{status\.status\}/,
  `{fmtElapsed(status.elapsedSeconds, status.status)}`,
);
s = s.replace(/<h3 className="mb-2 text-sm font-bold text-\[#E6EDF3\]">\?\?\?\?<\/h3>/, `<h3 className="mb-2 text-sm font-bold text-[#E6EDF3]">{wsiUi.simulation.envTitle}</h3>`);
s = s.replace(/<p className="text-sm text-\[#9CA3AF\]">\?\?\?PyTorch<\/p>/, `<p className="text-sm text-[#9CA3AF]">{wsiUi.simulation.envValue}</p>`);
s = s.replace(/label="\?\?\?\?\?\?\?\?\?\? 10 runs\?"/, `label={wsiUi.simulation.configsDone}`);
s = s.replace(/label="\?\? RUN \?"/, `label={wsiUi.simulation.runsPerConfig}`);
s = s.replace(/label="\?\?\?\?\?\?"/, `label={wsiUi.simulation.bestConfig}`);
s = s.replace(
  /\?\?\?\? 1 - \{totalConfigsPlanned\}\?\?\?\?\?\?\?\?\?\?/,
  `{wsiUi.simulation.configListPrefix} {totalConfigsPlanned} {wsiUi.simulation.configListSuffix}`,
);
s = s.replace(/\?\?\?\?/g, (match, offset) => {
  // context-specific - skip if already fixed
  return match;
});

fs.writeFileSync(path, s, "utf8");
console.log("Patched", path);
