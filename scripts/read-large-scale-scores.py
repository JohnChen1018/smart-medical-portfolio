import io
import json
import re
import statistics
import zipfile
from pathlib import Path

BASE = Path(r"C:\Users\John\Desktop\he\500 run")
OUT = Path(__file__).resolve().parents[1] / "src" / "lib" / "wsiLargeScaleScores.json"

GROUPS = [
    ("g1", "RandomPatch，切分 80 / 10 / 10，完整結果", "Exp451_50runs_RandomPatch_80_10_10_complete.zip"),
    ("g2", "已完成結果", "Exp451_completed_64runs.zip"),
    ("g3", "run 1 到 run 39", "Exp451_run1_to_run39.zip"),
    ("g4", "run 1 到 run 28", "Exp451_run1_to_run28_complete.zip"),
    ("g5", "run 1 到 run 20", "Exp451_run1-run20.zip"),
]

KEEP = [
    "mPQ+",
    "Mask_PQ",
    "Mask_DQ",
    "Mask_SQ",
    "PQ_Neutrophil",
    "PQ_Epithelial",
    "PQ_Lymphocyte",
    "PQ_Plasma",
    "PQ_Eosinophil",
    "PQ_Connective",
]


def sheet_metrics(xlsx: bytes) -> dict[str, float]:
    nested = zipfile.ZipFile(io.BytesIO(xlsx))
    xml = nested.read("xl/worksheets/sheet3.xml").decode("utf-8")
    metrics: dict[str, float] = {}
    for row in re.findall(r"<row[^>]*>(.*?)</row>", xml):
        name = re.search(r'r="A\d+"[^>]*>.*?<t>([^<]*)</t>', row)
        value = re.search(r'r="B\d+"[^>]*>.*?<v>([^<]*)</v>', row)
        if not name or not value:
            continue
        key = name.group(1)
        if key not in KEEP:
            continue
        metrics[key] = float(value.group(1))
    return metrics


def run_label(path: str) -> tuple[int, str]:
    match = re.search(r"run(\d+)/results_final_epoch.xlsx$", path, re.I)
    number = int(match.group(1)) if match else 0
    if "FreshRandomSeeds" in path:
        return number, f"另外 14 次 · run {number}"
    if "LeakyReLU" in path:
        return number, f"前 50 次 · run {number}"
    return number, f"run {number}"


def summarize(rows: list[dict[str, float]]) -> dict[str, dict[str, float]]:
    summary: dict[str, dict[str, float]] = {}
    keys = [key for key in KEEP if any(key in row for row in rows)]
    for key in keys:
        values = [row[key] for row in rows if key in row]
        summary[key] = {
            "mean": statistics.fmean(values),
            "std": statistics.stdev(values) if len(values) > 1 else 0.0,
            "n": len(values),
        }
    return summary


def main() -> None:
    groups = []
    pooled: list[dict[str, float]] = []
    for group_id, title, filename in GROUPS:
        archive = zipfile.ZipFile(BASE / filename)
        paths = sorted(
            (name for name in archive.namelist() if name.lower().endswith("results_final_epoch.xlsx")),
            key=lambda name: run_label(name),
        )
        items = []
        for path in paths:
            metrics = sheet_metrics(archive.read(path))
            order, label = run_label(path)
            items.append({"order": order, "label": label, "metrics": metrics})
            pooled.append(metrics)
        groups.append(
            {
                "id": group_id,
                "title": title,
                "runs": len(items),
                "summary": summarize([item["metrics"] for item in items]),
                "items": items,
            }
        )
        print(group_id, len(items), "mPQ+", round(groups[-1]["summary"]["mPQ+"]["mean"], 4))

    payload = {
        "totalRuns": len(pooled),
        "groups": groups,
        "overall": summarize(pooled),
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    print("wrote", OUT, "runs", len(pooled))


if __name__ == "__main__":
    main()
