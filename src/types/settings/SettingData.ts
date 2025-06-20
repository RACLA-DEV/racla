export interface SettingsData {
  theme?: 'light' | 'dark'
  sidebarCollapsed?: boolean
  hardwareAcceleration?: boolean
  homeButtonAlignRight?: boolean
  visibleBga?: boolean
  autoCaptureMode?: boolean
  autoCaptureIntervalTime?: number
  autoCaptureDelayTime?: number
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
  hardJudgementPlayRecordOverlay?: boolean
  recentOverlay?: boolean
  alwaysOverlay?: boolean
  enableOverlayWindow?: boolean
  autoCaptureDjmaxRespectVOcrResultRegion?: boolean
  autoCaptureDjmaxRespectVOcrOpen3Region?: boolean
  autoCaptureDjmaxRespectVOcrOpen2Region?: boolean
  autoCaptureDjmaxRespectVOcrVersusRegion?: boolean
  autoCapturePlatinaLabOcrResultRegion?: boolean
  autoCaptureEz2onOcrResultRegion?: boolean
  autoStartGame?: boolean
  autoStartGameDjmaxRespectV?: boolean
  autoStartGamePlatinaLab?: boolean
  isMiniMode?: boolean
  hideToTray?: boolean
  isNotificationSound?: boolean
  autoDeleteCapturedImages?: number
  isCheckedForUpdate?: boolean
  // 게임 표시 설정
  showGameDjmaxRespectV?: boolean
  showGamePlatinaLab?: boolean
  // 필요에 따라 다른 설정들도 추가할 수 있습니다.
}
