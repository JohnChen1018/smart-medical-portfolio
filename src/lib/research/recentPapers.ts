import fs from "node:fs";
import path from "node:path";
import { cleanSearchKeyword, diseaseFolderName, diseaseFromTopic, matchesAiKeyword, surveySearchTopics } from "@/lib/research/surveySearchTopics";

export type RecentPaper = {
  title: string;
  date: string;
  authors: string[];
  doi?: string;
  url: string;
  pdfUrl?: string;
  savedFile?: string;
  note: string;
};

const STALE_MS = 6 * 60 * 60 * 1000;
const LIST_LIMIT = 24;
const PDF_LIMIT = 8;

function driveRoot() {
  return process.env.SURVEY_DRIVE_DIR || "G:\\我的雲端硬碟";
}

function profileFor(topicId: string) {
  const known = surveySearchTopics[topicId];
  if (known) return known;
  const disease = diseaseFromTopic(topicId);
  if (disease) return { folder: diseaseFolderName(disease), keywords: [disease] };
  return surveySearchTopics["survey-paper"];
}

export function surveyCloudDir(topicId: string) {
  return path.join(driveRoot(), profileFor(topicId).folder);
}

type OpenAlexWork = {
  display_name?: string;
  publication_date?: string;
  doi?: string;
  authorships?: Array<{ author?: { display_name?: string } }>;
  open_access?: { is_oa?: boolean; oa_url?: string };
  best_oa_location?: { pdf_url?: string; landing_page_url?: string };
  primary_location?: { pdf_url?: string; landing_page_url?: string };
  abstract_inverted_index?: Record<string, number[]>;
};

function abstractText(work: OpenAlexWork) {
  const index = work.abstract_inverted_index;
  if (!index) return "";
  const words: string[] = [];
  for (const [word, positions] of Object.entries(index)) {
    for (const pos of positions) words[pos] = word;
  }
  return words.filter(Boolean).join(" ");
}

async function fetchTitleQuery(query: string): Promise<OpenAlexWork[]> {
  const url = new URL("https://api.openalex.org/works");
  url.searchParams.set("filter", `title.search:${query}`);
  url.searchParams.set("sort", "publication_date:desc");
  url.searchParams.set("per-page", "15");
  let lastStatus = 0;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const res = await fetch(url, {
      headers: { "User-Agent": "mailto:portfolio@localhost" },
      cache: "no-store",
    });
    lastStatus = res.status;
    if (res.ok) {
      const data = (await res.json()) as { results?: OpenAlexWork[] };
      return data.results ?? [];
    }
    await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
  }
  throw new Error(`論文搜尋失敗 (${lastStatus})`);
}

function toPaper(work: OpenAlexWork): RecentPaper | null {
  const title = (work.display_name || "").trim();
  if (!title) return null;
  const doi = (work.doi || "").replace(/^https?:\/\/doi.org\//i, "");
  const landing = work.primary_location?.landing_page_url || work.best_oa_location?.landing_page_url;
  const pdfUrl =
    work.best_oa_location?.pdf_url ||
    work.primary_location?.pdf_url ||
    (work.open_access?.is_oa ? work.open_access.oa_url : undefined);
  return {
    title,
    date: work.publication_date || "",
    authors: (work.authorships ?? [])
      .map((item) => item.author?.display_name || "")
      .filter(Boolean)
      .slice(0, 6),
    doi: doi || undefined,
    url: landing || (doi ? `https://doi.org/${doi}` : work.doi || ""),
    pdfUrl,
    note: pdfUrl ? "有 PDF" : "沒有 PDF，只留下標題",
  };
}

function byDateDesc(a: RecentPaper, b: RecentPaper) {
  return (b.date || "0000").localeCompare(a.date || "0000");
}

export function chosenQueries(topicId: string, queries?: string[]) {
  const source = queries && queries.length > 0 ? queries : profileFor(topicId).keywords;
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const query of source) {
    const next = cleanSearchKeyword(query);
    const key = next.toLowerCase();
    if (!next || seen.has(key)) continue;
    seen.add(key);
    cleaned.push(next);
    if (cleaned.length >= 16) break;
  }
  return cleaned;
}

