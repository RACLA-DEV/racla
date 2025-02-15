import { app } from 'electron'

export const GLOBAL_DICTONARY = {
  SUPPORTED_GAME_PROCESS_NAME_LIST: ['DJMAX RESPECT V.exe', 'WJMAX.exe', ...[!app.isPackaged ? 'notepad.exe' : null]],
  NOT_SUPPORTED_GAME_PROCESS_NAME_LIST: ['MuseDash.exe', 'osu!.exe'],
}
