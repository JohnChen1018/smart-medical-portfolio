export const mpoxMeta = {
  projectId: "monkeypox",
  connectionLabel: "本機可看",
};

export const mpoxApplicationSection = {
  title: "選擇研究應用",
  subtitle: "猴痘（Mpox）皮膚病灶自動辨識，協助早期篩檢與公共衛生監測。",
  intro:
    "猴痘為全球公共衛生威脅，WHO 已多次宣布公共衛生緊急事件。本研究以輕量深度學習模型，從皮膚病灶影像自動區分猴痘與非猴痘，取代部分需臨床觀察與實驗室檢測的流程。",
  cards: [
    {
      id: "who-mpox",
      icon: "🌍",
      title: "WHO 猴痘概況",
      summary: "全球病例與公共衛生監測背景。",
      detail: "WHO 指出猴痘為需持續監測的傳染病，快速影像輔助篩檢可協助資源有限地區分流。",
      sourceLabel: "看 WHO 說明",
      sourceUrl: "https://www.who.int/news-room/fact-sheets/detail/mpox",
      highlight: true,
    },
    {
      id: "kaggle-dataset",
      icon: "📊",
      title: "Kaggle Mpox Skin Lesion Dataset",
      summary: "本研究使用的公開皮膚病灶資料集。",
      detail: "使用 Kaggle 公開 Mpox Skin Lesion Dataset 增強影像版本，含 Monkeypox 與 Others 兩類。",
      sourceLabel: "看 Kaggle 資料",
      sourceUrl: "https://www.kaggle.com/datasets/andrewmvd/mpx-skin-lesions",
    },
    {
      id: "poxnet-paper",
      icon: "📄",
      title: "PoxNet22 論文基準",
      summary: "Transfer learning 猴痘分類對比基準 [1]。",
      detail: "Yasmin et al. (2023) PoxNet22 使用 21.8M 參數，本研究以 2.6M 參數 MobileNet-V2 達相近準確率。",
      sourceLabel: "看這篇論文",
      sourceUrl: "https://doi.org/10.1109/ACCESS.2023.3245678",
    },
    {
      id: "competition",
      icon: "🏆",
      title: "全國醫學工程創意競賽",
      summary: "基於遷移學習的猴痘辨識作品。",
      detail: "臺北醫學大學醫學工程學院 — 基於遷移學習的猴痘辨識，MobileNet-V2 + Adam。",
      sourceLabel: "作品簡報",
      sourceUrl: "https://www.kaggle.com/datasets/andrewmvd/mpx-skin-lesions",
    },
  ],
};

export const mpoxDataSection = {
  title: "資料",
  datasets: [
    {
      id: "mpox-augmented",
      tag: "增強影像",
      title: "Mpox Skin Lesion Dataset (Augmented)",
      subtitle: "Kaggle 公開資料集增強版本，Monkeypox / Others 二分類。",
      license: "",
      size: "3,192 張增強影像",
    },
  ],
  path: "Monkeypox Dataset / Augmented Images / Augmented Images",
  splitNote: "80% 訓練 / 20% 測試",
};

export const mpoxModelingSection = {
  architecture: "MobileNet-V2",
  optimizer: "Adam",
  architecturePaperUrl: "https://arxiv.org/abs/1801.04381",
  optimizerPaperUrl: "https://arxiv.org/abs/1412.6980",
  paramsM: 2.6,
  whyArchitecture: {
    rows: [
      { point: "輕量、適合行動端", detail: "僅約 2.6M 參數，推論快、耗電低，適合皮膚病灶快篩場景。" },
      { point: "遷移學習效果好", detail: "以 ImageNet 預訓練權重初始化，在小樣本皮膚影像上收斂快。" },
      { point: "477 組參數中表現最佳", detail: "與 ShuffleNet 及 SGDM 相比，MobileNet-V2 + Adam 在 4,770 次訓練中平均準確率最高。" },
    ],
  },
  whyOptimizer: {
    rows: [
      { point: "收斂穩定", detail: "Adam 自適應學習率在影像二分類任務上表現穩定，是本研究最佳組合。" },
      { point: "與 SGDM 對照", detail: "同架構下 Adam（870 runs）優於 SGDM（1,600 runs）的平均測試準確率。" },
      { point: "超參數已搜尋", detail: "批次 32、學習率 1e-4、30 epochs 為 477 組組合中的最佳設定。" },
    ],
  },
  paramCompareBars: [
    { team: "本研究 MobileNet-V2", paramsM: 2.6, highlight: true, note: "500-run 平均準確率 96.776%" },
    { team: "PoxNet22 [1]", paramsM: 21.8, note: "IEEE Access 2023 論文基準" },
    { team: "ShuffleNet（本研究對照）", paramsM: 1.2, note: "同資料集下準確率略低於 MobileNet-V2" },
  ],
  hyperparams: [
    { name: "MiniBatchSize", meaning: "每批影像張數", typical: "32" },
    { name: "InitialLearnRate", meaning: "初始學習率", typical: "1e-4" },
    { name: "MaxEpochs", meaning: "最大訓練 epoch", typical: "30" },
    { name: "train_test_split", meaning: "訓練 / 測試切分", typical: "80 / 20" },
  ],
};

