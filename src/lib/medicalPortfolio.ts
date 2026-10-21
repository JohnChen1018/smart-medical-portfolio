import { Project } from "@/lib/types";

export const rolePassword = process.env.MEDICAL_PORTFOLIO_PASSWORD ?? "m215";

export const workflowSteps = [
  {
    key: "application",
    label: "應用",
    description: "這題要幫誰、解決什麼問題。",
  },
  {
    key: "data",
    label: "資料",
    description: "影像從哪來、怎麼整理。",
  },
  {
    key: "modeling",
    label: "建模",
    description: "模型打算怎麼做。",
  },
  {
    key: "simulation",
    label: "模擬",
    description: "假設上傳一筆資料，系統會顯示什麼。",
  },
  {
    key: "analysis",
    label: "分析",
    description: "成績、錯誤案例，以及還沒補上的部分。",
  },
];

export function getWorkflowContent(project: Project, workflowKey: string) {
  const step = workflowSteps.find((item) => item.key === workflowKey);
  if (!step || !project.content) return null;

  const pattern = new RegExp(
    `## ${step.label}\\n([\\s\\S]*?)(?=\\n## |$)`,
    "u",
  );
  const match = project.content.match(pattern);

  return match?.[1]?.trim() ?? null;
}

export function updateWorkflowContent(project: Project, workflowKey: string, body: string) {
  const step = workflowSteps.find((item) => item.key === workflowKey);
  if (!step) return project.content || "";

  const header = `## ${step.label}`;
  const content = project.content || "";
  const pattern = new RegExp(`## ${step.label}\\n([\\s\\S]*?)(?=\\n## |$)`, "u");
  const nextBody = body.trim();

  if (pattern.test(content)) {
    return content.replace(pattern, `${header}\n${nextBody}\n`);
  }
  const prefix = content.trim() ? `${content.trim()}\n\n` : "";
  return `${prefix}${header}\n${nextBody}\n`;
}

export const statusTabs = [
  { key: "in-progress", label: "進行中", description: "還在做的題目。" },
  { key: "completed", label: "已完成", description: "已經做完，可以拿來報告。" },
  { key: "not-started", label: "未完成", description: "還沒開始，或還在等資料。" },
];

export const projectStatusLabels: Record<string, string> = {
  "not-started": "未完成",
  "in-progress": "進行中",
  completed: "已完成",
  planned: "未完成",
  developing: "進行中",
  live: "已完成",
  archived: "已完成",
};

export const projectStatusMeta: Record<
  string,
  { label: string; dot: string; text: string; border: string; bg: string }
> = {
  "not-started": {
    label: "未完成",
    dot: "bg-sky-400",
    text: "text-sky-300",
    border: "border-sky-400/40",
    bg: "bg-sky-400/10",
  },
  "in-progress": {
    label: "進行中",
    dot: "bg-yellow-400",
    text: "text-yellow-300",
    border: "border-yellow-400/20",
    bg: "bg-yellow-400/10",
  },
  completed: {
    label: "已完成",
    dot: "bg-emerald-400",
    text: "text-emerald-300",
    border: "border-emerald-400/20",
    bg: "bg-emerald-400/10",
  },
};

