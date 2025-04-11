import { contextBridge, ipcRenderer } from 'electron'

import type { SessionData, SettingsData } from '@src/main/modules/file-manager/file-manager.service'
import type { LogLevel } from '@src/types/LogLevel'
import type { ProcessDescriptor } from 'ps-list'

contextBridge.exposeInMainWorld('electron', {
  // 메세징 관련
  sendMsg: (msg: string): Promise<string> => ipcRenderer.invoke('message:send-msg', msg),
  onReplyMsg: (cb: (msg: string) => any) =>
    ipcRenderer.on('reply-msg', (_event, msg: string) => cb(msg)),

  // 프로세스 관련
  getPsList: (): Promise<ProcessDescriptor[]> => ipcRenderer.invoke('process:list'),

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

  // 로깅 관련
  sendLog: (level: LogLevel, where: string, ...args: any[]) =>
    ipcRenderer.invoke('logger:create-log', level, where, ...args),

  // 캡쳐 관련
  captureGameWindow: (gameTitle: string) =>
    ipcRenderer.invoke('image-processor:capture-game-window', gameTitle),

  // 파일 관리자 관련
  saveSettings: (settings: SettingsData) =>
    ipcRenderer.invoke('file-manager:save-settings', settings),
  loadSettings: () => ipcRenderer.invoke('file-manager:load-settings'),

  // 윈도우 컨트롤 관련
  closeApp: () => ipcRenderer.send('window:close'),
  minimizeApp: () => ipcRenderer.send('window:minimize'),
  maximizeApp: () => ipcRenderer.send('window:maximize'),

  // 외부 URL 열기
  openExternalUrl: (url: string) => ipcRenderer.invoke('window:open-external-url', url),

  // 외부 링크 확인 이벤트
  onConfirmExternalLink: (callback: (url: string) => void) =>
    ipcRenderer.on('confirm-external-link', (_event, url: string) => callback(url)),

  // 로그인 관련
  login: (sessionData: SessionData) => ipcRenderer.invoke('auth:login', sessionData),
  logout: () => ipcRenderer.invoke('auth:logout'),
  checkLoggedIn: () => ipcRenderer.invoke('auth:check-logged-in'),
  getSession: () => ipcRenderer.invoke('auth:get-session'),
  createPlayerFile: (data: { userNo: string; userToken: string }) =>
    ipcRenderer.invoke('auth:create-player-file', data),
  openDiscordLogin: () => ipcRenderer.invoke('auth:open-discord-login'),
  openBrowser: (url: string) => ipcRenderer.invoke('auth:open-browser', url),
})
