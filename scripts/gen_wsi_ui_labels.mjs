import fs from "node:fs";

const labels = {
  workflowTitle: "研究工作流程",
  tabs: {
    application: "應用",
    data: "資料",
    modeling: "建模",
    simulation: "模擬",
    analysis: "分析",
  },
  application: {
    highlight: "重點",
    flipHint: "滑鼠移上看詳細，點擊開啟來源",
  },
  data: {
    licensePrefix: "授權：",
    pathPrefix: "資料位置：",
    splitTitle: "訓練 / 驗證 / 測試影像張數（80 / 10 / 10，共",
    splitSuffix: "張）",
    totalPatches: "總 patch 數",
    train: "訓練 Train (80%)",
    valid: "驗證 Valid (10%)",
    test: "測試 Test (10%)",
    classTitlePrefix: "細胞核類別：共",
    classTitleMid: "類，總計",
    classTitleSuffix: "顆（中央 224x224 計數）",
    colIndex: "#",
    colClass: "類別",
    colCount: "細胞核數量",
    colPct: "占比",
    colDist: "分佈",
    galleryPrefix: "全部 patch 影像（共",
    galleryMid: "張，已顯示",
    gallerySuffix: "張）",
    loadMore: "載入更多",
  },
  modeling: {
    title: "模型設定",
    subtitle: "本研究採用的網路架構與優化器，以及選擇理由。",
    archLabel: "網路架構",
    archDesc: "star-convex polygon，細胞核 instance segmentation",
    optLabel: "優化器",
    optDesc: "decoupled weight decay，本研究唯一使用的優化器",
    whyStarDist: "為什麼使用 StarDist？",
    whyAdamW: "為什麼只用 AdamW？",
    colPoint: "重點",
    colDetail: "說明",
    starDistCaption1: "圖：StarDist 以中心點放射狀距離組成 star-convex 多邊形描繪細胞核邊界",
    starDistCaption2: "（示意圖，可替換成你 PPT 的架構圖）",
    adamDesc: "weight decay 混在自適應梯度更新裡（與學習率耦合，正則化較不乾淨）",
    adamWArrow: "↓ 解耦 weight decay",
    adamWLabel: "AdamW（本研究）",
    adamWDesc: "weight decay 獨立套用在權重上（decoupled，正則化更乾淨、泛化更穩定）",
    adamWCaption: "圖：AdamW 把 weight decay 從自適應學習率中分離",
  },
  simulation: {
    title: "訓練模擬",
    metricsBtn: "評量指標解析",
    liveTitle: "即時訓練狀態",
    connected: "已連線：",
    disconnected: "尚未連線",
    framework: "框架",
    currentConfig: "目前配置",
    runProgress: "RUN 進度",
    epochProgress: "EPOCH 進度",
    runFmt: (run, total) => `第 ${run} / ${total} Run`,
    epochFmt: (epoch, total) => `第 ${epoch} / ${total} Epoch`,
    epochBar: "Epoch 進度",
    elapsedFmt: (sec, status) => `已運行 ${sec} 秒，狀態 ${status}`,
    envTitle: "訓練環境",
    envValue: "框架：PyTorch",
    configsDone: "已完成參數組合（每組 10 runs）",
    runsPerConfig: "每組 RUN 數",
    bestConfig: "目前最佳配置",
    configListPrefix: "參數組合 1 -",
    configListSuffix: "（點擊展開該組評量指標）",
    bestBadge: "目前最佳",
    pendingConfig: "尚未匯入（其他配置 / 雲端）",
    expand: "展開",
    collapse: "收合",
    modalTitle: "評量指標解析",
    modalIntro: "本研究使用的評量指標，以及每個指標在做什麼：",
  },
  analysis: {
    title: "結果分析",
    subtitle: "各配置 10-run 平均評量指標，並可開啟與對比 paper 的完整比較頁。",
    compareBtn: "對比 paper（開啟完整比較頁）",
    bestBadge: "全部跑最好的成績",
    bestFmt: (expId, student) => `exp_${expId}，StarDist + AdamW，by ${student}`,
    rankTitlePrefix: "全部配置排名（依 mPQ+ 由高到低，共",
    rankTitleSuffix: "組）",
    colConfig: "配置",
    colArch: "架構+優化器",
    bestRow: "綜合最佳",
    rankNote: "綠底=綜合最佳（mPQ+ 最高）；Recall 欄粗體=召回率最高的配置。",
    backToAnalysis: "回到結果分析",
    compareTitle: "對比 paper",
    colMetric: "指標",
    colDiff: "差距",
    colConclusion: "結論",
    oursFmt: (expId) => `Ours（exp_${expId} 最佳）`,
    baselineNoteTitle: "關於兩個基準",
    baselineNote:
      "目前「對比最佳」欄是 Mask-RCNN-ResNet50-SE-FPN 與 SRM-HoVer-Net 兩個基準中，每個指標的較佳值。若你要把這兩個方法各自一欄分開列，我需要你提供這兩個方法各自的數字。",
    pillAuthor: "作者",
    pillJournal: "期刊",
    pillRank: "排名",
    pillMethod: "評估方式",
  },
};

// Write as TypeScript with functions inlined
const ts = `// AUTO-GENERATED — UI labels for WorkflowDashboard (UTF-8)
export const wsiUi = ${JSON.stringify(
  {
    workflowTitle: labels.workflowTitle,
    tabs: labels.tabs,
    application: labels.application,
    data: labels.data,
    modeling: labels.modeling,
    simulation: {
      title: labels.simulation.title,
      metricsBtn: labels.simulation.metricsBtn,
      liveTitle: labels.simulation.liveTitle,
      connected: labels.simulation.connected,
      disconnected: labels.simulation.disconnected,
      framework: labels.simulation.framework,
      currentConfig: labels.simulation.currentConfig,
      runProgress: labels.simulation.runProgress,
      epochProgress: labels.simulation.epochProgress,
      epochBar: labels.simulation.epochBar,
      envTitle: labels.simulation.envTitle,
      envValue: labels.simulation.envValue,
      configsDone: labels.simulation.configsDone,
      runsPerConfig: labels.simulation.runsPerConfig,
      bestConfig: labels.simulation.bestConfig,
      configListPrefix: labels.simulation.configListPrefix,
      configListSuffix: labels.simulation.configListSuffix,
      bestBadge: labels.simulation.bestBadge,
      pendingConfig: labels.simulation.pendingConfig,
      expand: labels.simulation.expand,
      collapse: labels.simulation.collapse,
      modalTitle: labels.simulation.modalTitle,
      modalIntro: labels.simulation.modalIntro,
    },
    analysis: labels.analysis,
  },
  null,
  2,
)};

export function fmtRun(run: number, total: number) {
  return \`第 \${run} / \${total} Run\`;
}

export function fmtEpoch(epoch: number, total: number) {
  return \`第 \${epoch} / \${total} Epoch\`;
}

export function fmtElapsed(sec: number, status: string) {
  return \`已運行 \${sec} 秒，狀態 \${status}\`;
}

export function fmtBest(expId: number, student: string) {
  return \`exp_\${expId}，StarDist + AdamW，by \${student}\`;
}

export function fmtOurs(expId: number) {
  return \`Ours（exp_\${expId} 最佳）\`;
}
`;

fs.writeFileSync("src/lib/wsiUiLabels.ts", ts, "utf8");
console.log("Wrote src/lib/wsiUiLabels.ts");
