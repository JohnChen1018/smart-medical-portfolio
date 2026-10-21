export type StepKey = "application" | "data" | "modeling" | "simulation" | "analysis";

export type WorkCopy = {
  title: string;
  description: string;
  category: string;
};

export type Dictionary = {
  skip: string;
  brand: string;
  nav: {
    projects: string;
    about: string;
    admin: string;
    switchViewer: string;
    switchAsk: string;
    adminRole: string;
  };
  notFound: { title: string; back: string };
  crash: { title: string; reload: string };
  language: { menu: string };
  home: {
    welcome: string;
    look: string;
    manage: string;
    nameTitle: string;
    nameLabel: string;
    namePlaceholder: string;
    cancel: string;
    start: string;
    loginTitle: string;
    username: string;
    password: string;
    login: string;
    codeTitle: string;
    codeLabel: string;
    setupTitle: string;
    setupHint: string;
    recoveryHint: string;
    confirm: string;
    needName: string;
    enterFailed: string;
    loginFailed: string;
    works: string;
    openAdmin: string;
    emptyCategory: string;
    seeAll: string;
    loading: string;
  };
  status: {
    all: string;
    inProgress: string;
    completed: string;
    notStarted: string;
    filter: string;
  };
  projects: {
    empty: string;
    seeAll: string;
    items: {
      "whole-slide-object-detection": WorkCopy;
      "survey-paper": WorkCopy;
      "cat-lymphoma": WorkCopy;
      monkeypox: WorkCopy;
      face: WorkCopy;
    };
  };
  about: { title: string; empty: string; seeWorks: string };
  detail: { back: string; steps: string };
  steps: Record<StepKey, { label: string; description: string }>;
  survey: {
    intro: string;
    topicsTitle: string;
    backTopics: string;
    topics: {
      "survey-mpox": { title: string; summary: string };
      "survey-cat-lymphoma": { title: string; summary: string };
      "survey-wsi": { title: string; summary: string };
      "survey-cross-review": { title: string; summary: string };
    };
  };
  surveyPanel: {
    now: string;
    topicPlaceholder: string;
    getKeywords: string;
    findingKeywords: string;
    source: string;
    seeSource: string;
    useKeywords: string;
    cloudTitle: string;
    startSearch: string;
    searching: string;
    diseaseTerms: string;
    searchKeywords: string;
    aiTerms: string;
    aiKeywords: string;
    taskTerms: string;
    addPlaceholder: string;
    add: string;
    selected: string;
    unselected: string;
    needDisease: string;
    needKeyword: string;
    needAi: string;
    filterList: string;
    filterPlaceholder: string;
    byTitle: string;
    expandAll: string;
    collapseAll: string;
    none: string;
    localOnly: string;
    savedLine: (folder: string, seen: number, pdfs: number) => string;
    updated: (time: string) => string;
  };
  wsi: {
    reading: string;
    readingOn: string;
    zoomOut: string;
    zoomIn: string;
    zoomReset: string;
  };
};