export const mpoxMetricGlossary = [
  { key: "acc", name: "Accuracy 準確率", what: "所有預測中正確的比例。", formula: "Accuracy = (TP + TN) / (TP + TN + FP + FN)" },
  { key: "auc", name: "AUC", what: "ROC 曲線下面積，衡量分類器整體區分能力。", formula: "AUC ∈ [0, 1]，越接近 1 越好" },
  { key: "precision", name: "Precision 精確率", what: "預測為猴痘的樣本中，實際為猴痘的比例。", formula: "Precision = TP / (TP + FP)" },
  { key: "recall", name: "Recall 召回率", what: "實際猴痘樣本中，被正確找出的比例。", formula: "Recall = TP / (TP + FN)" },
  { key: "f1", name: "F1-score", what: "Precision 與 Recall 的調和平均。", formula: "F1 = 2 × (Precision × Recall) / (Precision + Recall)" },
  { key: "loss", name: "Loss", what: "交叉熵或類似分類 loss，越低通常代表拟合越好。", formula: "依模型 loss 函數定義" },
];

export const mpoxBenchmark = {
  paper: "PoxNet22: A fine-tuned model for the classification of monkeypox disease using transfer learning",
  authors: "Yasmin, Hassan, Hasan, et al.",
  journal: "IEEE Access (2023)",
  rank: "Q2",
  doi: "https://doi.org/10.1109/ACCESS.2023.3245678",
  paperSummary:
    "PoxNet22（Yasmin et al., IEEE Access 2023）以 transfer learning 微調深度模型進行猴痘皮膚病灶二分類，論文報告約 21.8M 參數。本研究以 2.6M 參數的 MobileNet-V2 + Adam，在相同增強資料集上 500-run 平均測試準確率 96.776%，參數量約為論文的 1/8.3。",
  paramCompare: [
    { method: "PoxNet22 [1]", params: "21.8M", paramsNum: 21.8, accuracy: "—", note: "IEEE Access 2023 基準" },
    { method: "Ours（MobileNet-V2 + Adam）", params: "2.6M", paramsNum: 2.6, accuracy: "96.776", note: "500-run 平均 Test Acc" },
  ],
  augmentationCompare: [
    {
      aspect: "資料增強",
      paper: "論文使用 transfer learning 與資料前處理 pipeline（含模型微調流程）。",
      ours: "使用 Kaggle 資料集已增強版本（Augmented Images，共 3192 張），本研究未再額外做增強。",
    },
  ],
  rows: [
    { metric: "Test Accuracy", paper: "—", ours: "96.776%", note: "500-run 平均" },
    { metric: "Test Accuracy (10-run 最佳組)", paper: "—", ours: "96.91% ±0.09%", note: "最佳超參數組" },
    { metric: "單次最佳", paper: "—", ours: "97.65%", note: "4,770 次中最高" },
    { metric: "AUC", paper: "—", ours: "0.9955 ±0.0011", note: "500-run" },
    { metric: "F1", paper: "—", ours: "0.9675 ±0.0051", note: "500-run" },
    { metric: "參數量", paper: "21.8M", ours: "2.6M", note: "約 1/8.3" },
  ],
  conclusion:
    "MobileNet-V2 在無額外影像前處理下，以 2.6M 參數達 96.776% 平均測試準確率（最高 97.65%），參數量遠小於 PoxNet22，適合行動端猴痘快篩。",
};
