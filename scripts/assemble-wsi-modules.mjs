import fs from "node:fs";
import path from "node:path";

const wsi = path.join("src", "components", "projects", "wsi");

function read(p) {
  return fs.readFileSync(path.join(wsi, p), "utf8").trim();
}

function write(rel, header, body) {
  const out = path.join(wsi, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, `${header.trim()}\n\n${body.trim()}\n`, "utf8");
}

function expify(body) {
  return body
    .replace(/^function /gm, "export function ")
    .replace(/^const /gm, "export const ");
}

// shared layout
write(
  "shared/WsiLayoutParts.tsx",
  `"use client";

import { useState, type ReactNode } from "react";
import { wsiUi } from "@/lib/wsiUiLabels";`,
  expify(read("shared/_layout.body.ts")).replace(/export function StatBox/g, "export function WsiStatBox"),
);

// ApplicationTab
write(
  "ApplicationTab.tsx",
  `"use client";

import { FaExternalLinkAlt } from "react-icons/fa";
import { SectionHeader } from "@/components/projects/shared/SectionHeader";
import { getMergedApplicationSection, type ProjectWithDashboard } from "@/lib/wsiCms";
import { wsiUi } from "@/lib/wsiUiLabels";`,
  expify(read("_app.body.ts")).replace("ApplicationTab", "WsiApplicationTab").replace(
    "export function WsiApplicationTab",
    "export function ApplicationTab",
  ),
);

// DataTab
const patchBody = expify(read("_patch.body.ts"));
const dataBody = expify(read("_data.body.ts")).replace(/WsiStatBox/g, "StatBox").replace(/StatBox/g, "WsiStatBox");
write(
  "DataTab.tsx",
  `"use client";

import { useEffect, useMemo, useState } from "react";
import { FaExternalLinkAlt, FaTimes } from "react-icons/fa";
import { SectionHeader } from "@/components/projects/shared/SectionHeader";
import { WsiStatBox } from "@/components/projects/wsi/shared/WsiLayoutParts";
import { dataSection } from "@/lib/wsiDashboard";
import { classCounts, datasetSplit, totalNuclei } from "@/lib/wsiResults";
import { patchIndicesByClass } from "@/lib/patchClassIndex";
import { patchCountsFor, sortPatchIndices } from "@/lib/patchCounts";
import { wsiUi } from "@/lib/wsiUiLabels";`,
  `${patchBody}\n\n${dataBody.replace(/WsiStatBox/g, "WsiStatBox")}`,
);

// Modeling - skip hpSummary (first 12 lines) from parts
const modelingParts = read("modeling/_parts.body.ts").split("\n").slice(12).join("\n");
write(
  "modeling/ModelingTab.tsx",
  `"use client";

import { useState } from "react";
import { FaExternalLinkAlt, FaTimes } from "react-icons/fa";
import { SectionHeader } from "@/components/projects/shared/SectionHeader";
import { CollapsibleSection } from "@/components/projects/wsi/shared/WsiLayoutParts";
import { StarDistAnimation } from "@/components/projects/StarDistAnimation";
import { modelingSection } from "@/lib/wsiDashboard";
import { wsiUi } from "@/lib/wsiUiLabels";
import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";`,
  `${expify(modelingParts)}`,
);

// Confusion matrix view
const lines = fs.readFileSync(path.join("src", "components", "projects", "WorkflowDashboard.tsx"), "utf8").split("\n");
const confusionBody = expify(lines.slice(1615, 1642).join("\n"));

write(
  "experiment/ExperimentPanels.tsx",
  `"use client";

import { useEffect, useMemo, useState } from "react";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { getRootExperimentMeta } from "@/lib/wsiRootExperiments";
import type { ConfusionMatrix, WsiConfig } from "@/lib/wsiResults";
import { wsiUi, fmtMetric } from "@/lib/wsiUiLabels";
import { hpDisplay, localConfusionForExp } from "@/components/projects/wsi/wsiDashboardUtils";`,
  `${expify(read("experiment/_panels.body.ts"))}\n\n${confusionBody}`,
);

write(
  "SimulationTab.tsx",
  `"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SectionHeader } from "@/components/projects/shared/SectionHeader";
import { useTrainingStatus } from "@/components/projects/shared/useTrainingStatus";
import { useGdriveExperiments } from "@/components/projects/wsi/GdriveExperimentsContext";
import { useMergedWsiData } from "@/components/projects/wsi/useMergedWsiData";
import { hpSummary, pickDriveFolderId } from "@/components/projects/wsi/wsiDashboardUtils";
import {
  CollapsibleSection,
  ExpAccordionItem,
  WsiStatBox,
} from "@/components/projects/wsi/shared/WsiLayoutParts";
import {
  ExpConfusionSection,
  ExpTrainingChartSection,
  HyperparamGridTable,
  HyperparamPanel,
} from "@/components/projects/wsi/experiment/ExperimentPanels";
import { simulationExpOrder, totalConfigsPlanned, getRootExperimentMeta } from "@/lib/wsiRootExperiments";
import { localConfusionForExp } from "@/components/projects/wsi/wsiDashboardUtils";
import { wsiUi, fmtMetric } from "@/lib/wsiUiLabels";`,
  expify(read("_sim.body.ts")),
);

write(
  "AnalysisTab.tsx",
  `"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { FaFlask, FaRobot } from "react-icons/fa";
import { SectionHeader } from "@/components/projects/shared/SectionHeader";
import { useGdriveExperiments } from "@/components/projects/wsi/GdriveExperimentsContext";
import { useMergedWsiData } from "@/components/projects/wsi/useMergedWsiData";
import { wsiUi } from "@/lib/wsiUiLabels";

const ComparePaperPage = dynamic(
  () => import("@/components/projects/wsi/ComparePaperPage").then((m) => m.ComparePaperPage),
  { ssr: false },
);
const MetricGlossaryPage = dynamic(
  () => import("@/components/projects/wsi/MetricGlossaryPage").then((m) => m.MetricGlossaryPage),
  { ssr: false },
);
const ResultsOverviewPage = dynamic(
  () => import("@/components/projects/wsi/ResultsOverviewPage").then((m) => m.ResultsOverviewPage),
  { ssr: false },
);
const AiSuggestPage = dynamic(
  () => import("@/components/projects/wsi/AiSuggestPage").then((m) => m.AiSuggestPage),
  { ssr: false },
);
const FrontendShowcasePage = dynamic(
  () => import("@/components/projects/wsi/FrontendShowcasePage").then((m) => m.FrontendShowcasePage),
  { ssr: false },
);`,
  expify(read("_analysis.body.ts")),
);

console.log("assembled wsi modules");
