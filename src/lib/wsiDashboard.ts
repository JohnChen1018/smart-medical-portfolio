export interface ApplicationCard {
  id: string;
  icon: string;
  title: string;
  summary: string;
  detail: string;
  sourceLabel: string;
  sourceUrl: string;
  highlight?: boolean;
  /** emerald = 綠色強調（例如小而美） */
  accent?: "purple" | "emerald" | "cyan";
}

export interface DatasetCard {
  id: string;
  tag: string;
  title: string;
  /** 資料集原名，顯示在中文標題下面 */
  name?: string;
  subtitle: string;
  license: string;
  size: string;
  paperUrl?: string;
  paperLabel?: string;
}

export interface WhyRow {
  point: string;
  detail: string;
  paperUrl?: string;
  paperLabel?: string;
  refDetail?: string;
}

export interface HyperparamItem {
  name: string;
  meaning: string;
  typical?: string;
}

export interface HyperparamSource {
  label: string;
  url: string;
}

export interface ConicParamBar {
  rank: number;
  team: string;
  paramsM: number;
  mPQ?: number;
  highlight?: boolean;
  medal?: string;
  note?: string;
  paperUrl?: string;
  paperLabel?: string;
}

export interface BenchmarkRow {
  metric: string;
  maskRcnn: string;
  hoverNet: string;
  ours: string;
  diff: string;
  note: string;
}

export interface ParamCompareRow {
  method: string;
  params: string;
  paramsNum: number;
  mPQ: string;
  rank?: string;
  note?: string;
}

export interface MetricGlossaryItem {
  key: string;
  name: string;
  what: string;
  formula?: string;
  formulaUrl?: string;
  formulaSource?: string;
}

export interface StudyAdvantage {
  title: string;
  detail: string;
}

export interface ConicLeaderRow {
  rank: string;
  method: string;
  params: string;
  mPQ: string;
  note?: string;
}

export const wsiMeta = {
  projectId: "whole-slide-object-detection",
  connectionLabel: "本機可看",
};

