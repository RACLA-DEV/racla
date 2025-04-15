import type { LogLevel } from '@src/types/LogLevel'
import type { Result } from 'get-windows'
import type { ProcessDescriptor } from 'ps-list'

declare global {
  interface Window {
    electron: {
      // 메세징 관련
      sendMsg: (msg: string) => Promise<string>
      onReplyMsg: (cb: (msg: string) => any) => void

      // 프로세스 관련
      getActiveWindows: () => Promise<Result>
      getPsList: () => Promise<ProcessDescriptor[]>

      // 오버레이 관련
      createOverlay: () => Promise<boolean>
      closeOverlay: () => Promise<boolean>

      // 게임 모니터링 관련
      sendToOverlay: (message: string) => Promise<boolean>
      getProcessList: () => Promise<ProcessDescriptor[]>
      onOverlayMessage: (callback: (data: any) => void) => void

      // 로깅 관련
      sendLog: (level: LogLevel, where: string, ...args: any[]) => void

      //캡쳐 관련
      captureGameWindow: (gameTitle: string) => Promise<Buffer | null>

      // 파일 관리자 관련
      saveSettings: (settings: SettingsData) => Promise<SettingsData>
      loadSettings: () => Promise<SettingsData>
      saveSongData: (data: { gameCode: string; songData: any[] }) => Promise<boolean>
      loadSongData: (gameCode: string) => Promise<any[]>

      // 윈도우 컨트롤 관련
      closeApp: () => void
      minimizeApp: () => void
      maximizeApp: () => void
      openExternalUrl: (url: string) => void
      onConfirmExternalLink: (callback: (url: string) => void) => void

      login: (sessionData: SessionData) => Promise<boolean>
      logout: () => Promise<boolean>
      checkLoggedIn: () => Promise<boolean>
      getSession: () => Promise<SessionData>
      createPlayerFile: (data: { userNo: string; userToken: string }) => Promise<boolean>
      openDiscordLogin: () => Promise<string>
      openBrowser: (url: string) => Promise<boolean>
    }
  }
}

export {}
