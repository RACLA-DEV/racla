export interface WjmaxChartDataNote {
  type: 0 | 1
  index: number
  headMilliSec: number
  tailMilliSec: number
}

export interface WjmaxChartData {
  key: number
  mode: number
  level: number
  notes: WjmaxChartDataNote[]
}

export type WjmaxChartDataSection = Record<number, WjmaxChartDataNote[]>