const medicalProjectSeed: Project[] = [
  {
    id: "cat-lymphoma",
    title: "貓淋巴癌辨識",
    description: "整理貓淋巴癌的研究流程。成績和錯誤案例之後再補。",
    category: "獸醫 AI",
    tags: ["應用", "資料", "建模", "模擬", "分析"],
    status: "in-progress",
    imageUrl:
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=900&h=650&fit=crop",
    demoUrl: null,
    repoUrl: null,
    content: `# 貓淋巴癌辨識

## 應用
此作品用來整理貓淋巴癌相關研究流程，目標是建立可展示給老師看的智慧醫療/獸醫 AI 應用架構。

## 資料
- 資料型態：病理影像、檢驗資料或臨床紀錄
- 前處理：資料清理、欄位整理、影像尺寸統一
- 標註：正常 / 疑似 / 淋巴癌相關分類

## 建模
- 模型方向：分類模型或影像特徵模型
- 訓練指標：accuracy、recall、F1-score
- 後續可加入模型架構圖與訓練曲線

## 模擬
- 模擬老師或使用者上傳一筆資料後，系統顯示輔助判讀結果
- 比較模型輸出與人工標註或診斷結果

## 分析
- 目前狀態：進行中
- 待補內容：資料來源、模型結果、錯誤案例與結論
- 最終會補上訓練圖、表格與研究限制`,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "whole-slide-object-detection",
    title: "全切片影像多物件偵測",
    description: "用 AI 在全切片病理影像裡找出細胞核，並做分割和分類。",
    category: "病理影像",
    tags: ["應用", "資料", "建模", "模擬", "分析"],
    status: "in-progress",
    imageUrl:
      "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=900&h=650&fit=crop",
    demoUrl: null,
    repoUrl: null,
    content: `# 全切片影像多物件偵測

## 應用
### 一句話說明
本研究希望用 AI 協助病理影像分析，在全切片影像中自動找出、分割並分類細胞核，降低人工標記、計數與判讀負擔。

### 為什麼這個題目重要？
病理影像是癌症診斷與研究中非常重要的依據。National Cancer Institute 指出，病理報告能提供癌症診斷、分期與治療規劃相關資訊；歐洲癌症登錄建議也提到，多數癌症病例有顯微鏡確認依據，比例約落在 79%–98%。因此，若能用 AI 輔助病理影像中的細胞核分析，就能讓研究者更有效率地整理腫瘤微環境資訊。

### 本研究想解決什麼？
| 問題 | 說明 | AI 可協助方向 |
| --- | --- | --- |
| 影像很大 | WSI 解析度高，單張影像可能包含大量細胞與組織結構 | 自動切割區塊、批次分析 |
| 人工標註耗時 | 細胞核標記、分類、計數需要大量人工時間 | 自動偵測、分割、分類 |
| 判讀差異 | 不同人可能因經驗與標準不同而有差異 | 提供一致的量化結果 |
| 報告整理困難 | 結果需要整理成可比較的表格與指標 | 自動輸出統計與指標 |

### 應用定位
| 項目 | 內容 |
| --- | --- |
| 對象 | 病理影像研究、細胞核分析、專題報告 |
| 任務 | 細胞核偵測、instance segmentation、classification |
| 輸出 | 細胞核位置、類別、數量、評估指標 |
| 注意 | 目前作為研究與報告展示，不作為臨床診斷系統 |

### 可放入報告的重點句
本研究以全切片病理影像為應用場景，透過深度學習模型自動偵測並分類細胞核，目標是降低人工分析負擔，並提供可量化、可比較的病理影像分析結果。

### 來源
- National Cancer Institute, Surgical Pathology Reports: https://www.cancer.gov/about-cancer/diagnosis-staging/diagnosis/pathology-reports-fact-sheet
- Visser et al. (2023), European basis of diagnosis recommendations: https://doi.org/10.3389/fonc.2023.1250549
- Pantanowitz et al. (2020), AI-assisted breast mitoses counting: https://doi.org/10.1186/s13000-020-00995-z
- Histopathological image analysis as cancer diagnosis gold standard, Nature Communications: https://www.nature.com/articles/s41467-025-57587-y

## 資料
### 資料集總覽
本研究使用 Lizard 資料集。Lizard 是大型結腸病理影像細胞核 instance segmentation 與 classification 資料集，也是 CoNIC Challenge 相關研究常用的重要基準資料。

| 項目 | 內容 |
| --- | --- |
| 資料集 | Lizard |
| 影像類型 | H&E 染色結腸病理影像 |
| 任務 | 細胞核 instance segmentation / classification |
| 標註規模 | 495,179 顆細胞核 |
| 切分比例 | Train / Validation / Test = 80% / 10% / 10% |
| 研究用途 | 訓練與評估細胞核偵測、分割、分類模型 |

### 資料切分設計
| 子集 | 比例 | 用途 |
| --- | ---: | --- |
| Training | 80% | 用來訓練模型參數 |
| Validation | 10% | 用來調整超參數與觀察模型收斂 |
| Testing | 10% | 用來做最終評估與論文比較 |

### 為什麼使用 Lizard？
- 標註數量大，適合深度學習模型訓練。
- 任務與本研究目標一致，包含細胞核分割與分類。
- 與 CoNIC Challenge 相關，方便與公開研究比較。
- 適合建立可展示給老師看的資料、建模、模擬與分析流程。

### 資料處理流程
| 步驟 | 說明 |
| --- | --- |
| 讀取資料 | 取得影像與細胞核標註 |
| 前處理 | 影像正規化、patch / tile 形式整理 |
| 切分資料 | 依 80/10/10 建立 train、validation、test |
| 模型輸入 | 將影像與標註轉成 StarDist 可使用格式 |
| 評估輸出 | 取得 segmentation 與 classification 指標 |

### 來源
- Lizard dataset paper: https://doi.org/10.1109/ICCVW54120.2021.00082
- CoNIC Challenge paper: https://doi.org/10.1016/j.media.2023.103047

## 建模
### 模型設定
本研究的建模核心為 StarDist 架構，優化器使用 AdamW。StarDist 適合處理接近星狀形態的細胞核物件，可用於細胞核 instance segmentation；AdamW 則透過 decoupled weight decay 改善正則化設計，較適合深度學習模型訓練。

| 類別 | 設定 |
| --- | --- |
| 網路架構 | StarDist |
| 優化器 | AdamW |
| 任務 | 細胞核偵測、分割、分類 |
| 設計概念 | Small but beautiful，小而美、輕量化 |
| 主要目標 | 在較低參數量下維持可比較的分割與分類表現 |

### 為什麼選 StarDist？
| 原因 | 說明 |
| --- | --- |
| 適合細胞核 | 細胞核常可用中心點與放射狀邊界描述 |
| Instance segmentation | 可區分相鄰細胞核個體 |
| 輕量化潛力 | 相比大型模型，更適合做小而美的專題設計 |
| 可解釋性 | 輸出與細胞核形狀有直接關係，較容易放入報告說明 |

### 為什麼選 AdamW？
| 項目 | Adam | AdamW |
| --- | --- | --- |
| Weight decay | 與梯度更新混在一起 | 與梯度更新解耦 |
| 正則化 | 可能受自適應學習率影響 | 較符合原始 weight decay 設計 |
| 泛化能力 | 一般 | 通常較穩定 |
| 本研究選擇 | 不是主要選擇 | 使用 AdamW |

### 可放入報告的建模說明
本研究使用 StarDist 作為主要網路架構，搭配 AdamW 優化器進行訓練。模型設計重點不是單純追求大型架構，而是希望在較低參數量下，仍能維持細胞核分割與分類表現，符合「小而美」的設計方向。

### 來源
- CoNIC Challenge paper: https://doi.org/10.1016/j.media.2023.103047
- Adam: https://arxiv.org/abs/1412.6980
- AdamW: https://arxiv.org/abs/1711.05101

## 模擬
### 目前狀態
模擬階段目前已經跑完，但依照你的需求，這一頁先不放完整訓練細節，避免和最終成果頁混在一起。這裡先保留作為之後放 RUN 紀錄、訓練曲線、硬體環境與模型選擇紀錄的位置。

### 模擬階段可以放什麼？
| 區塊 | 內容 |
| --- | --- |
| RUN 設定 | 不同超參數組合、模型版本、優化器設定 |
| 訓練紀錄 | epoch、loss、validation 指標 |
| 硬體環境 | GPU、CPU、RAM、訓練時間 |
| 模型比較 | 不同架構或不同參數的表現 |
| 錯誤紀錄 | 訓練失敗、過擬合、類別不平衡等問題 |

### 後續建議排版
| 排版區域 | 建議內容 |
| --- | --- |
| 上方卡片 | 訓練環境、框架、RUN 數 |
| 中段表格 | 每次 RUN 的設定與結果 |
| 下方圖表 | loss curve、metric curve、best model 標記 |

### 目前先保留的原因
- 訓練模擬已完成，但你目前想先整理應用、資料、建模與分析。
- 若現在放太多 RUN 細節，頁面會混亂。
- 後續可以把 Google Drive 成績檔案整理成表格，再放回此頁。

## 分析
### 分析目標
分析階段的重點是確認本研究模型在多個細胞核分割與分類指標上，是否能和既有研究方法相比，並找出目前表現較好與仍需改善的指標。

### 對比論文資訊
| 項目 | 內容 |
| --- | --- |
| 論文 | A survey on cell nuclei instance segmentation and classification: Leveraging context and attention |
| 期刊 | Medical Image Analysis |
| 出版年份 | 2024 / 2025 |
| 簡報標註 | Q1，排名約 2.8% |
| 研究內容 | 細胞核 instance segmentation / classification，並討論 context 與 attention |
| DOI | https://doi.org/10.1016/j.media.2024.103360 |

### 10-run 平均比較
以下整理自目前簡報中的表格，將 Ours 與對比方法中最佳數值比較。

| 指標 | 對比最佳 | Ours | 差距 | 結論 |
| --- | ---: | ---: | ---: | --- |
| multi mPQ+ | 0.4106 | 0.4460 | +0.0354 | Ours 較高 |
| PQ | 0.5548 | 0.6327 | +0.0779 | Ours 較高 |
| PQ_det / DQ | 0.7176 | 0.8039 | +0.0863 | Ours 較高 |
| PQ_seg / SQ | 0.7662 | 0.7870 | +0.0208 | Ours 較高 |
| epi | 0.5208 | 0.5661 | +0.0453 | Ours 較高 |
| lym | 0.5666 | 0.6547 | +0.0881 | Ours 較高 |
| neu | 0.2068 | 0.1794 | -0.0274 | 對比方法較高 |
| pls | 0.3692 | 0.4517 | +0.0825 | Ours 較高 |
| eos | 0.3248 | 0.2901 | -0.0347 | 對比方法較高 |
| con | 0.5080 | 0.5337 | +0.0257 | Ours 較高 |

### 指標解讀
| 指標類型 | 說明 | 目前觀察 |
| --- | --- | --- |
| 整體品質 | multi mPQ+、PQ | Ours 均高於對比最佳 |
| 偵測能力 | PQ_det / DQ | Ours 提升明顯 |
| 分割品質 | PQ_seg / SQ | Ours 略高 |
| 類別表現 | epi、lym、pls、con | 多數類別 Ours 較好 |
| 較弱類別 | neu、eos | Ours 低於 Mask-RCNN |

### 簡短結論
PQ、DQ、lym、pls 等指標提升明顯；neu、eos 仍較低。整體來看，本研究模型在整體分割與分類品質上具有競爭力，少數細胞類別仍是後續優化重點。

### 後續改善方向
| 問題 | 可能原因 | 改善方向 |
| --- | --- | --- |
| neu / eos 較低 | 類別樣本較少或型態差異大 | 類別重加權、資料增強、針對少數類別調參 |
| 指標波動 | 資料切分與 RUN 差異 | 增加 RUN 數與交叉驗證 |

### 詳細來源
- 對比論文 DOI: https://doi.org/10.1016/j.media.2024.103360
- 對比論文 arXiv: https://arxiv.org/abs/2407.18673`,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "survey-paper",
    title: "Survey Paper",
    description: "四個主題。每個主題前兩週寫初稿，之後每週改一次。",
    category: "文獻回顧",
    tags: ["Survey", "文獻整理"],
    status: "in-progress",
    imageUrl:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=900&h=650&fit=crop",
    demoUrl: null,
    repoUrl: null,
    content: `# Survey Paper

## 概述
進行中的文獻回顧專案。進入後請選擇「猴痘」或「貓淋巴癌」主題查看詳細規劃，初稿目標 2026/7/19 前。`,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "monkeypox",
    title: "猴痘辨識",
    description: "",
    category: "感染疾病 AI",
    tags: ["應用", "資料", "建模", "模擬", "分析"],
    status: "completed",
    imageUrl:
      "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=900&h=650&fit=crop",
    demoUrl: null,
    repoUrl: null,
    content: `# 猴痘辨識

## 應用
此作品用於展示猴痘相關辨識或分類流程，適合放在已完成作品區，讓老師快速查看成果。

## 資料
- 資料型態：皮膚病灶影像或整理後的臨床資料
- 前處理：影像裁切、亮度調整、資料增強
- 標註：猴痘 / 非猴痘 或其他比較類別

## 建模
- 模型方向：Transfer Learning / CNN
- 評估指標：accuracy、loss、precision、recall、F1-score

## 模擬
- 模擬使用者輸入病灶影像後得到分類結果
- 顯示模型信心分數與可能限制

## 分析
- 目前狀態：已完成
- 可展示內容：模型流程、結果摘要、訓練圖與分類成效
- 後續可再補充比較實驗或更多案例`,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "face",
    title: "人臉辨識",
    description: "這頁還沒寫。",
    category: "人臉",
    tags: [],
    status: "not-started",
    imageUrl: "",
    demoUrl: null,
    repoUrl: null,
    content: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const projectFrontIds = ["whole-slide-object-detection", "survey-paper"];

export const medicalProjects: Project[] = [
  ...projectFrontIds.flatMap((id) => {
    const found = medicalProjectSeed.find((item) => item.id === id);
    return found ? [found] : [];
  }),
  ...medicalProjectSeed.filter((item) => !projectFrontIds.includes(item.id)),
];
