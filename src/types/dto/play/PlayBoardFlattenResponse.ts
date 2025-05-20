import { PlayBoardPatternInfo } from './PlayBoardPatternInfo'

export interface PlayBoardFlattenResponse {
  patterns_4B: PlayBoardPatternInfo[]
  patterns_4B_PLUS: PlayBoardPatternInfo[]
  patterns_6B: PlayBoardPatternInfo[]
  patterns_6B_PLUS: PlayBoardPatternInfo[]
}
