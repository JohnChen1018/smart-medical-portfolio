// Generated from 平均最高.xlsx
export interface MpoxRun {
  run: number;
  batchSize: number;
  lr: number;
  epochs: number;
  trainAcc: number;
  testAcc: number;
  auc: number;
  precision: number;
  recall: number;
  f1: number;
  loss: number;
  timeSpent: number;
}

export const mpoxClassCounts = [
  { key: "Monkeypox", zh: "猴痘 Monkeypox", count: 1428, pct: 44.7 },
  { key: "Others", zh: "非猴痘 Others", count: 1764, pct: 55.3 },
];

export const mpoxTotalImages = 3192;
export const mpoxSplit = { total: 3192, train: 2553, test: 639 };

export const mpoxRuns: MpoxRun[] = [
  { run: 1, batchSize: 32, lr: 0.0001, epochs: 30, trainAcc: 100, testAcc: 96.5571, auc: 0.9952, precision: 0.9681, recall: 0.9629, f1: 0.9655, loss: 0.0004, timeSpent: 427.66 },
  { run: 2, batchSize: 32, lr: 0.0001, epochs: 30, trainAcc: 100, testAcc: 97.1831, auc: 0.9959, precision: 0.973, recall: 0.9702, f1: 0.9716, loss: 0.0008, timeSpent: 448.06 },
  { run: 3, batchSize: 32, lr: 0.0001, epochs: 30, trainAcc: 100, testAcc: 97.0266, auc: 0.9954, precision: 0.9704, recall: 0.9694, f1: 0.9699, loss: 0.002, timeSpent: 449.93 },
  { run: 4, batchSize: 32, lr: 0.0001, epochs: 30, trainAcc: 100, testAcc: 97.0266, auc: 0.9968, precision: 0.9712, recall: 0.9688, f1: 0.97, loss: 0.0013, timeSpent: 450.18 },
  { run: 5, batchSize: 32, lr: 0.0001, epochs: 30, trainAcc: 100, testAcc: 96.5571, auc: 0.9958, precision: 0.9666, recall: 0.9639, f1: 0.9652, loss: 0.0001, timeSpent: 451.59 },
  { run: 6, batchSize: 32, lr: 0.0001, epochs: 30, trainAcc: 100, testAcc: 97.6526, auc: 0.9964, precision: 0.9776, recall: 0.9751, f1: 0.9763, loss: 0.015, timeSpent: 451.45 },
  { run: 7, batchSize: 32, lr: 0.0001, epochs: 30, trainAcc: 100, testAcc: 97.0266, auc: 0.9957, precision: 0.9721, recall: 0.9681, f1: 0.9701, loss: 0.0023, timeSpent: 453.18 },
  { run: 8, batchSize: 32, lr: 0.0001, epochs: 30, trainAcc: 100, testAcc: 96.8701, auc: 0.9953, precision: 0.9703, recall: 0.9667, f1: 0.9685, loss: 0.0001, timeSpent: 465.3 },
  { run: 9, batchSize: 32, lr: 0.0001, epochs: 30, trainAcc: 100, testAcc: 96.5571, auc: 0.9963, precision: 0.9666, recall: 0.9639, f1: 0.9652, loss: 0.0016, timeSpent: 454.15 },
  { run: 10, batchSize: 32, lr: 0.0001, epochs: 30, trainAcc: 100, testAcc: 96.7136, auc: 0.9934, precision: 0.9689, recall: 0.9649, f1: 0.9669, loss: 0.0007, timeSpent: 453.35 },
];

export const mpoxAverage10 = {
  testAcc: 96.9171,
  testAccStd: 0.09,
  auc: 0.9956,
  precision: 0.9705,
  recall: 0.9674,
  f1: 0.9689,
  loss: 0.0024,
};

export const mpoxAverage500 = {
  testAcc: 96.776,
  testAccStd: 0.4716,
  auc: 0.9955,
  precision: 0.9692,
  recall: 0.9634,
  f1: 0.9675,
  loss: 0.0018,
};

export const mpoxBestRun = mpoxRuns.reduce((a, b) => (b.testAcc > a.testAcc ? b : a));
