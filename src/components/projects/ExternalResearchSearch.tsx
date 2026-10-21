"use client";

import { FormEvent, useState } from "react";

type SearchSource = {
  id: string;
  label: string;
  description: string;
  buildUrl: (query: string) => string;
};

const sources: SearchSource[] = [
  {
    id: "google",
    label: "Google",
    description: "一般網頁與最新資訊",
    buildUrl: (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}`,
  },
  {
    id: "scholar",
    label: "Google Scholar",
    description: "論文、引用與學術資料",
    buildUrl: (query) => `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`,
  },
  {
    id: "pubmed",
    label: "PubMed",
    description: "醫學與生命科學文獻",
    buildUrl: (query) => `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(query)}`,
  },
  {
    id: "semantic-scholar",
    label: "Semantic Scholar",
    description: "AI 輔助學術論文搜尋",
    buildUrl: (query) =>
      `https://www.semanticscholar.org/search?q=${encodeURIComponent(query)}&sort=relevance`,
  },
];

interface ExternalResearchSearchProps {
  title?: string;
  defaultQuery?: string;
  suggestions?: string[];
}

export function ExternalResearchSearch({
  title = "外部資料搜尋",
  defaultQuery = "",
  suggestions = [],
}: ExternalResearchSearchProps) {
  const [query, setQuery] = useState(defaultQuery);
  const [sourceId, setSourceId] = useState("google");
  const [message, setMessage] = useState("");

  const search = (event?: FormEvent) => {
    event?.preventDefault();
    const cleaned = query.trim();
    if (!cleaned) {
      setMessage("請先輸入要查的關鍵字。");
      return;
    }

    const source = sources.find((item) => item.id === sourceId) ?? sources[0];
    window.open(source.buildUrl(cleaned), "_blank", "noopener,noreferrer");
    setMessage(`已在新分頁開啟 ${source.label} 搜尋。`);
  };

  return (
    <section className="rounded-3xl border border-cyan-400/25 bg-gradient-to-br from-cyan-950/25 to-[#111827] p-6 md:p-8">
      <p className="text-sm font-semibold text-cyan-300">另外查詢</p>
      <h2 className="mt-2 text-2xl font-black text-[#E6EDF3]">{title}</h2>
      <p className="mt-2 text-base leading-7 text-[#BFD2EA]">
        這會開一個新分頁，到你選的網站查。上面的自動搜尋會把論文存進雲端，這裡不會。
      </p>

      <form onSubmit={search} className="mt-6 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="例如：monkeypox review"
            aria-label="搜尋關鍵字"
            className="min-w-0 flex-1 rounded-xl border border-[#334155] bg-[#0B0F14] px-4 py-3 text-[#E6EDF3] outline-none transition placeholder:text-[#64748B] focus:border-cyan-400"
          />
          <button
            type="submit"
            className="rounded-xl bg-cyan-500 px-6 py-3 font-bold text-[#06202A] transition hover:bg-cyan-300"
          >
            到那個網站查
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {sources.map((source) => (
            <label
              key={source.id}
              className={`cursor-pointer rounded-xl border p-3 transition ${
                sourceId === source.id
                  ? "border-cyan-400/60 bg-cyan-400/10"
                  : "border-[#334155] bg-[#0B0F14]/60 hover:border-cyan-400/30"
              }`}
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="search-source"
                  value={source.id}
                  checked={sourceId === source.id}
                  onChange={() => setSourceId(source.id)}
                  className="accent-cyan-400"
                />
                <span className="font-bold text-[#E6EDF3]">{source.label}</span>
              </span>
              <span className="mt-1 block pl-5 text-xs text-[#9CA3AF]">
                {source.description}
              </span>
            </label>
          ))}
        </div>
      </form>

      {suggestions.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#64748B]">快速關鍵字：</span>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setQuery(suggestion)}
              className="rounded-full border border-[#334155] px-3 py-1.5 text-xs text-[#BFD2EA] transition hover:border-cyan-400/50 hover:text-cyan-300"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {message && <p className="mt-4 text-xs text-cyan-300">{message}</p>}
    </section>
  );
}
