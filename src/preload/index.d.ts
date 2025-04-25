import type { LogLevel } from '@src/types/common/LogLevel'
import type { SessionData } from '@src/types/common/SessionData'
import type { SettingsData } from '@src/types/common/SettingData'
import type { StorageInfo } from '@src/types/common/StroageInfo'
import type { Result } from 'get-windows'
import type { ProcessDescriptor } from 'ps-list'

declare global {
  // namespace React {
  //   interface CSSProperties {
  //     WebkitAppRegion?: 'drag' | 'no-drag'
  //   }
  // }
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

      //캡처 관련
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

      // 파일 관리자 관련
      getStorageInfo: () => Promise<StorageInfo>
      getFolderPaths: () => Promise<{
        documents: string
        pictures: string
        logs: string
        appData: string
      }>
      openFolder: (folderType: 'documents' | 'pictures' | 'logs' | 'appData') => Promise<boolean>

      // 앱 재시작 관련
      restartApp: () => Promise<boolean>

      // 로그 관련
      clearAllLogs: () => Promise<boolean>

      openFileDialog: (options: {
        title?: string
        defaultPath?: string
        filters?: Array<{ name: string; extensions: string[] }>
      }) => Promise<string | null>

      // 업데이트 관련
      onUpdateAvailable: (callback: (version: string) => void) => void
      onDownloadProgress: (
        callback: (progress: { percent: number; transferred: number; total: number }) => void,
      ) => void
      onUpdateDownloaded: (callback: (version: string) => void) => void
      updateApp: () => void
    }
  }
}

export {}
