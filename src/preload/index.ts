import { contextBridge, ipcRenderer } from 'electron'

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
  captureGameWindow: (gameTitle: string) => ipcRenderer.invoke('image-processor:capture-game-window', gameTitle),
})
