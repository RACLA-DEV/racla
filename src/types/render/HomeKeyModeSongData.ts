import { PlayBoardPatternInfo } from '../dto/play/PlayBoardPatternInfo'
import { BoardPatternInfo } from '../games/SongData'

type DjmaxKeyModeData = Record<string, BoardPatternInfo[]>
type PlatinaLabKeyModeData = Record<string, PlayBoardPatternInfo[]>

export type { DjmaxKeyModeData, PlatinaLabKeyModeData }
