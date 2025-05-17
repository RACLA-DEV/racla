import type { LogLevel } from '@src/types/dto/log/LogLevel'
import { SongData } from '@src/types/games/SongData'
import type { SessionData } from '@src/types/sessions/SessionData'
import type { SettingsData } from '@src/types/settings/SettingData'
import { contextBridge, ipcRenderer } from 'electron'
import type { ProcessDescriptor } from 'ps-list'

contextBridge.exposeInMainWorld('electron', {
  // 메세징 관련
  sendMsg: (msg: string): Promise<string> => ipcRenderer.invoke('message:send-msg', msg),
  onReplyMsg: (cb: (msg: string) => any) =>
    ipcRenderer.on('reply-msg', (_event, msg: string) => cb(msg)),

  // 프로세스 관련
  getPsList: (): Promise<ProcessDescriptor[]> => ipcRenderer.invoke('process-manager:list'),

  // 오버레이 관련
  createOverlay: (): Promise<boolean> => ipcRenderer.invoke('overlay:create'),
  sendToOverlay: (message: string): Promise<boolean> => ipcRenderer.invoke('overlay:send', message),
  onOverlayMessage: (callback: (data: any) => void) =>
    ipcRenderer.on('overlay-msg', (_event, message) => callback(message)),
  closeOverlay: (): Promise<boolean> => ipcRenderer.invoke('overlay:close'),

  // 게임 모니터링 관련
  getProcessList: () => ipcRenderer.invoke('monitor:get-process-list'),
  getActiveWindows: () => ipcRenderer.invoke('monitor:get-active-windows'),
  checkGameStatus: (processName: string) => ipcRenderer.invoke('monitor:check-game', processName),
  getGameWindow: () => ipcRenderer.invoke('monitor:get-game-window'),
  initializeMonitor: () => ipcRenderer.invoke('monitor:initialize'),

  // 로깅 관련
  sendLog: (level: LogLevel, where: string, ...args: unknown[]) =>
    ipcRenderer.invoke('logger:create-log', level, where, ...args),
  clearAllLogs: () => ipcRenderer.invoke('file-manager:clear-all-logs'),

  // 캡처 관련
  captureGameWindow: (gameTitle: string) =>
    ipcRenderer.invoke('image-processor:capture-game-window', gameTitle),

  // 파일 관리자 관련
  saveSettings: (settings: SettingsData) =>
    ipcRenderer.invoke('file-manager:save-settings', settings),
  loadSettings: () => ipcRenderer.invoke('file-manager:load-settings'),
  saveSongData: (data: { gameCode: string; songData: SongData[] }) =>
    ipcRenderer.invoke('file-manager:save-song-data', data),
  loadSongData: (gameCode: string) => ipcRenderer.invoke('file-manager:load-song-data', gameCode),

  // 윈도우 컨트롤 관련
  closeApp: () => ipcRenderer.send('window:close'),
  minimizeApp: () => ipcRenderer.send('window:minimize'),
  maximizeApp: () => ipcRenderer.send('window:maximize'),

  // 외부 URL 열기 관련
  openExternalUrl: (url: string) => ipcRenderer.invoke('window:open-external-url', url),
  onConfirmExternalLink: (callback: (url: string) => void) =>
    ipcRenderer.on('confirm-external-link', (_event, url: string) => callback(url)),

  // 로그인 관련
  login: (sessionData: SessionData) => ipcRenderer.invoke('auth-manager:login', sessionData),
  logout: () => ipcRenderer.invoke('auth-manager:logout'),
  checkLoggedIn: () => ipcRenderer.invoke('auth-manager:check-logged-in'),
  getSession: () => ipcRenderer.invoke('auth-manager:get-session'),
  createPlayerFile: (data: { playerId: number; playerToken: string }) =>
    ipcRenderer.invoke('auth-manager:create-player-file', data),
  openDiscordLogin: () => ipcRenderer.invoke('auth-manager:open-discord-login'),
  openBrowser: (url: string) => ipcRenderer.invoke('auth-manager:open-browser', url),

  // 파일 관리자 관련
  getStorageInfo: () => ipcRenderer.invoke('file-manager:get-storage-info'),
  getFolderPaths: () => ipcRenderer.invoke('file-manager:get-folder-paths'),
  openFolder: (folderType: 'documents' | 'pictures' | 'logs' | 'appData') =>
    ipcRenderer.invoke('file-manager:open-folder', folderType),

  // 앱 관련
  restartApp: () => ipcRenderer.invoke('app:restart'),
  openFileDialog: (options: {
    title?: string
    defaultPath?: string
    filters?: { name: string; extensions: string[] }[]
  }) => ipcRenderer.invoke('file-manager:open-file-dialog', options),

  // 업데이트 관련
  onUpdateAvailable: (callback: (version: string) => void) =>
    ipcRenderer.on('update-available', (_event, version: string) => callback(version)),
  onDownloadProgress: (
    callback: (progress: { percent: number; transferred: number; total: number }) => void,
  ) => ipcRenderer.on('download-progress', (_event, progress) => callback(progress)),
  onUpdateDownloaded: (callback: (version: string) => void) =>
    ipcRenderer.on('update-downloaded', (_event, version: string) => callback(version)),
  updateApp: () => ipcRenderer.invoke('update-manager:update-app'),
  initializeUpdate: () => ipcRenderer.invoke('update-manager:initialize'),

  // 디스코드 관련
  initializeDiscord: () => ipcRenderer.invoke('discord-manager:initialize'),

  // OCR 관련
  getOcrResultServer: (data: { image: Buffer; gameCode: string }) =>
    ipcRenderer.invoke('ocr-manager:get-ocr-result-server', data),
})
