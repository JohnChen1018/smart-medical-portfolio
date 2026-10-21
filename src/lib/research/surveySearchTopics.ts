export const mpoxDiseaseKeywords = [
  "Mpox",
  "Monkeypox",
  "Monkeypox virus",
  "MPXV",
  "Human monkeypox",
  "Mpox virus",
  "Monkeypox disease",
  "Monkeypox infection",
];

export const mpoxAiKeywords = [
  "artificial",
  "intelligent",
  "neural",
  "fuzzy",
  "expert",
  "evolutionary",
  "deep",
  "machine",
];

export const mpoxTaskGroups = [
  { id: "FROS", label: "回顧類 FROS", words: ["framework", "review", "overview", "survey"] },
  { id: "PRDD", label: "預測與辨識 PRDD", words: ["prediction", "recognition", "detection", "diagnosis"] },
];

export type SurveyShelf = {
  id: string;
  title: string;
  folder: string;
  patterns: string[];
};

export const surveyShelves: SurveyShelf[] = [
  {
    id: "survey-mpox",
    title: "猴痘 Survey Paper",
    folder: "猴痘Survey最新論文",
    patterns: ["monkeypox", "mpox", "mpxv"],
  },
  {
    id: "survey-cat-lymphoma",
    title: "貓淋巴癌 Survey Paper",
    folder: "貓淋巴癌Survey最新論文",
    patterns: ["feline lymphoma", "cat lymphoma", "alimentary lymphoma"],
  },
  {
    id: "survey-wsi",
    title: "WSI Survey Paper",
    folder: "WSI-Survey最新論文",
    patterns: ["whole slide", "histopathology", "stardist", "nuclei", "nucleus"],
  },
];

export const unfiledShelf: SurveyShelf = {
  id: "unfiled",
  title: "還沒分到主題",
  folder: "",
  patterns: [],
};

function patternHits(title: string, pattern: string) {
  if (pattern.includes(" ") || /[^\u0000-\u007f]/.test(pattern)) return title.toLowerCase().includes(pattern.toLowerCase());
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(title);
}

export function classifySurveyPaper(title: string, extraDisease = "") {
  const disease = extraDisease.trim();
  if (disease && patternHits(title, disease)) {
    return { shelf: shelfForDisease(disease), hit: disease };
  }
  for (const shelf of surveyShelves) {
    const hit = shelf.patterns.find((pattern) => patternHits(title, pattern));
    if (hit) return { shelf, hit };
  }
  return { shelf: unfiledShelf, hit: "" };
}

export function customTopicId(disease: string) {
  return `custom:${cleanSearchKeyword(disease)}`;
}

export function diseaseFromTopic(topicId: string) {
  return topicId.startsWith("custom:") ? topicId.slice("custom:".length).trim() : "";
}

