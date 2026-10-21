export type ResearchKind = "paper" | "dataset";

export type ResearchItem = {
  source: "europepmc" | "datacite" | "manual";
  externalId: string;
  kind: ResearchKind;
  title: string;
  authors: string[];
  year?: string;
  abstract?: string;
  doi?: string;
  pmid?: string;
  url: string;
  openAccess?: boolean;
};

export function buildSurveyQuery(parts: {
  target: string;
  b: string[];
  c: string[];
  d: string[];
  mode: "abd" | "abc";
}) {
  const a = parts.target.trim();
  const b = parts.b.map((x) => x.trim()).filter(Boolean);
  const third = (parts.mode === "abd" ? parts.d : parts.c).map((x) => x.trim()).filter(Boolean);
  const chunks = [a, ...b, ...third].filter(Boolean);
  return chunks.join(" ");
}

export async function searchEuropePmc(query: string, page = 1): Promise<ResearchItem[]> {
  const q = query.trim();
  if (!q) return [];
  const url = new URL("https://www.ebi.ac.uk/europepmc/webservices/rest/search");
  url.searchParams.set("query", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("pageSize", "10");
  url.searchParams.set("resultType", "core");
  url.searchParams.set("cursorMark", page <= 1 ? "*" : String(page));

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`Europe PMC ${res.status}`);
  const data = (await res.json()) as {
    resultList?: {
      result?: Array<{
        id?: string;
        pmid?: string;
        title?: string;
        authorString?: string;
        pubYear?: string;
        abstractText?: string;
        doi?: string;
        isOpenAccess?: string;
        fullTextUrlList?: { fullTextUrl?: Array<{ url?: string }> };
      }>;
    };
  };

  return (data.resultList?.result ?? []).map((r) => {
    const pmid = r.pmid || r.id || "";
    const doi = r.doi;
    const oaUrl = r.fullTextUrlList?.fullTextUrl?.[0]?.url;
    const urlOut = oaUrl
      || (doi ? `https://doi.org/${doi}` : "")
      || (pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : "https://europepmc.org/");
    return {
      source: "europepmc" as const,
      externalId: pmid || doi || r.title || cryptoRandom(),
      kind: "paper" as const,
      title: r.title || "(untitled)",
      authors: (r.authorString || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 8),
      year: r.pubYear,
      abstract: r.abstractText,
      doi,
      pmid: pmid || undefined,
      url: urlOut,
      openAccess: String(r.isOpenAccess).toLowerCase() === "y",
    };
  });
}

export async function searchDataCite(query: string, page = 1): Promise<ResearchItem[]> {
  const q = query.trim();
  if (!q) return [];
  const url = new URL("https://api.datacite.org/dois");
  url.searchParams.set("query", q);
  url.searchParams.set("page[size]", "10");
  url.searchParams.set("page[number]", String(Math.max(1, page)));
  url.searchParams.set("resource-type-id", "dataset");

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/vnd.api+json" },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`DataCite ${res.status}`);
  const data = (await res.json()) as {
    data?: Array<{
      id?: string;
      attributes?: {
        doi?: string;
        titles?: Array<{ title?: string }>;
        creators?: Array<{ name?: string }>;
        publicationYear?: number;
        descriptions?: Array<{ description?: string }>;
        url?: string;
      };
    }>;
  };

  return (data.data ?? []).map((r) => {
    const doi = r.attributes?.doi || r.id || "";
    const title = r.attributes?.titles?.[0]?.title || doi || "(untitled dataset)";
    return {
      source: "datacite" as const,
      externalId: doi || title,
      kind: "dataset" as const,
      title,
      authors: (r.attributes?.creators ?? [])
        .map((c) => c.name || "")
        .filter(Boolean)
        .slice(0, 8),
      year: r.attributes?.publicationYear ? String(r.attributes.publicationYear) : undefined,
      abstract: r.attributes?.descriptions?.[0]?.description,
      doi: doi || undefined,
      url: r.attributes?.url || (doi ? `https://doi.org/${doi}` : "https://commons.datacite.org/"),
      openAccess: true,
    };
  });
}

function cryptoRandom() {
  return `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
