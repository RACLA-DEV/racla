export interface SettingsData {
  theme: 'light' | 'dark'
  sidebarCollapsed: boolean
  hardwareAcceleration?: boolean
  homeButtonAlignRight?: boolean
  visibleBga?: boolean
  autoCaptureMode?: boolean
  autoCaptureIntervalTime?: number
  language?: string
  font?: string
  autoCaptureApi?: string
  visibleAnimation?: boolean
  captureOnlyFocused?: boolean
  autoUpdate?: boolean
  autoRemoveBlackPixel?: boolean
  removeBlackPixelPx?: number
  saveImageWhenCapture?: boolean
  saveImageWithAllProfileWhenCapture?: boolean
  saveImageWithoutOtherProfileWhenCapture?: boolean
  saveImageWithoutAllProfileWhenCapture?: boolean
  saveImageBlurMode?: string
  resultOverlay?: boolean
  hjaOverlay?: boolean
  recentOverlay?: boolean
  alwaysOverlay?: boolean
  autoCaptureOcrResultRegion?: boolean
  autoCaptureOcrOpen3Region?: boolean
  autoCaptureOcrOpen2Region?: boolean
  autoCaptureOcrVersusRegion?: boolean
  autoCaptureWjmaxOcrResultRegion?: boolean
  autoCapturePlatinaLabOcrResultRegion?: boolean
  autoStartGame?: boolean
  autoStartGameDjmaxRespectV?: boolean
  autoStartGameWjmax?: boolean
  autoStartGameWjmaxPath?: string
  autoStartGamePlatinaLab?: boolean
  isMiniMode?: boolean
  closeToTray?: boolean
  isNotificationSound?: boolean
  autoDeleteCapturedImages?: number
  // 필요에 따라 다른 설정들도 추가할 수 있습니다.
}