// 應用 — 卡片依重點程度排序（越重要越前面），點擊直接開佐證來源。
export const applicationSection = {
  title: "選擇研究應用",
  intro:
    "本研究用 AI 在全切片病理影像裡找出細胞核，並做分割和分類，少做一些人工標記。",
  cards: [
    {
      id: "annotation-cost",
      icon: "📝",
      title: "人工標註 WSI 成本高",
      summary: "單張 WSI 病理醫師審閱常需 45–90 分鐘；細胞核逐顆標註更貴。",
      detail:
        "在 gigapixel H&E WSI 上，若需逐顆標註細胞核輪廓與分類，工作量遠大於一般 ROI 標註。業界與文獻常見估算：單張 WSI 由病理醫師建立 AI 訓練用 ground truth 可達 45–90 分鐘；細胞核 instance 標註則常按「每張 patch / 每 mm² / 每顆細胞」計價，且需病理醫師覆核。Lizard 資料集亦採半自動（NuClick）+ 人工修正，才能在大規模下維持品質。以 256×256 patch、4981 張估算，若全人工逐顆描邊，成本會是數百至數千小時級別。",
      sourceLabel: "Graham et al. (2021) — Lizard 資料集（NuClick + 人工修正）",
      sourceUrl: "https://doi.org/10.1109/ICCVW54120.2021.00082",
      highlight: true,
    },
    {
      id: "ai-quant",
      icon: "🤖",
      title: "AI 可輔助病理量化工作",
      summary: "AI 工具已用於輔助病理醫師在 WSI 上計數乳癌有絲分裂象，提升準確度與效率。",
      detail:
        "Pantanowitz 等人（2020）評估的是 Lunit 開發的深度學習 AI 工具（Faster R-CNN / ResNet-101），用來在全切片影像上偵測並計數有絲分裂象；24 位病理讀片者在有 AI 輔助時準確度更高、耗時約少 28%。這篇是在驗證「AI 輔助病理量化流程」，不是介紹本研究的 StarDist 模型。",
      sourceLabel: "Pantanowitz et al. (2020) — AI 輔助有絲分裂計數",
      sourceUrl: "https://doi.org/10.1186/s13000-020-00995-z",
      highlight: true,
    },
    {
      id: "gold-standard",
      icon: "🏆",
      title: "組織病理是癌症診斷金標準",
      summary: "組織病理影像分析是癌症診斷與精準醫療的基石。",
      detail:
        "組織病理是診斷與分型實體腫瘤的核心依據，也是精準醫療的基礎。深度學習（CNN、GCN、Transformer）在 WSI 分析上已展現高潛力，可自動化判讀、分級與預後預測。",
      sourceLabel: "Deep Learning WSI Analysis, Laboratory Investigation (2025)",
      sourceUrl:
        "https://www.laboratoryinvestigation.org/article/S0023-6837(25)00096-0/abstract",
      highlight: true,
    },
    {
      id: "solid-tumor-90",
      icon: "🎗️",
      title: "實體腫瘤約占所有癌症 90%",
      summary: "實體腫瘤約占所有癌症的 90%，主要靠病理／WSI 判讀。",
      detail:
        "實體腫瘤約占所有癌症的 90%（其餘為血液腫瘤）。這類腫瘤的診斷與分型主要仰賴組織病理，而病理玻片正快速數位化為全切片影像（WSI），因此以 AI 輔助 WSI 分析具有很大的應用價值。",
      sourceLabel: "NCI — What Is Cancer?（實體瘤與病理診斷背景）",
      sourceUrl: "https://www.cancer.gov/about-cancer/understanding/what-is-cancer",
      highlight: true,
    },
    {
      id: "microscopy-confirm",
      icon: "🔬",
      title: "多數癌症具顯微鏡確認",
      summary: "歐洲癌症登錄建議指出約 79%–98% 病例有顯微鏡確認依據。",
      detail:
        "Visser 等人（2023）整理歐洲癌症登錄的診斷基礎建議，說明大多數癌症病例都需要顯微鏡（病理玻片）確認，凸顯病理影像在癌症診斷流程中的關鍵地位。",
      sourceLabel: "Visser et al. (2023)",
      sourceUrl: "https://doi.org/10.3389/fonc.2023.1250549",
      highlight: true,
    },
    {
      id: "small-is-beautiful",
      icon: "💡",
      title: "小而美的理念",
      summary: "模型不必越大越好：更少參數也能達到相同甚至更好的準確率。",
      detail:
        "我們不追求參數量堆疊，而是在維持準確率的前提下找出更輕量、可重現、適合臨床部署的配置。較小的模型訓練與推論成本更低、較不易過擬合，也更容易在有限算力下反覆實驗——這正是本實驗室網格掃描超參數的出發點。",
      sourceLabel: "Schumacher — Small Is Beautiful (1973)",
      sourceUrl: "https://en.wikipedia.org/wiki/Small_Is_Beautiful",
      accent: "emerald",
    },
  ] as ApplicationCard[],
};

export const dataSection = {
  title: "資料集",
  datasets: [
    {
      id: "lizard",
      tag: "主資料集",
      title: "Lizard 資料集",
      name: "Lizard Dataset",
      subtitle:
        "大型結腸病理影像的細胞核分割與分類資料集。",
      license: "",
      size: "6 類細胞核標註",
      paperUrl: "https://doi.org/10.1109/ICCVW54120.2021.00082",
      paperLabel: "Graham et al. (2021) — Lizard 資料集論文",
    },
    {
      id: "conic",
      tag: "小圖版本",
      title: "CoNIC 小圖 256",
      name: "CoNIC Patches 256 (NoOverlap Official)",
      subtitle:
        "由 Lizard 切成 256×256、不重疊的小圖，共 4,981 張。",
      license: "",
      size: "4,981 張",
      paperUrl: "https://doi.org/10.1016/j.media.2023.103047",
      paperLabel: "Nunes et al. (2024) — CoNIC Challenge 論文",
    },
  ] as DatasetCard[],
  path: "D:\\lizard conic\\CoNIC_Patches_256_NoOverlap_Official\\images",
};