export async function findRecentPapers(
  topicId: string,
  queries: string[] | undefined,
  onStep?: (text: string) => void,
  aiTerms?: string[],
  taskTerms?: string[],
): Promise<RecentPaper[]> {
  const selected = chosenQueries(topicId, queries);
  const batches: OpenAlexWork[][] = [];
  for (let index = 0; index < selected.length; index += 1) {
    const query = selected[index];
    onStep?.(`正在查「${query}」（${index + 1}/${selected.length}）`);
    const found = await fetchTitleQuery(query);
    onStep?.(`「${query}」查完，這組 ${found.length} 篇`);
    batches.push(found);
  }
  const seen = new Set<string>();
  const papers: RecentPaper[] = [];
  const selectedAi = (aiTerms ?? []).map((term) => cleanSearchKeyword(term)).filter(Boolean);
  const selectedTasks = (taskTerms ?? []).map((term) => cleanSearchKeyword(term)).filter(Boolean);
  const titleOnly = taskTerms !== undefined;
  for (const work of batches.flat()) {
    const blob = titleOnly ? work.display_name || "" : `${work.display_name || ""} ${abstractText(work)}`;
    if (!matchesAiKeyword(blob, selectedAi)) continue;
    if (titleOnly && !matchesAiKeyword(blob, selectedTasks)) continue;
    const paper = toPaper(work);
    if (!paper) continue;
    const key = paper.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (seen.has(key)) continue;
    seen.add(key);
    papers.push(paper);
  }
  papers.sort(byDateDesc);
  return papers.slice(0, LIST_LIMIT);
}

function safeFileName(paper: RecentPaper) {
  const base = paper.title.replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 90);
  return `${paper.date || "undated"}_${base}.pdf`;
}

async function downloadPdf(url: string, dest: string) {
  const res = await fetch(url, {
    redirect: "follow",
    headers: { "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) return false;
  const type = res.headers.get("content-type") || "";
  const buf = Buffer.from(await res.arrayBuffer());
  const isPdf = type.includes("pdf") || buf.subarray(0, 5).toString() === "%PDF-";
  if (!isPdf || buf.length < 1000 || buf.length > 25_000_000) return false;
  fs.writeFileSync(dest, buf);
  return true;
}

function writeList(dir: string, papers: RecentPaper[]) {
  const header = "日期,標題,作者,DOI,網址,雲端檔案,備註\n";
  const lines = papers.map((paper) =>
    [paper.date, paper.title, paper.authors.join("; "), paper.doi || "", paper.url, paper.savedFile || "", paper.note]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(","),
  );
  fs.writeFileSync(path.join(dir, "論文清單.csv"), `\uFEFF${header}${lines.join("\n")}\n`, "utf8");
  fs.writeFileSync(
    path.join(dir, "last-sync.json"),
    JSON.stringify({ syncedAt: new Date().toISOString(), papers }, null, 2),
    "utf8",
  );
}

export function readRecentSync(topicId: string): { syncedAt: string; papers: RecentPaper[]; dir: string } | null {
  const dir = surveyCloudDir(topicId);
  const file = path.join(dir, "last-sync.json");
  if (!fs.existsSync(file)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8")) as { syncedAt: string; papers: RecentPaper[] };
    return { ...data, dir };
  } catch {
    return null;
  }
}

export async function syncRecentPapers(
  topicId: string,
  force = false,
  queries?: string[],
  onStep?: (text: string) => void,
  aiTerms?: string[],
  taskTerms?: string[],
) {
  const dir = surveyCloudDir(topicId);
  fs.mkdirSync(dir, { recursive: true });
  const cached = readRecentSync(topicId);
  if (!force && cached && Date.now() - Date.parse(cached.syncedAt) < STALE_MS) {
    onStep?.("用剛才存好的清單");
    return { ok: true as const, dir, papers: [...cached.papers].sort(byDateDesc), cached: true, syncedAt: cached.syncedAt };
  }

  const selected = chosenQueries(topicId, queries);
  if (selected.length === 0) throw new Error("請先勾一個關鍵字");
  const papers = await findRecentPapers(topicId, selected, onStep, aiTerms, taskTerms);
  if (papers.length === 0) {
    return { ok: true as const, dir, papers: [], cached: false, syncedAt: new Date().toISOString() };
  }
  let saved = 0;
  const downloadable = papers.filter((paper) => paper.pdfUrl).slice(0, PDF_LIMIT);
  for (const paper of papers) {
    if (!paper.pdfUrl || saved >= PDF_LIMIT) continue;
    onStep?.(`正在存 PDF（${saved + 1}/${downloadable.length}）`);
    const fileName = safeFileName(paper);
    const dest = path.join(dir, fileName);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      paper.savedFile = fileName;
      paper.note = "已放進雲端";
      saved += 1;
      continue;
    }
    try {
      const ok = await downloadPdf(paper.pdfUrl, dest);
      if (ok) {
        paper.savedFile = fileName;
        paper.note = "已下載公開 PDF";
        saved += 1;
      } else {
        paper.note = "連結不是 PDF，只留下標題";
      }
    } catch {
      paper.note = "PDF 沒下載成功，只留下標題";
    }
  }
  writeList(dir, papers);
  const keep = new Set(papers.map((paper) => paper.savedFile).filter(Boolean));
  for (const name of fs.readdirSync(dir)) {
    if (name.toLowerCase().endsWith(".pdf") && !keep.has(name)) fs.unlinkSync(path.join(dir, name));
  }
  return { ok: true as const, dir, papers, cached: false, syncedAt: new Date().toISOString() };
}