export function diseaseFolderName(disease: string) {
  const safe = cleanSearchKeyword(disease).replace(/[<>:"/\\|?*]/g, " ").replace(/\s+/g, " ").trim();
  return `${safe}Survey最新論文`;
}

export function shelfForDisease(disease: string): SurveyShelf {
  const name = cleanSearchKeyword(disease);
  return {
    id: customTopicId(name),
    title: `${name} Survey Paper`,
    folder: diseaseFolderName(name),
    patterns: [name],
  };
}

export function isMpoxTopic(topicId: string) {
  return topicId === "survey-mpox" || topicId === "survey-paper" || topicId === "survey-cross-review";
}

export const surveySearchTopics: Record<string, { folder: string; keywords: string[] }> = {
  "survey-mpox": {
    folder: "猴痘Survey最新論文",
    keywords: mpoxDiseaseKeywords,
  },
  "survey-paper": {
    folder: "猴痘Survey最新論文",
    keywords: mpoxDiseaseKeywords,
  },
  "survey-cross-review": {
    folder: "猴痘Survey最新論文",
    keywords: mpoxDiseaseKeywords,
  },
  "survey-cat-lymphoma": {
    folder: "貓淋巴癌Survey最新論文",
    keywords: ["feline lymphoma", "cat lymphoma"],
  },
  "survey-wsi": {
    folder: "WSI-Survey最新論文",
    keywords: ["whole slide imaging", "histopathology nuclei"],
  },
};

export const aiSearchKeywords = [
  "artificial intelligence",
  "deep learning",
  "machine learning",
  "neural network",
  "convolutional",
  "computer vision",
  "transfer learning",
];

export function matchesAiKeyword(text: string, terms: string[]) {
  if (terms.length === 0) return true;
  return terms.some((term) => {
    const cleaned = term.trim();
    if (!cleaned) return false;
    if (cleaned.toUpperCase() === "AI") return /\bAI\b/.test(text);
    if (cleaned.includes(" ")) return text.toLowerCase().includes(cleaned.toLowerCase());
    const escaped = cleaned.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(text);
  });
}

export type SourcedKeyword = {
  keyword: string;
  source: string;
  url?: string;
};

export type ApplicationKeywordPlan = {
  id: string;
  topicId: string;
  title: string;
  keywords: SourcedKeyword[];
  aiTerms?: string[];
};

export const applicationKeywordPlans: ApplicationKeywordPlan[] = [
  {
    id: "wsi",
    topicId: "survey-wsi",
    title: "WSI 全切片細胞核",
    keywords: [
      {
        keyword: "whole slide imaging",
        source: "Pantanowitz et al. (2020)，AI 輔助全切片有絲分裂計數",
        url: "https://doi.org/10.1186/s13000-020-00995-z",
      },
      {
        keyword: "nuclear instance segmentation",
        source: "Graham et al. (2021)，Lizard 資料集論文",
        url: "https://doi.org/10.1109/ICCVW54120.2021.00082",
      },
      {
        keyword: "cell nuclei instance segmentation",
        source: "A survey on cell nuclei instance segmentation and classification（Medical Image Analysis）",
        url: "https://doi.org/10.1016/j.media.2024.103360",
      },
      {
        keyword: "stardist cell detection",
        source: "Schmidt et al. (2018)，Cell Detection with Star-convex Polygons",
        url: "https://arxiv.org/abs/1806.03535",
      },
    ],
  },
  {
    id: "mpox",
    topicId: "survey-mpox",
    title: "猴痘皮膚病灶",
    keywords: mpoxDiseaseKeywords.map((keyword) => ({
      keyword,
      source: "本研究綜述 2.1 節。2026 年 7 月 Google Scholar 標題檢索，疾病詞與人工智慧詞一起放入 as_q，任務詞放入 as_oq。",
    })),
  },
  {
    id: "cat-lymphoma",
    topicId: "survey-cat-lymphoma",
    title: "貓淋巴癌",
    keywords: [
      {
        keyword: "feline lymphoma",
        source: "Hayes (2006)，Feline lymphoma 1. Principles of diagnosis and management",
        url: "https://doi.org/10.1136/inpract.28.9.516",
      },
      {
        keyword: "feline alimentary lymphoma",
        source: "Barrs and Beatty (2012)，Feline alimentary lymphoma: 1. Classification, risk factors, clinical signs and non-invasive diagnostics",
        url: "https://doi.org/10.1177/1098612X12439265",
      },
    ],
  },
];

export function keywordsForTopic(topicId: string) {
  const disease = diseaseFromTopic(topicId);
  if (disease) return [disease];
  return [...(surveySearchTopics[topicId] ?? surveySearchTopics["survey-paper"]).keywords];
}

export function planForDisease(name: string) {
  const text = name.trim().toLowerCase();
  if (!text) return null;
  if (/猴痘|monkeypox|mpox|mpxv/.test(text)) return applicationKeywordPlans.find((plan) => plan.id === "mpox") ?? null;
  if (/貓|feline|lymphoma|淋巴癌/.test(text)) return applicationKeywordPlans.find((plan) => plan.id === "cat-lymphoma") ?? null;
  if (/wsi|全切片|細胞核|histopathology|nuclei|stardist/.test(text)) return applicationKeywordPlans.find((plan) => plan.id === "wsi") ?? null;
  return null;
}

export function customDiseasePlan(name: string): ApplicationKeywordPlan {
  const disease = cleanSearchKeyword(name);
  return {
    id: customTopicId(disease),
    topicId: customTopicId(disease),
    title: disease,
    keywords: [{ keyword: disease, source: "你輸入的疾病名稱" }],
  };
}

export function cleanSearchKeyword(value: string) {
  return value.replace(/[\u0000-\u001f,]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}