export const modelingSection = {
  architecture: "StarDist",
  optimizer: "AdamW",
  architecturePaperUrl: "https://arxiv.org/abs/1806.03535",
  optimizerPaperUrl: "https://arxiv.org/abs/1711.05101",
  whyStarDist: {
    rows: [
      {
        point: "專為細胞核實例分割設計",
        detail: "StarDist 是面向生物影像的實例分割（逐顆細胞核分開的分割）架構，可從染色影像區塊同時輸出細胞核中心、邊界輪廓與類別，正是本研究「找核 → 分割 → 分類」流程的核心。",
        paperUrl: "https://arxiv.org/abs/1806.03535",
        paperLabel: "Schmidt et al. (2018) — StarDist 原始論文（MICCAI 2018）",
        refDetail:
          "Schmidt 等人（MICCAI 2018，《Cell Detection with Star-convex Polygons》）以星形凸多邊形表示細胞核輪廓：從中心沿固定方向量測距離，再經非極大值抑制（NMS）產生每顆細胞核的獨立遮罩，專為生物影像中密集、重疊的細胞核設計。",
      },
      {
        point: "擅長分開相鄰細胞核",
        detail: "以星形凸多邊形切開彼此接觸、重疊的細胞核，降低黏連造成的漏分割。",
        paperUrl: "https://arxiv.org/abs/1806.03535",
        paperLabel: "Schmidt et al. (2018) — StarDist 原始論文（MICCAI 2018）",
        refDetail:
          "Schmidt 等人（MICCAI 2018）提出 StarDist：從細胞中心沿固定方向量測距離形成星形輪廓，再以非極大值抑制（NMS）產生獨立遮罩。論文與 CoNIC 2022 冠軍方案均證實此表示法能有效分離密集、相鄰的細胞核。",
      },
      {
        point: "輕量化模型",
        detail:
          "本實驗室理念：模型不必越大越好，我們希望用更小的參數量，達到跟別人一樣、甚至更好的準確率。StarDist 在 CoNIC 2022 以約 15.9M 參數取得冠軍，參數量遠小於其他前五名隊伍，適合本研究 50 組超參數的批次實驗。",
        paperUrl: "https://arxiv.org/abs/1806.03535",
        paperLabel: "Schmidt et al. (2018) — StarDist（MICCAI 2018）",
        refDetail:
          "CoNIC 2022 競賽中，StarDist 以 15.9M 參數、mPQ+ 0.464 取得冠軍；亞軍 LSL000UD 為 50M（mPQ+ 0.451），第六名 Arontier 達 125M（mPQ+ 0.428）。下方圖表為各隊參數量與 mPQ+（多類別全景品質指標）對照。",
      },
    ] as WhyRow[],
  },
  whyAdamW: {
    rows: [
      {
        point: "正則化方式更乾淨",
        detail: "AdamW 把 weight decay 獨立於梯度更新，減少過擬合。",
        refDetail:
          "Loshchilov & Hutter（ICLR 2019）指出：傳統 Adam 把 L2 正則混進梯度會與 adaptive learning rate 互相干擾；AdamW 改為在參數更新後直接衰減權重，正則化行為更乾淨。",
        paperUrl: "https://arxiv.org/abs/1711.05101",
        paperLabel: "Loshchilov & Hutter (2019)",
      },
      {
        point: "複雜度與 Adam 相同",
        detail: "每步計算量與 Adam 幾乎相同，換成 AdamW 不會變慢。",
        refDetail:
          "依 Loshchilov & Hutter（ICLR 2019）Algorithm 2，AdamW 的更新步驟與 Adam 完全相同，唯一差別是把 weight decay 從梯度中移出、於權重更新後直接施加，並未新增任何額外運算或狀態。PyTorch 官方實作亦以 class AdamW(Adam) 直接繼承 Adam、僅設定 decoupled_weight_decay=True，佐證兩者每步的計算與記憶體開銷實質相同。",
        paperUrl: "https://arxiv.org/abs/1711.05101",
        paperLabel: "Loshchilov & Hutter (2019) — AdamW 原文（Algorithm 2）",
      },
      {
        point: "泛化較穩定",
        detail: "影像分割任務上收斂與泛化通常優於 Adam。",
        refDetail:
          "同一篇論文在多組視覺任務上比較 Adam 與 AdamW，顯示 decoupled weight decay 有助於測試集泛化；本研究 50 組超參數批次實驗亦採 AdamW 作為唯一優化器。",
        paperUrl: "https://arxiv.org/abs/1711.05101",
        paperLabel: "Loshchilov & Hutter (2019)",
      },
    ] as WhyRow[],
  },
  starDistHyperparams: [
    { name: "n_rays", meaning: "每顆細胞核用幾條放射距離描邊（星形多邊形邊數）", typical: "32（2D 預設）" },
    { name: "grid", meaning: "預測網格下採樣倍率，越大越快但精度略降", typical: "(1,1) 或 (2,2)" },
    { name: "unet_n_depth", meaning: "U-Net 下採樣層數，越深感受野越大", typical: "3" },
    { name: "unet_n_filter_base", meaning: "U-Net 第一層 filter 數，越大模型越寬", typical: "32 / 64" },
    { name: "unet_n_conv_per_depth", meaning: "每個 U-Net 層級的卷積層數", typical: "2" },
    { name: "net_conv_after_unet", meaning: "U-Net 後額外卷積層通道數", typical: "128 / 256" },
    { name: "train_patch_size", meaning: "訓練 patch 尺寸", typical: "(256, 256)" },
    { name: "train_batch_size", meaning: "每批影像張數", typical: "4（依 GPU 記憶體調整）" },
    { name: "train_epochs", meaning: "訓練 epoch 數", typical: "50（本研究）/ 400（官方建議）" },
    { name: "train_learning_rate", meaning: "學習率", typical: "3e-4（官方預設）/ 1e-4 ~ 3e-4（本研究）" },
    { name: "train_loss_weights", meaning: "機率 loss / 距離 loss /（若有）類別 loss 權重", typical: "(1, 0.2) 或 [1, 0.2, 5]" },
    { name: "train_dist_loss", meaning: "距離回歸 loss 類型", typical: "mae" },
    { name: "train_background_reg", meaning: "背景距離正則係數", typical: "1e-4" },
    { name: "train_foreground_only", meaning: "只從前景區域取樣 patch 的比例", typical: "0.9" },
    { name: "n_classes", meaning: "細胞核類別數（含背景）", typical: "6（Lizard / CoNIC）" },
  ] as HyperparamItem[],
  starDistHyperparamSources: [
    { label: "StarDist GitHub（Config2D 參數說明）", url: "https://github.com/stardist/stardist" },
    { label: "CSBDeep 官方訓練文件", url: "https://csbdeep.bioimagecomputing.com/doc/training.html" },
    { label: "StarDist 2D 訓練教學（BIAPOL）", url: "https://biapol.github.io/Quantitative_Bio_Image_Analysis_with_Python_2022/day2e_deep_learning_segmentation/02_Stardist2d_in_python_training.html" },
    { label: "StarDist 原始論文（MICCAI 2018）", url: "https://arxiv.org/abs/1806.03535" },
  ] as HyperparamSource[],
  adamWHyperparams: [
    { name: "params", meaning: "要最佳化的參數（模型權重的 iterable）", typical: "model.parameters()" },
    { name: "lr", meaning: "學習率（learning rate）", typical: "1e-3（預設）／本研究 1e-4 ~ 3e-4" },
    { name: "betas", meaning: "一階 / 二階動量係數 (β1, β2)", typical: "(0.9, 0.999)" },
    { name: "eps", meaning: "加在分母、維持數值穩定的極小常數", typical: "1e-8" },
    { name: "weight_decay", meaning: "權重衰減係數；AdamW 解耦施加於權重（非梯度）", typical: "1e-2（預設）" },
    { name: "amsgrad", meaning: "是否使用 AMSGrad 變體", typical: "False" },
    { name: "maximize", meaning: "最大化目標而非最小化", typical: "False" },
    { name: "foreach", meaning: "是否使用 foreach 批次實作（較快、較耗記憶體）", typical: "None（自動）" },
    { name: "capturable", meaning: "是否可被 CUDA graph / torch.compile 捕捉", typical: "False" },
    { name: "differentiable", meaning: "step 是否走 autograd（可對最佳化步驟微分）", typical: "False" },
    { name: "fused", meaning: "是否使用 fused 實作（CUDA，速度更快）", typical: "None" },
  ] as HyperparamItem[],
  adamWHyperparamNote:
    "以上為 PyTorch torch.optim.AdamW 建構子的完整參數；AdamW 另固定 decoupled_weight_decay=True，這正是它與 Adam 的核心差異。",
  adamWHyperparamSources: [
    { label: "AdamW 原始論文（Loshchilov & Hutter, ICLR 2019）", url: "https://arxiv.org/abs/1711.05101" },
    { label: "PyTorch AdamW 官方 API 文件", url: "https://docs.pytorch.org/docs/stable/generated/torch.optim.AdamW.html" },
    { label: "PyTorch AdamW 原始碼（class AdamW(Adam)）", url: "https://github.com/pytorch/pytorch/blob/main/torch/optim/adamw.py" },
    { label: "Adam 原始論文（對照，Kingma & Ba, 2015）", url: "https://arxiv.org/abs/1412.6980" },
  ] as HyperparamSource[],
  conicParamBars: [
    { rank: 1, team: "StarDist", paramsM: 15.9, mPQ: 0.464, highlight: true, medal: "🥇", note: "CoNIC 2022 冠軍", paperUrl: "https://arxiv.org/abs/1806.03535", paperLabel: "StarDist 論文" },
    { rank: 2, team: "LSL000UD", paramsM: 50, mPQ: 0.451, medal: "🥈", note: "亞軍", paperUrl: "https://doi.org/10.1016/j.media.2023.103047", paperLabel: "CoNIC Challenge 論文" },
    { rank: 3, team: "IFP BERN", paramsM: 60, mPQ: 0.448, medal: "🥉", note: "季軍", paperUrl: "https://doi.org/10.1016/j.media.2023.103047", paperLabel: "CoNIC Challenge 論文" },
    { rank: 4, team: "Pathology AI", paramsM: 88.74, mPQ: 0.441, note: "第四名", paperUrl: "https://doi.org/10.1016/j.media.2023.103047", paperLabel: "CoNIC Challenge 論文" },
    { rank: 5, team: "AI_medical", paramsM: 100, mPQ: 0.435, note: "第五名", paperUrl: "https://doi.org/10.1016/j.media.2023.103047", paperLabel: "CoNIC Challenge 論文" },
    { rank: 6, team: "Arontier", paramsM: 125, mPQ: 0.428, note: "第六名", paperUrl: "https://doi.org/10.1016/j.media.2023.103047", paperLabel: "CoNIC Challenge 論文" },
  ] as ConicParamBar[],
  conicChartSummary:
    "CoNIC 2022 細胞核分割與分類競賽中，StarDist 以約 15.9M 參數取得冠軍（mPQ+ 約 0.464），參數量遠低於其他前五名隊伍（50M～125M），顯示在相近準確率下 StarDist 更輕量、更適合批次實驗與資源受限的 WSI patch 訓練。",
};

