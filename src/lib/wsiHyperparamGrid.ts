/** 48+2 組標準超參數網格（與訓練腳本一致） */
const FILTER_BASES = [32, 64] as const;
const CONV_AFTER = [128, 256] as const;
const HEAD_BLOCKS = [1, 2] as const;
const LEARNING_RATES = [0.0003, 0.0001] as const;
const LOSS_THIRD = [1.0, 5.0, 10.0] as const;

export interface HyperparamGridEntry {
  filterBase: number;
  convAfter: number;
  headBlocks: number;
  lr: number;
  lossWeights: string;
}

function buildGrid(): Map<number, HyperparamGridEntry> {
  const map = new Map<number, HyperparamGridEntry>();
  let expId = 1;
  for (const filterBase of FILTER_BASES) {
    for (const convAfter of CONV_AFTER) {
      for (const headBlocks of HEAD_BLOCKS) {
        for (const lr of LEARNING_RATES) {
          for (const third of LOSS_THIRD) {
            map.set(expId, {
              filterBase,
              convAfter,
              headBlocks,
              lr,
              lossWeights: `[1.0, 0.2, ${third}]`,
            });
            expId += 1;
          }
        }
      }
    }
  }
  return map;
}

export const wsiHyperparamGrid = buildGrid();

export function hyperparamsFromGrid(expId: number): HyperparamGridEntry | undefined {
  return wsiHyperparamGrid.get(expId);
}