// 評量指標解析：與「對比 paper」同一套算法與六類別 PQ
const CONIC_METRIC_PAPER = "https://doi.org/10.1016/j.media.2023.103047";
const PANOPTIC_PQ_PAPER = "https://arxiv.org/abs/1801.00868";

export const metricGlossary: MetricGlossaryItem[] = [
  {
    key: "mPQ+",
    name: "multi mPQ+",
    what: "多類別 Panoptic Quality，對所有細胞核一起計算，對類別不平衡較穩健，是本研究主要總體指標。",
    formula: "mPQ+ = (1/K) Σ PQ_k，K 為類別數（本研究 K=6）",
    formulaUrl: CONIC_METRIC_PAPER,
    formulaSource: "Nunes et al. (2024) — CoNIC Challenge",
  },
  {
    key: "PQ",
    name: "PQ (Panoptic Quality)",
    what: "同時衡量偵測與分割品質。",
    formula: "PQ = DQ × SQ",
    formulaUrl: PANOPTIC_PQ_PAPER,
    formulaSource: "Kirillov et al. (2019) — Panoptic Segmentation",
  },
  {
    key: "DQ",
    name: "DQ (Detection Quality)",
    what: "偵測品質，類似 F1，衡量細胞核有沒有被正確找到。",
    formula: "DQ = TP / (TP + 0.5×FP + 0.5×FN)",
    formulaUrl: PANOPTIC_PQ_PAPER,
    formulaSource: "Kirillov et al. (2019)",
  },
  {
    key: "SQ",
    name: "SQ (Segmentation Quality)",
    what: "分割品質，衡量被正確配對的細胞核其 mask 與真值的平均 IoU。",
    formula: "SQ = (1/|TP|) Σ IoU(pred, gt)",
    formulaUrl: PANOPTIC_PQ_PAPER,
    formulaSource: "Kirillov et al. (2019)",
  },
  {
    key: "neu",
    name: "PQ — Neutrophil（嗜中性球）",
    what: "嗜中性球類別的 Panoptic Quality（DQ × SQ）。",
    formula: "PQ_neu = DQ_neu × SQ_neu",
    formulaUrl: CONIC_METRIC_PAPER,
    formulaSource: "Nunes et al. (2024) — 六類別 PQ",
  },
  {
    key: "epi",
    name: "PQ — Epithelial（上皮細胞）",
    what: "上皮細胞類別的 Panoptic Quality。",
    formula: "PQ_epi = DQ_epi × SQ_epi",
    formulaUrl: CONIC_METRIC_PAPER,
    formulaSource: "Nunes et al. (2024) — 六類別 PQ",
  },
  {
    key: "lym",
    name: "PQ — Lymphocyte（淋巴球）",
    what: "淋巴球類別的 Panoptic Quality。",
    formula: "PQ_lym = DQ_lym × SQ_lym",
    formulaUrl: CONIC_METRIC_PAPER,
    formulaSource: "Nunes et al. (2024) — 六類別 PQ",
  },
  {
    key: "pls",
    name: "PQ — Plasma（漿細胞）",
    what: "漿細胞類別的 Panoptic Quality。",
    formula: "PQ_pls = DQ_pls × SQ_pls",
    formulaUrl: CONIC_METRIC_PAPER,
    formulaSource: "Nunes et al. (2024) — 六類別 PQ",
  },
  {
    key: "eos",
    name: "PQ — Eosinophil（嗜酸性球）",
    what: "嗜酸性球類別的 Panoptic Quality。",
    formula: "PQ_eos = DQ_eos × SQ_eos",
    formulaUrl: CONIC_METRIC_PAPER,
    formulaSource: "Nunes et al. (2024) — 六類別 PQ",
  },
  {
    key: "con",
    name: "PQ — Connective（結締組織）",
    what: "結締組織類別的 Panoptic Quality。",
    formula: "PQ_con = DQ_con × SQ_con",
    formulaUrl: CONIC_METRIC_PAPER,
    formulaSource: "Nunes et al. (2024) — 六類別 PQ",
  },
  {
    key: "Precision",
    name: "Precision 精確率",
    what: "模型判定為某類的細胞核中，實際正確的比例（少誤報）。本研究 Excel／雲端有值；論文主表未納入比較。",
    formula: "Precision = TP / (TP + FP)",
    formulaUrl: CONIC_METRIC_PAPER,
    formulaSource: "Nunes et al. (2024)",
  },
  {
    key: "Recall",
    name: "Recall 召回率",
    what: "實際存在的細胞核中，被模型正確找出的比例（少漏抓）。本研究 Excel／雲端有值；論文 colon overall 比較表未納入此項。",
    formula: "Recall = TP / (TP + FN)",
    formulaUrl: CONIC_METRIC_PAPER,
    formulaSource: "Nunes et al. (2024)",
  },
  {
    key: "F1",
    name: "F1-score",
    what: "Precision 與 Recall 的調和平均。本研究 Excel／雲端有值；論文主表未納入比較。",
    formula: "F1 = 2 × (Precision × Recall) / (Precision + Recall)",
    formulaUrl: CONIC_METRIC_PAPER,
    formulaSource: "Nunes et al. (2024)",
  },
  {
    key: "F1@50_95",
    name: "mean F1@50–95",
    what: "在多個 IoU 門檻（0.50–0.95）上平均的 F1。本研究 Excel sheet3 有值；論文主表未納入比較。",
    formula: "mean_F1@50_95 = average F1 over IoU ∈ {0.50,…,0.95}",
  },
  {
    key: "mR2",
    name: "mR²（全 patch 計數）",
    what: "256×256 patch 層級細胞核計數預測的決定係數 R²。本研究 Excel sheet4 有值；論文主表未納入比較。",
    formula: "mR2_full_image",
  },
  {
    key: "mMAE",
    name: "mMAE（全 patch 計數）",
    what: "256×256 patch 層級細胞核計數的平均絕對誤差。本研究 Excel sheet4 有值；論文主表未納入比較。",
    formula: "mMAE_full_image",
  },
  {
    key: "TP",
    name: "TP（True Positive）",
    what: "正確配對的實例數（10-run 平均）。本研究 Excel 有值；論文主表未納入比較。",
    formula: "TP count",
  },
  {
    key: "FP",
    name: "FP（False Positive）",
    what: "誤報實例數。本研究 Excel 有值；論文主表未納入比較。",
    formula: "FP count",
  },
  {
    key: "FN",
    name: "FN（False Negative）",
    what: "漏抓實例數。本研究 Excel 有值；論文主表未納入比較。",
    formula: "FN count",
  },
];

export const metricGlossaryCore: MetricGlossaryItem[] = metricGlossary.filter(
  (m) =>
    ["mPQ+", "PQ", "DQ", "SQ"].includes(m.key) ||
    ["neu", "epi", "lym", "pls", "eos", "con"].includes(m.key),
);

export const metricGlossaryExtra: MetricGlossaryItem[] = metricGlossary.filter(
  (m) => !metricGlossaryCore.some((c) => c.key === m.key),
);

// 對比 paper：Ours = 雲端最佳配置 exp_49（Exp451 / LeakyReLU）final_epoch 10-run mean±std。
export const benchmark = {
  paper:
    "A survey on cell nuclei instance segmentation and classification: Leveraging context and attention",
  authors: "Nunes, Montezuma, Oliveira, Pereira, Cardoso",
  journal: "Medical Image Analysis (2024)",
  rank: "Q1，排名約 2.8%",
  doi: "https://doi.org/10.1016/j.media.2024.103360",
  arxiv: "https://arxiv.org/abs/2407.18673",
  oursLabel: "本研究",
  oursNote:
    "本研究採用目前最佳參數組合（StarDist · LeakyReLU · final_epoch 10-run mean±std）。超參數：filter=64、conv=256、head=2、lr=0.0003、loss=[1.0, 0.22, 5.25]。論文基準為 Nunes et al. (2024) colon overall。",
  oursExpId: 49,
  /** StarDist 輕量配置參數量（Run_Info xlsx：5,790,344） */
  oursParamsM: 5.79,
  oursParamsLabel: "≈5.79M",
  paperSummaryBullets: [
    "說明為何需要自動細胞核實例分割與分類（WSI 人工標註成本高）。",
    "回顧以 context／attention 設計的細胞核分割與分類方法。",
    "討論現有挑戰：形態變異、染色偽影、泛化困難。",
    "案例：擴展 Mask R-CNN 與 HoVer-Net，在多中心結腸細胞核資料集比較。",
    "結論：臨床上依賴 context／注意力，但直接寫進演算法仍有限制。",
  ],
  studyAdvantages: [
    {
      title: "整體 mPQ+ 最高",
      detail: "exp_49（Exp451 / LeakyReLU）的 multi mPQ+ 0.4720±0.0078，高於 Mask-RCNN（0.4106±0.0432）。HoVer-Net（0.3552）僅作參考。",
    },
    {
      title: "參數量極小",
      detail: "本研究最佳 StarDist 配置約 5.79M（5,790,344），遠小於 Mask-RCNN（44M）；相對 CoNIC 冠軍 StarDist（~15.9M）亦更輕。",
    },
    {
      title: "六類細胞皆領先",
      detail: "neu、epi、lym、pls、eos、con 的類別 PQ 皆高於 Mask-RCNN。",
    },
    {
      title: "無資料增強仍領先",
      detail: "論文基準使用 rotation、flip、color jitter；本研究完全未做增強仍取得最佳整體指標。",
    },
    {
      title: "偵測與分割兼優",
      detail: "PQ、DQ、SQ 三項皆超越 Mask-RCNN。",
    },
  ] as StudyAdvantage[],
  maskRcnnLabel: "Mask-RCNN-ResNet50-SE-FPN",
  hoverNetLabel: "SRM-HoVer-Net",
  paramCompare: [
    { method: "Mask-RCNN-ResNet50-SE-FPN", params: "44M", paramsNum: 44, mPQ: "0.4106", note: "論文 colon overall" },
    { method: "SRM-HoVer-Net", params: "37.6M", paramsNum: 37.6, mPQ: "0.3552", note: "論文 colon overall（參考）" },
    {
      method: "本研究",
      params: "≈5.79M",
      paramsNum: 5.79,
      mPQ: "0.4720",
      note: "10-run mean · Exp451",
    },
  ] as ParamCompareRow[],
  augmentationCompare: [
    { aspect: "旋轉 (rotation)", paper: "有", ours: "無" },
    { aspect: "水平翻轉 (horizontal flip)", paper: "有", ours: "無" },
    { aspect: "垂直翻轉 (vertical flip)", paper: "有", ours: "無" },
    { aspect: "色彩抖動 (color jitter)", paper: "有（亮度／對比／飽和度）", ours: "無" },
    { aspect: "整體策略", paper: "多重幾何＋色彩增強", ours: "完全未使用任何資料增強" },
  ],
  augmentationNote:
    "論文基準（Mask-RCNN-ResNet50-SE-FPN、SRM-HoVer-Net）的增強設定，依 Nunes et al. (2024) 文中對兩組 baseline 訓練流程之描述：含隨機旋轉、水平／垂直翻轉與色彩抖動。本研究 StarDist 訓練未套用任何 augmentation。",
  precisionRecall: {
    paperMaskRcnn: { precision: null, recall: null, note: "論文 colon overall 表未報告" },
    paperHoverNet: { precision: null, recall: null, note: "論文 colon overall 表未報告" },
    ours: { precision: 0.8248, recall: 0.7842, note: "本研究最佳配置 Mask-level 10-run mean（論文未列同項指標，僅供補充對照）" },
  },
  rows: [
    {
      metric: "multi mPQ+",
      maskRcnn: "0.4106±0.0432",
      hoverNet: "0.3552±0.0414",
      ours: "0.4720±0.0078",
      diff: "+0.0614",
      note: "Ours 最高",
    },
    {
      metric: "PQ",
      maskRcnn: "0.5548±0.0215",
      hoverNet: "0.5445±0.0221",
      ours: "0.6417±0.0039",
      diff: "+0.0869",
      note: "Ours 最高",
    },
    {
      metric: "PQ_det / DQ",
      maskRcnn: "0.7176±0.0281",
      hoverNet: "0.6929±0.0277",
      ours: "0.8127±0.0036",
      diff: "+0.0951",
      note: "Ours 最高",
    },
    {
      metric: "PQ_seg / SQ",
      maskRcnn: "0.7546±0.0139",
      hoverNet: "0.7662±0.0158",
      ours: "0.7897±0.0019",
      diff: "+0.0235",
      note: "Ours 最高",
    },
    {
      metric: "epi",
      maskRcnn: "0.5208±0.0122",
      hoverNet: "0.4808±0.0382",
      ours: "0.5783±0.0037",
      diff: "+0.0575",
      note: "Ours 最高",
    },
    {
      metric: "lym",
      maskRcnn: "0.5381±0.0129",
      hoverNet: "0.5666±0.0246",
      ours: "0.6642±0.0082",
      diff: "+0.0976",
      note: "Ours 最高",
    },
    {
      metric: "neu",
      maskRcnn: "0.2068±0.1480",
      hoverNet: "0.0548±0.0838",
      ours: "0.2241±0.0173",
      diff: "+0.0173",
      note: "Ours 最高",
    },
    {
      metric: "pls",
      maskRcnn: "0.3641±0.0426",
      hoverNet: "0.3692±0.0573",
      ours: "0.4770±0.0115",
      diff: "+0.1078",
      note: "Ours 最高",
    },
    {
      metric: "eos",
      maskRcnn: "0.3248±0.0793",
      hoverNet: "0.1591±0.0834",
      ours: "0.3431±0.0210",
      diff: "+0.0183",
      note: "Ours 最高",
    },
    {
      metric: "con",
      maskRcnn: "0.5080±0.0418",
      hoverNet: "0.4171±0.0523",
      ours: "0.5453±0.0050",
      diff: "+0.0373",
      note: "Ours 最高",
    },
  ] as BenchmarkRow[],
  conclusion: "",
};
