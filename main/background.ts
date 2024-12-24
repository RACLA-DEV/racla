import path from 'path'
import fs from 'fs'
import { app, BrowserWindow, desktopCapturer, ipcMain, screen, session, shell, globalShortcut } from 'electron'
import serve from 'electron-serve'
import { createWindow } from './helpers'
import {
  clearSession,
  getSession,
  getSettingData,
  getSongData,
  getWjmaxSongData,
  storeSession,
  storeSettingData,
  storeSongData,
  storeWjmaxSongData,
} from './fsManager'
import { autoUpdater } from 'electron-updater'
import sharp from 'sharp'
import Tesseract from 'tesseract.js'
import moment from 'moment'
import { Window } from 'node-screenshots'
import { exec } from 'child_process'
import 'moment/locale/ko'
import FormData from 'form-data'
import axios from 'axios'
import { createDecipheriv, randomUUID } from 'crypto'
import { settingsManager } from './settingsManager'
import { promisify } from 'util'
import { is, over } from 'ramda'
const isProd = process.env.NODE_ENV === 'production'

const execAsync = promisify(exec)

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

const baseDir = !isProd ? path.join(__dirname, '/../') : app.getAppPath().replace('app.asar', '')

let isLogined = false
let isLoaded = false

let settingData: any = {
  hardwareAcceleration: true,
  homeButtonAlignRight: false,
  autoCaptureMode: false,
  autoCaptureIntervalTime: 3000,
  autoCaptureApi: 'xcap-api',
  visibleBga: true,
  language: 'ko',
  rivalName: '',
  visibleAnimation: true,
  captureOnlyFocused: true,
  autoUpdate: false,
  autoRemoveBlackPixel: true,
  removeBlackPixelPx: 8,
  saveImageWhenCapture: true,
}
let isUploaded = false
let overlayWindow: BrowserWindow | null = null
let removedPixels = 0
let isFullscreen = false
let isProcessing = false
const WJMAX_ENCRYPTION_KEY = '99FLKWJFL;l99r7@!()f09sodkjfs;a;o9fU#@'

const gameList = { djmax_respect_v: 'DJMAX RESPECT V', wjmax: 'WJMAX' }

;(async () => {
  await app.whenReady()

  const isRegistered = globalShortcut.register('Ctrl+Alt+Insert', () => {
    pressAltInsert()
  })

  if (!isRegistered) {
    console.error('Global shortcut registration failed')
  } else {
    console.log('Global shortcut registered successfully')
  }

  app.on('will-quit', () => {
    globalShortcut.unregisterAll()
  })

  const mainWindow = createWindow('main', {
    width: 1280,
    height: 720,
    minWidth: 1280,
    minHeight: 720,
    frame: false,
    center: true,
    icon: path.join(__dirname + '/../resources/', 'icon.ico'),
    webPreferences: {
      webviewTag: true,
      nodeIntegration: true,
      // devTools: !isProd,
      devTools: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  mainWindow.on('closed', () => {
    app.quit()
  })

  overlayWindow = createWindow('overlay', {
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true, // 항상 위에 표시
    focusable: false, // 포커스를 받을 수 없음
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: true,
      devTools: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    autoHideMenuBar: true,
    show: false,
    useContentSize: true,
    type: 'toolbar', // 창 유형을 'toolbar'로 설정
  })

  // 오버레이 창 설정
  overlayWindow.setIgnoreMouseEvents(true, { forward: true })
  overlayWindow.setAlwaysOnTop(true, 'screen-saver')
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  if (isProd) {
    await mainWindow.loadURL('app://./home')
    await overlayWindow.loadURL('app://./overlay/widget')
  } else {
    const port = process.argv[2]
    await mainWindow.loadURL(`http://localhost:${port}/`)
    await overlayWindow.loadURL(`http://localhost:${port}/overlay/widget`)
    mainWindow.webContents.openDevTools()
    overlayWindow.webContents.openDevTools()
  }

  // findGameWindow 함수 수정
  async function findGameWindow(gameCode) {
    return new Promise((resolve, reject) => {
      try {
        const processName = gameCode === 'djmax_respect_v' ? 'DJMAX' : 'WJMAX'

        exec(`tasklist /FI "IMAGENAME eq ${processName}*" /FO CSV`, (err, stdout, stderr) => {
          try {
            if (err) {
              console.error('Error checking game process:', err)
              return resolve(null)
            }

            if (!stdout.toLowerCase().includes(processName.toLowerCase())) {
              console.log(`${processName} process not found`)
              return resolve(null)
            }

            const windows = Window.all()
            if (!windows || windows.length === 0) {
              console.log('No windows found')
              return resolve(null)
            }

            const gameWindow = windows.find((w) => w.title.includes(gameList[gameCode]))
            if (!gameWindow) {
              console.log(`${gameList[gameCode]} window not found`)
              return resolve(null)
            }

            const bounds = {
              x: gameWindow.x,
              y: gameWindow.y,
              width: gameWindow.width,
              height: gameWindow.height,
            }
            resolve(bounds)
          } catch (innerError) {
            console.error('Error processing window information:', innerError)
            resolve(null)
          }
        })
      } catch (error) {
        console.error('Error in findGameWindow:', error)
        resolve(null)
      }
    })
  }

  // checkGameAndUpdateOverlay 함수 수정
  async function checkGameAndUpdateOverlay() {
    try {
      const isGameRunning = await isDjmaxRunning('djmax_respect_v')
      const isWjmaxRunning = await isDjmaxRunning('wjmax')

      // 게임이 실행중이지 않으면 오버레이 숨기고 early return
      if (!isGameRunning && !isWjmaxRunning) {
        if (overlayWindow.isVisible()) {
          overlayWindow.hide()
        }
        return
      }

      if (!settingData.resultOverlay) {
        if (overlayWindow.isVisible()) {
          overlayWindow.hide()
        }
        return
      }

      const gamePos: any = await findGameWindow(isGameRunning ? 'djmax_respect_v' : 'wjmax')
      const focusedWindow = await getFocusedWindow()

      // 선택된 게임에 따라 게임 포커스 확인
      let isGameFocused = (isGameRunning && focusedWindow === 'DJMAX RESPECT V') || (isWjmaxRunning && focusedWindow === 'WJMAX')

      if (gamePos && isGameFocused) {
        const display = screen.getDisplayNearestPoint({ x: gamePos.x, y: gamePos.y })
        const scaleFactor = display.scaleFactor

        let newBounds
        if (isFullscreen) {
          const aspectRatio = 16 / 9
          const targetHeight = gamePos.width / aspectRatio
          const blackBarHeight = (gamePos.height - targetHeight) / 2

          newBounds = {
            x: Math.round(gamePos.x / scaleFactor),
            y: Math.round((gamePos.y + blackBarHeight) / scaleFactor),
            width: Math.round(gamePos.width / scaleFactor),
            height: Math.round(targetHeight / scaleFactor),
          }
        } else {
          newBounds = {
            x: (gamePos.width / 16) * 9 !== gamePos.height ? Math.round(gamePos.x / scaleFactor) + removedPixels : Math.round(gamePos.x / scaleFactor),
            y:
              Math.round(gamePos.y / scaleFactor) +
              ((gamePos.width / 16) * 9 !== gamePos.height ? (gamePos.height - (gamePos.width / 16) * 9) / scaleFactor + 0 : 0),
            width: (gamePos.width / 16) * 9 !== gamePos.height ? gamePos.width / scaleFactor - removedPixels * 2 : gamePos.width / scaleFactor,
            height:
              (gamePos.width / 16) * 9 !== gamePos.height
                ? (gamePos.height - (gamePos.height - (gamePos.width / 16) * 9)) / scaleFactor - removedPixels
                : gamePos.height / scaleFactor,
          }
        }

        if (!overlayWindow.isVisible()) {
          overlayWindow.show()
        }
        overlayWindow.setBounds(newBounds)
      } else {
        if (overlayWindow.isVisible()) {
          overlayWindow.hide()
        }
      }
    } catch (error) {
      console.error('Error checking game status:', error)
    }
  }

  // getFocusedWindow 함수 수정
  async function getFocusedWindow(): Promise<string> {
    return new Promise((resolve) => {
      try {
        exec(
          'powershell -command "Add-Type -TypeDefinition \'using System; using System.Runtime.InteropServices; public class Window { [DllImport(\\"user32.dll\\")] public static extern IntPtr GetForegroundWindow(); [DllImport(\\"user32.dll\\")] public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder text, int count); }\' ; $window = [Window]::GetForegroundWindow(); $buffer = New-Object System.Text.StringBuilder(256); [Window]::GetWindowText($window, $buffer, 256) > $null; $buffer.ToString()"',
          (err, stdout) => {
            if (err) {
              console.error('Error getting focused window:', err)
              resolve('')
              return
            }
            resolve(stdout.trim())
          },
        )
      } catch (error) {
        console.error('Error in getFocusedWindow:', error)
        resolve('')
      }
    })
  }

  // checkGameOverlayLoop 함수 수정 - 체크 간격 조가
  const checkGameOverlayLoop = async () => {
    try {
      await checkGameAndUpdateOverlay()
    } catch (error) {
      console.error('Error in game check loop:', error)
    } finally {
      // 체크 간격을 100ms로 증가 (초당 10회)
      setTimeout(() => checkGameOverlayLoop(), 100)
    }
  }

  // 초기 체크 시작
  checkGameOverlayLoop()

  ipcMain.on('closeApp', async () => {
    try {
      // 모든 IPC 리스너 제거
      ipcMain.removeAllListeners()

      // 오버레이 윈도우 정리
      if (overlayWindow) {
        overlayWindow.removeAllListeners()
        overlayWindow.destroy()
        overlayWindow = null
      }

      // 메인 윈도우 정리
      if (mainWindow) {
        mainWindow.removeAllListeners()
        mainWindow.destroy()
      }

      // 잠시 대기 후 앱 종료
      setTimeout(() => {
        app.quit()
      }, 100)
    } catch (error) {
      console.error('Error during app closure:', error)
      app.exit(1) // 강제 종료
    }
  })

  // 창 최대화 버튼 감지
  ipcMain.on('maximizeApp', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.restore()
    } else {
      mainWindow.maximize()
    }
  })

  // 창 최소화 버튼 감지
  ipcMain.on('minimizeApp', () => {
    mainWindow.minimize()
  })

  // 창 크기 최대화 감지
  mainWindow.on('resize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.webContents.send('IPC_RENDERER_RESIZE_IS_MAXIMIZED', true)
    } else {
      mainWindow.webContents.send('IPC_RENDERER_RESIZE_IS_MAXIMIZED', false)
    }
  })

  // 세션 저장 처리
  ipcMain.on('logined', async (event, value) => {
    isLogined = true
  })

  // 세션 저장 처리
  ipcMain.on('login', async (event, { userNo, userToken, vArchiveUserNo, vArchiveUserToken, vArchiveUserName }) => {
    if (vArchiveUserNo && vArchiveUserToken) {
      try {
        storeSession({ vArchiveUserNo, vArchiveUserToken, vArchiveUserName, userNo: '', userToken: '' })
        mainWindow.webContents.send('IPC_RENDERER_IS_LOGINED', true)
      } catch (e) {
        mainWindow.webContents.send('IPC_RENDERER_IS_LOGINED', false)
      }
    }
    if (userNo && userToken) {
      try {
        storeSession({ vArchiveUserNo: '', vArchiveUserToken: '', vArchiveUserName: '', userNo, userToken })
        mainWindow.webContents.send('IPC_RENDERER_IS_LOGINED', true)
      } catch (e) {
        mainWindow.webContents.send('IPC_RENDERER_IS_LOGINED', false)
      }
    }
  })

  ipcMain.on('storeSession', async (event, value) => {
    storeSession(value)
  })

  // 로그아웃 요청 처리
  ipcMain.on('logout', async (event) => {
    isLogined = false
    clearSession()
    mainWindow.webContents.send('IPC_RENDERER_IS_LOGOUTED', { success: true })
  })

  // 세션 정보 요청 처리
  ipcMain.on('getSession', async (event) => {
    const session = await getSession()
    mainWindow.webContents.send('IPC_RENDERER_GET_SESSION', session ? session : null)
  })

  // 곡 데이터 저장 처리
  ipcMain.on('putSongData', async (event, { songData, gameCode }) => {
    try {
      if (gameCode === 'djmax_respect_v') {
        storeSongData(songData)
      } else if (gameCode === 'wjmax') {
        storeWjmaxSongData(songData)
      }
      mainWindow.webContents.send('IPC_RENDERER_IS_LOADED_SONG_DATA', true)
    } catch (e) {
      mainWindow.webContents.send('IPC_RENDERER_IS_LOADED_SONG_DATA', false)
    }
  })

  // 세션 정보 요청 처리
  ipcMain.on('getSongData', async (event, gameCode) => {
    let songData
    if (gameCode === 'djmax_respect_v') {
      songData = await getSongData()
    } else if (gameCode === 'wjmax') {
      songData = await getWjmaxSongData()
    }
    mainWindow.webContents.send('IPC_RENDERER_GET_SONG_DATA', songData ? { songData, gameCode } : null)
  })

  ipcMain.on('openBrowser', (event, url) => {
    event.preventDefault()
    mainWindow.webContents.send('confirm-external-link', url)
  })

  ipcMain.on('setAuthorization', async (event, { userNo, userToken }) => {
    // 쿠키 설정
    if (userNo !== '' && userToken !== '') {
      session.defaultSession.cookies
        .set({
          url: isProd ? 'https://aosame-rain.r-archive.zip/' : 'https://kamome-sano.r-archive.zip/',
          name: 'Authorization',
          value: `${userNo}|${userToken}`,
          secure: true,
          httpOnly: true,
          sameSite: 'no_restriction',
        })
        .then(() => {
          console.log('Authorization Cookie Saved : ', userNo, userToken)
        })
    } else {
      session.defaultSession.cookies.remove(isProd ? 'https://aosame-rain.r-archive.zip/' : 'https://kamome-sano.r-archive.zip/', 'Authorization').then(() => {
        console.log('Authorization Cookie Removed.')
      })
    }
  })

  ipcMain.on('getSettingData', async (event) => {
    await settingsManager.initializeSettings()
    const settingData = await getSettingData()
    mainWindow.webContents.send('IPC_RENDERER_GET_SETTING_DATA', settingData)
  })

  ipcMain.on('changeSettingData', async (event, data) => {
    const updatedSettings = await settingsManager.updateSettings(data)
    settingData = updatedSettings

    // 재시작이 필요한 설정이 변경되었는지 확인
    if (settingsManager.requiresRestart(Object.keys(data))) {
      app.relaunch()
      app.exit()
    }

    mainWindow.webContents.send('IPC_RENDERER_GET_SETTING_DATA', updatedSettings)
  })

  ipcMain.on('PROGRAM_LOADED', async () => {
    if (!isLoaded) {
      // 자동 업데이트 체크
      settingData = await getSettingData()
      if (settingData.autoUpdate) {
        autoUpdater.checkForUpdatesAndNotify()
      }
      startCapturing()
      isLoaded = true
      if (settingData.autoStartGame) {
        if (settingData.autoStartGameDjmaxRespectV) {
          const isRunning = await isDjmaxRunning('djmax_respect_v')
          if (!isRunning) {
            shell.openExternal('steam://run/960170')
            mainWindow.webContents.send('pushNotification', {
              message: '자동 시작 옵션이 활성화되어 DJMAX RESPECT V(게임)을 실행 중에 있습니다. 잠시만 기다려주세요.',
              color: 'tw-bg-blue-600',
            })
          }
        } else if (settingData.autoStartGameWjmax) {
          const isRunning = await isDjmaxRunning('wjmax')
          if (!isRunning) {
            shell.openExternal(settingData.autoStartGameWjmaxPath)
            mainWindow.webContents.send('pushNotification', {
              message: `자동 시작 옵션이 활성화되어 WJMAX(게임)을 실행 중에 있습니다. 잠시만 기다려주세요.`,
              color: 'tw-bg-blue-600',
            })
          }
        }
      }
    }
  })

  ipcMain.on('startGameDjmaxRespectV', async () => {
    const isRunning = await isDjmaxRunning('djmax_respect_v')
    if (!isRunning) {
      shell.openExternal('steam://run/960170')
      mainWindow.webContents.send('pushNotification', {
        message: `DJMAX RESPECT V(게임)을 실행 중에 있습니다. 잠시만 기다려주세요.`,
        color: 'tw-bg-blue-600',
      })
    }
  })

  ipcMain.on('startGameWjmax', async () => {
    const isRunning = await isDjmaxRunning('wjmax')
    if (!isRunning) {
      shell.openExternal(settingData.autoStartGameWjmaxPath)
      mainWindow.webContents.send('pushNotification', {
        message: `WJMAX(게임)을 실행 중에 있습니다. 잠시만 기다려주세요.`,
        color: 'tw-bg-blue-600',
      })
    }
  })

  ipcMain.on('top50-updated', (event, data) => {
    overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
      title: data.title,
      message: `방금 전 업로드된 ${data.name} 곡의 성과로 TOP50이 ${data.previousCutoff}TP에서 ${data.currentCutoff}TP로 갱신되었습니다.`,
      color: 'tw-bg-amber-600',
    })
  })

  // 업데이트 가용 시 버전 정보를 렌더러 프로세스로 전송
  autoUpdater.on('update-available', (info) => {
    console.log('Update Available :', info)
    mainWindow.webContents.send('update-available', info.version)
  })

  // 다운로드 진행 상황을 렌더러 프로세스로 전송
  autoUpdater.on('download-progress', (progress) => {
    console.log('Update Download Progress :', progress)
    mainWindow.webContents.send('download-progress', {
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total,
    })
  })

  // 업데이트 다운로드 완료 시 렌더러 프로세스로 이벤트 전송
  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update Downloaded :', info)
    mainWindow.webContents.send('update-downloaded', info.version)
  })

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  async function processResultScreen(imageBuffer, isMenualUpload?, isNotSaveImage?, gameCode?) {
    if (gameCode == 'djmax_respect_v') {
      try {
        console.log('Client Side OCR isResultScreen Requested. Processing image data...')

        let isResult = []
        let text = ''
        let where = ''

        if (isMenualUpload) {
          isResult = ['server']
          text = 'server'
          where = 'server'
        } else {
          // 각 영역별 OCR 검사
          const regions: { [key: string]: Buffer } = {}
          const texts: { [key: string]: string } = {}

          // 설정에 따라 필요한 영역만 검사
          if (settingData.autoCaptureOcrResultRegion) {
            regions.result = await sharp(imageBuffer).extract({ width: 230, height: 24, left: 100, top: 236 }).grayscale().linear(1.5, 0).toBuffer()
            texts.result = await recognizeText(regions.result, 'eng')
          }

          if (settingData.autoCaptureOcrOpen3Region) {
            regions.open3 = await sharp(imageBuffer).extract({ width: 57, height: 26, left: 596, top: 470 }).grayscale().linear(1.5, 0).toBuffer()
            texts.open3 = await recognizeText(regions.open3, 'eng')
          }

          if (settingData.autoCaptureOcrOpen2Region) {
            regions.open2 = await sharp(imageBuffer).extract({ width: 60, height: 25, left: 693, top: 471 }).grayscale().linear(1.5, 0).toBuffer()
            texts.open2 = await recognizeText(regions.open2, 'eng')
          }

          if (settingData.autoCaptureOcrVersusRegion) {
            regions.versus = await sharp(imageBuffer).extract({ width: 70, height: 104, left: 829, top: 48 }).grayscale().toBuffer()
            texts.versus = await recognizeText(regions.versus, 'eng')
          }

          // 결과 검사
          const resultKeywords = ['JUDGEMENT', 'DETAILS', 'DETAIL', 'JUDGE', 'JUDGEMENT DETAILS']

          if (settingData.autoCaptureOcrResultRegion && texts.result) {
            isResult = resultKeywords.filter((value) => texts.result.toUpperCase().trim().includes(value) && texts.result.length !== 0)
            if (isResult.length > 0) {
              where = 'result'
              text = texts.result
            }
          }

          if (!where && settingData.autoCaptureOcrOpen3Region && texts.open3) {
            if (texts.open3.toUpperCase().includes('MAX') || texts.open3.toUpperCase().includes('AX') || texts.open3.toUpperCase().includes('MA')) {
              where = 'open3'
              isResult = ['open3']
              text = texts.open3
            }
          }

          if (!where && settingData.autoCaptureOcrOpen2Region && texts.open2) {
            if (texts.open2.toUpperCase().includes('MAX') || texts.open2.toUpperCase().includes('AX') || texts.open2.toUpperCase().includes('MA')) {
              where = 'open2'
              isResult = ['open2']
              text = texts.open2
            }
          }

          if (!where && settingData.autoCaptureOcrVersusRegion && texts.versus) {
            if (texts.versus.trim() == 'E') {
              where = 'versus'
              isResult = ['versus']
              text = texts.versus
            }
          }
        }

        console.log('Client Side OCR isResultScreen:', isResult.length >= 1, `(${text.toUpperCase().trim()})`, `(Result Type: ${where})`)

        if (isResult.length >= 1 && (!isUploaded || isMenualUpload)) {
          if (!isMenualUpload) {
            mainWindow.webContents.send('pushNotification', {
              time: moment().utcOffset(9).format('YYYY-MM-DD-HH-mm-ss'),
              message: 'DJMAX RESPECT V(게임)의 게임 결과창이 자동 인식되어 성과 기록 이미지를 처리 중에 있습니다. 잠시만 기다려주세요.',
              color: 'tw-bg-blue-600',
            })
            if (settingData.resultOverlay) {
              overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
                message: 'DJMAX RESPECT V(게임)의 게임 결과창이 자동 인식되어 성과 기록 이미지를 처리 중에 있니다. 잠시만 기다려주세요.',
                color: 'tw-bg-blue-600',
              })
            }
          }
          console.log('Server Side OCR PlayData Requested. Processing image data...')
          try {
            const serverOcrStartTime = Date.now()
            const formData = new FormData()
            // const fuckBuffer = where == 'open2' || where == 'open3' ? await delay(3000).then(() => captureScreen('djmax_respect_v')) : imageBuffer
            const fuckBuffer = imageBuffer
            formData.append('file', fuckBuffer, {
              filename: randomUUID() + '.png',
              contentType: 'image/png',
            })
            formData.append('where', where)
            const session = await getSession()
            const response = await axios.post(`${isProd ? 'https://near.r-archive.zip/api' : 'https://noah.r-archive.zip/api'}/v1/ocr/upload`, formData, {
              headers: {
                ...formData.getHeaders(),
                Authorization: isLogined ? `${session.vArchiveUserNo}|${session.vArchiveUserToken}` : '',
              },
              withCredentials: true,
            })
            console.log('Server Side OCR PlayData Result:', { ...response.data, processedTime: Date.now() - serverOcrStartTime + 'ms' })

            const { playData } = response.data

            if (playData.isVerified || playData.screenType == 'versus' || playData.screenType == 'collection') {
              const filePath = path.join(
                app.getPath('pictures'),
                'R-ARCHIVE',
                gameCode.toUpperCase().replaceAll('_', ' ') +
                  '-' +
                  (playData.screenType == 'versus' || playData.screenType == 'collection' ? 'Versus' : String(playData.songData.name).replaceAll(':', '-')) +
                  '-' +
                  (playData.screenType == 'versus' || playData.screenType == 'collection' ? 'Match' : String(playData.score)) +
                  '-' +
                  moment().utcOffset(9).format('YYYY-MM-DD-HH-mm-ss') +
                  '.png',
              )

              // 프로필 영역 좌표 정의
              const profileRegions = {
                djmax_respect_v: {
                  result: {
                    myProfile: { left: 1542, top: 26, width: 320, height: 68 }, // 내 프로필 좌표
                    otherProfile: { left: 1, top: 1, width: 1, height: 1 }, // 다른 사람 프로필 좌표
                  },
                  select: {
                    myProfile: { left: 1522, top: 22, width: 320, height: 68 }, // 플레이어1 프로필 좌표
                    otherProfile: { left: 1, top: 1, width: 1, height: 1 }, // 플레이어2 프로필 좌표
                  },
                  open3: {
                    myProfile: { left: 211, top: 177, width: 320, height: 68 }, // 플레이어1 프로필 좌표
                    otherProfile: { left: 777, top: 116, width: 1106, height: 852 }, // 플레이어2 프로필 좌표
                  },
                  open2: {
                    myProfile: { left: 310, top: 176, width: 321, height: 69 }, // 플레이어1 프로필 좌표
                    otherProfile: { left: 1290, top: 176, width: 321, height: 69 }, // 플레이어2 프로필 좌표
                  },
                  versus: {
                    myProfile: { left: 201, top: 867, width: 320, height: 68 }, // 플레이어1 프로필 좌표
                    otherProfile: { left: 1401, top: 867, width: 320, height: 68 }, // 플레이어2 프로필 좌표
                  },
                  collection: {
                    myProfile: { left: 1512, top: 22, width: 320, height: 68 }, // 플레이어1 프로필 좌표
                    otherProfile: { left: 1, top: 1, width: 1, height: 1 }, // 플레이어2 프로필 좌표
                  },
                  openSelect: {
                    myProfile: { left: 1361, top: 216, width: 320, height: 68 }, // 플레이어1 프로필 좌표
                    otherProfile: { left: 1363, top: 318, width: 316, height: 464 }, // 플레이어2 프로필 좌표
                  },
                },
              }

              const applyProfileMask = async (imageBuffer, gameCode, screenType, settings) => {
                try {
                  const image = sharp(imageBuffer)
                  const regions = profileRegions[gameCode]?.[screenType]
                  if (!regions) return imageBuffer

                  let regionsToMask = []

                  // 설정에 따른 마스킹 영역 결정
                  if (settings.saveImageWithoutAllProfileWhenCapture) {
                    if (screenType == 'result' || screenType == 'select' || screenType == 'collection') {
                      regionsToMask = [regions.myProfile]
                    } else if (screenType == 'openSelect') {
                      regionsToMask = [regions.myProfile, regions.otherProfile, { left: 58, top: 687, width: 524, height: 256 }]
                    } else {
                      regionsToMask = [regions.myProfile, regions.otherProfile]
                    }
                  } else if (settings.saveImageWithoutOtherProfileWhenCapture) {
                    if (screenType == 'result' || screenType == 'select' || screenType == 'collection') {
                      regionsToMask = []
                    } else if (screenType == 'openSelect') {
                      regionsToMask = [regions.otherProfile, { left: 58, top: 687, width: 524, height: 256 }]
                    } else {
                      regionsToMask = [regions.otherProfile]
                    }
                  } else {
                    if (screenType == 'openSelect') {
                      regionsToMask = [{ left: 58, top: 687, width: 524, height: 256 }]
                    } else {
                      regionsToMask = []
                    }
                  }

                  if (regionsToMask.length === 0) return imageBuffer

                  // 선택된 영역에 마스킹 효과 적용
                  const overlays = await Promise.all(
                    regionsToMask.map(async (region) => {
                      let maskedRegion
                      if (settings.saveImageBlurMode == 'black') {
                        // 검은색 마스킹
                        maskedRegion = await sharp({
                          create: {
                            width: region.width,
                            height: region.height,
                            channels: 4,
                            background: '#000000', // 검은색을 hex 값으로 지정
                          },
                        })
                          .jpeg() // 이미지 포맷 지정
                          .toBuffer()
                      } else {
                        // 블러 마스킹
                        maskedRegion = await sharp(imageBuffer).extract(region).blur(15).toBuffer()
                      }

                      return {
                        input: maskedRegion,
                        left: region.left,
                        top: region.top,
                      }
                    }),
                  )

                  // 마스킹 처리된 영역을 원본 이미지에 합성
                  return await image.composite(overlays).toBuffer()
                } catch (error) {
                  console.error('Error applying profile mask:', error)
                  return imageBuffer
                }
              }

              // 파일 저장 부분 수정
              if (settingData.saveImageWhenCapture && !isNotSaveImage) {
                try {
                  let finalImageBuffer = imageBuffer

                  finalImageBuffer = await applyProfileMask(imageBuffer, 'djmax_respect_v', playData.screenType, settingData)

                  fs.writeFile(filePath, finalImageBuffer, (err) => {
                    if (err) {
                      console.error('Failed to save file:', err)
                    } else {
                      console.log('File saved to', filePath)
                    }
                  })
                } catch (error) {
                  console.error('Error processing image:', error)
                }
              }

              isUploaded = true
              if (where !== 'versus' && playData.screenType !== 'versus' && playData.isVerified) {
                // 기존 점수 조회
                try {
                  const session = await getSession()
                  const backupResponse = await axios.get(
                    `${isProd ? 'https://aosame-rain.r-archive.zip/' : 'https://kamome-sano.r-archive.zip/'}?url=https://v-archive.net/api/archive/${
                      session.vArchiveUserName
                    }/title/${playData.songData.title}`,
                  )
                  const lastScore = backupResponse.data?.patterns?.[`${playData.button}B`]?.[playData.pattern]?.score || null

                  settingData.resultOverlay &&
                    overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
                      ...response.data.playData,
                      lastScore,
                    })
                } catch (error) {
                  console.error('Error fetching backup data:', error)
                  settingData.resultOverlay &&
                    overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
                      ...response.data.playData,
                    })
                }
              } else if (playData.screenType == 'versus') {
                playData.versusData.forEach(async (value, index) => {
                  if (Number(value.score) > 0) {
                    try {
                      // 각 플레이어의 기존 점수 조회
                      const session = await getSession()
                      const backupResponse = await axios.get(
                        `${isProd ? 'https://aosame-rain.r-archive.zip/' : 'https://kamome-sano.r-archive.zip/'}?url=https://v-archive.net/api/archive/${
                          session.vArchiveUserName
                        }/title/${value.songData.title}`,
                      )
                      const lastScore = backupResponse.data?.patterns?.[`${value.button}B`]?.[value.pattern]?.score || null

                      setTimeout(() => {
                        settingData.resultOverlay &&
                          overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
                            ...value,
                            gameCode: 'djmax_respect_v',
                            lastScore,
                          })
                      }, 2000 * index)
                    } catch (error) {
                      console.error('Error fetching backup data:', error)
                      setTimeout(() => {
                        settingData.resultOverlay &&
                          overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
                            ...value,
                            gameCode: 'djmax_respect_v',
                          })
                      }, 2000 * index)
                    }
                  }
                })
              } else if (playData.screenType == 'collection') {
                overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
                  message: '컬렉션(COLLECTION) 화면 인식에 성공하였습니다. 결과는 R-ARCHIVE 데스크톱 앱에서 확인해주세요.',
                  color: 'tw-bg-lime-600',
                })
              } else {
                overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
                  message: '게임 결과창이 아니거나 성과 기록 이미지를 처리 중에 오류가 발생하였습니다. 다시 시도해주시길 바랍니다.',
                  color: 'tw-bg-red-600',
                })
              }
              isProcessing = false
              return { ...response.data, filePath: settingData.saveImageWhenCapture && playData.screenType != 'collection' ? filePath : null }
            } else {
              isProcessing = false
              return {
                playData: {
                  isVerified: null,
                },
              }
            }
          } catch (error) {
            console.error('서버 사이드 OCR 요청 실패:', error)
            overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
              message: '게임 결과창이 아니거나 성과 기록 이미지를 처리 중에 오류가 발생하였습니다. 다시 시도해주시길 바랍니다.',
              color: 'tw-bg-red-600',
            })
            isProcessing = false
            return {
              playData: {
                isVerified: false,
                error: '서버 사이드 OCR 요청 실패',
              },
            }
          }
        } else if (isResult.length >= 1 && isUploaded) {
          console.log('Waiting for Exit Result Screen...')
          isProcessing = false
          return {
            playData: {
              isVerified: null,
            },
          }
        } else {
          console.log('Waiting for Result Screen...')
          isProcessing = false
          isUploaded = false
          return {
            playData: {
              isVerified: null,
            },
          }
        }
      } catch (error) {
        isProcessing = false
        console.error('Error processing capture:', error)
      }
    } else if (gameCode == 'wjmax') {
      try {
        console.log('Client Side OCR isResultScreen Requested. Processing image data...')

        let isResult = []
        let text = ''
        let where = ''

        if (isMenualUpload) {
          isResult = ['server']
          text = 'server'
          where = 'server'
        } else {
          // 각 영역별 OCR 검사
          const regions: { [key: string]: Buffer } = {}
          const texts: { [key: string]: string } = {}

          // 설정에 따라 필요한 영역만 검사
          if (settingData.autoCaptureWjmaxOcrResultRegion) {
            regions.result = await sharp(imageBuffer).extract({ width: 135, height: 21, left: 1038, top: 307 }).linear(1, 0).toBuffer()
            texts.result = await recognizeText(regions.result, 'eng')
          }

          // 결과 검사
          const resultKeywords = ['JUDGEMENT', 'JUDGE', 'MENT', 'MENTS', 'JUDGEMENTS']

          if (settingData.autoCaptureWjmaxOcrResultRegion && texts.result) {
            isResult = resultKeywords.filter((value) => texts.result.toUpperCase().trim().includes(value) && texts.result.length !== 0)
            if (isResult.length > 0) {
              where = 'result'
              text = texts.result
            }
          }
        }

        console.log('Client Side OCR isResultScreen:', isResult.length >= 1, `(${text.toUpperCase().trim()})`, `(Result Type: ${where})`)

        if (isResult.length >= 1 && (!isUploaded || isMenualUpload)) {
          if (!isMenualUpload) {
            mainWindow.webContents.send('pushNotification', {
              time: moment().utcOffset(9).format('YYYY-MM-DD-HH-mm-ss'),
              message: 'WJMAX(게임)의 게임 결과창이 자동 인식되어 성과 기록 이미지를 처리 중에 있습니다. 잠시만 기다려주세요.',
              color: 'tw-bg-blue-600',
            })
            if (settingData.resultOverlay) {
              overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
                message: 'WJMAX(게임)의 게임 결과창이 자동 인식되어 성과 기록 이미지를 처리 중에 있니다. 잠시만 기다려주세요.',
                color: 'tw-bg-blue-600',
              })
            }
          }
          console.log('Server Side OCR PlayData Requested. Processing image data...')
          try {
            const serverOcrStartTime = Date.now()
            const formData = new FormData()
            formData.append('file', imageBuffer, {
              filename: randomUUID() + '.png',
              contentType: 'image/png',
            })
            formData.append('where', where)
            const session = await getSession()
            console.log(session)
            const response = await axios.post(`${isProd ? 'https://near.r-archive.zip/api' : 'https://noah.r-archive.zip/api'}/v1/ocr/upload/wjmax`, formData, {
              headers: {
                ...formData.getHeaders(),
                Authorization: isLogined ? `${session.userNo}|${session.userToken}` : '',
              },
              withCredentials: true,
            })
            console.log('Server Side OCR PlayData Result:', { ...response.data, processedTime: Date.now() - serverOcrStartTime + 'ms' })

            const { playData } = response.data

            if (playData.isVerified || playData.screenType == 'versus') {
              const filePath = path.join(
                app.getPath('pictures'),
                'R-ARCHIVE',
                gameCode.toUpperCase().replaceAll('_', ' ') +
                  '-' +
                  (playData.screenType == 'versus'
                    ? 'Versus'
                    : playData.screenType == 'collection'
                    ? 'Collection'
                    : String(playData.songData.name).replaceAll(':', '-')) +
                  '-' +
                  (playData.screenType == 'versus' ? 'Match' : playData.screenType == 'collection' ? 'MusicData' : String(playData.score)) +
                  '-' +
                  moment().utcOffset(9).format('YYYY-MM-DD-HH-mm-ss') +
                  '.png',
              )

              // 프로필 영역 좌표 정의
              const profileRegions = {
                wjmax: {
                  result: {
                    myProfile: { left: 1546, top: 32, width: 342, height: 70 }, // 플레이어1 프로필 좌표
                    otherProfile: { left: 1, top: 1, width: 1, height: 1 }, // 플레이어2 프로필 좌표
                  },
                },
              }

              const applyProfileBlur = async (imageBuffer, gameCode, screenType, settings) => {
                try {
                  const image = sharp(imageBuffer)
                  const regions = profileRegions[gameCode]?.[screenType]
                  if (!regions) return imageBuffer

                  let regionsToBlur = []

                  // 설정에 따른 블러 처리 영역 결정
                  if (settings.saveImageWithoutAllProfileWhenCapture) {
                    // 모든 프로필 제외 - 모든 프로필에 블러
                    if (screenType == 'result' || screenType == 'select' || screenType == 'collection') {
                      regionsToBlur = [regions.myProfile]
                    } else if (screenType == 'openSelect') {
                      regionsToBlur = [regions.myProfile, regions.otherProfile, { left: 58, top: 687, width: 524, height: 256 }]
                    } else {
                      regionsToBlur = [regions.myProfile, regions.otherProfile]
                    }
                  } else if (settings.saveImageWithoutOtherProfileWhenCapture) {
                    // 내 프로필만 - 다른 프로필만 블러
                    if (screenType == 'result' || screenType == 'select' || screenType == 'collection') {
                      regionsToBlur = []
                    } else if (screenType == 'openSelect') {
                      regionsToBlur = [regions.otherProfile, { left: 58, top: 687, width: 524, height: 256 }]
                    } else {
                      regionsToBlur = [regions.otherProfile]
                    }
                  } else {
                    if (screenType == 'openSelect') {
                      regionsToBlur = [{ left: 58, top: 687, width: 524, height: 256 }]
                    } else {
                      regionsToBlur = []
                    }
                  }
                  // saveImageWithAllProfileWhenCapture가 true인 경우는 블러 처리 없음

                  if (regionsToBlur.length === 0) return imageBuffer

                  // 선택된 영역에 블러 효과 적용
                  const overlays = await Promise.all(
                    regionsToBlur.map(async (region) => {
                      const blurred = await sharp(imageBuffer).extract(region).blur(15).toBuffer()

                      return {
                        input: blurred,
                        left: region.left,
                        top: region.top,
                      }
                    }),
                  )

                  // 블러 처리된 영역을 원본 이미지에 합성
                  return await image.composite(overlays).toBuffer()
                } catch (error) {
                  console.error('Error applying profile blur:', error)
                  return imageBuffer
                }
              }

              // 파일 저장 부분 수정
              if (settingData.saveImageWhenCapture && !isNotSaveImage) {
                try {
                  let finalImageBuffer = imageBuffer

                  finalImageBuffer = await applyProfileBlur(imageBuffer, 'djmax_respect_v', playData.screenType, settingData)

                  fs.writeFile(filePath, finalImageBuffer, (err) => {
                    if (err) {
                      console.error('Failed to save file:', err)
                    } else {
                      console.log('File saved to', filePath)
                    }
                  })
                } catch (error) {
                  console.error('Error processing image:', error)
                }
              }

              isUploaded = true
              if (where !== 'versus' && playData.screenType !== 'versus' && playData.isVerified) {
                settingData.resultOverlay && overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', { ...response.data.playData })
              } else if (playData.screenType == 'versus') {
                playData.versusData.forEach((value, index) => {
                  if (Number(value.score) > 0) {
                    setTimeout(() => {
                      settingData.resultOverlay && overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', { ...value })
                    }, 2000 * (index + 1))
                  }
                })
              } else {
                overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
                  message: '게임 결과창이 아니거나 성과 기록 이미지를 처리 중에 오류가 발생하였습니다. 다시 시도해주시길 바랍니다.',
                  color: 'tw-bg-red-600',
                })
              }
              isProcessing = false
              return { ...response.data, filePath: settingData.saveImageWhenCapture ? filePath : null }
            } else {
              isProcessing = false
              return {
                playData: {
                  isVerified: null,
                },
              }
            }
          } catch (error) {
            isProcessing = false
            console.error('서버 사이드 OCR 요청 실패:', error)
            return {
              playData: {
                isVerified: false,
                error: '서버 사이드 OCR 요청 실패',
              },
            }
          }
        } else if (isResult.length >= 1 && isUploaded) {
          isProcessing = false
          console.log('Waiting for Exit Result Screen...')
          return {
            playData: {
              isVerified: null,
            },
          }
        } else {
          isProcessing = false
          console.log('Waiting for Result Screen...')
          isUploaded = false
          return {
            playData: {
              isVerified: null,
            },
          }
        }
      } catch (error) {
        isProcessing = false
        console.error('Error processing capture:', error)
      }
    }
  }

  ipcMain.on('create-player-file', async (event, data) => {
    const { userNo, userToken } = data

    const filePath = path.join(app.getPath('documents'), 'R-ARCHIVE', 'player.txt')

    fs.writeFile(filePath, `${userNo}|${userToken}`, (err) => {
      if (err) {
        console.error('Failed to save file:', err)
      } else {
        shell.showItemInFolder(filePath)
      }
    })
  })

  ipcMain.on('captureTest', async (event, data) => {
    const isRunning = await isDjmaxRunning('djmax_respect_v')

    const imageBuffer = await captureScreen(isRunning ? 'djmax_respect_v' : 'wjmax')

    console.log(imageBuffer)

    const filePath = path.join(app.getPath('pictures'), 'R-ARCHIVE', '화면 캡쳐-' + moment().utcOffset(9).format('YYYY-MM-DD-HH-mm-ss-SSS') + '.png')

    fs.writeFile(filePath, Buffer.from(imageBuffer), (err) => {
      if (err) {
        console.error('Failed to save file:', err)
      } else {
        console.log('File saved to', filePath)
        shell.showItemInFolder(filePath)
      }
    })
  })

  ipcMain.on('screenshot-upload', async (event, { buffer, gameCode }) => {
    const image = await sharp(buffer).resize(1920).toFormat('png').toBuffer()

    const resizedImageMetadata = await sharp(image).metadata()

    if (resizedImageMetadata.height !== (resizedImageMetadata.width / 16) * 9) {
      console.log('Windowed Image Detected.')
      try {
        isProcessing = true
        const croppedBuffer = await sharp(image)
          .extract({ width: 1920, height: 1080, left: 0, top: resizedImageMetadata.height - (resizedImageMetadata.width / 16) * 9 })
          .toBuffer()

        const { playData } = await processResultScreen(croppedBuffer, true, true, gameCode)
        if (playData !== null && (playData.isVerified !== undefined || playData.screenType == 'versus' || playData.screenType == 'collection')) {
          mainWindow.webContents.send('screenshot-uploaded', playData)
        }
      } catch (error) {
        console.error('Error processing capture:', error)
        isProcessing = false
      }
    } else {
      console.log('Full Screen Image Detected.')
      try {
        isProcessing = true
        const { playData } = await processResultScreen(image, true, true, gameCode)
        if (playData !== null && (playData.isVerified !== undefined || playData.screenType == 'versus' || playData.screenType == 'collection')) {
          mainWindow.webContents.send('screenshot-uploaded', playData)
        }
      } catch (error) {
        console.error('Error processing capture:', error)
        isProcessing = false
      }
    }
  })

  async function startCapturing() {
    const captureAndProcess = async () => {
      try {
        const isRunning = await isDjmaxRunning('djmax_respect_v')
        const isRunningWjmax = await isDjmaxRunning('wjmax')
        if (!isRunning && !isRunningWjmax) {
          mainWindow.webContents.send('isDetectedGame', { status: false, game: '' })
          return
        }
        mainWindow.webContents.send('isDetectedGame', { status: true, game: isRunning ? 'DJMAX RESPECT V' : 'WJMAX' })

        if (isLogined && settingData.autoCaptureMode) {
          let focusedWindow = ''
          try {
            focusedWindow = await new Promise<string>((resolve, reject) => {
              exec(
                'powershell -command "Add-Type -TypeDefinition \'using System; using System.Runtime.InteropServices; public class Window { [DllImport(\\"user32.dll\\")] public static extern IntPtr GetForegroundWindow(); [DllImport(\\"user32.dll\\")] public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder text, int count); }\' ; $window = [Window]::GetForegroundWindow(); $buffer = New-Object System.Text.StringBuilder(256); [Window]::GetWindowText($window, $buffer, 256) > $null; $buffer.ToString()"',
                (err, stdout) => {
                  if (err) {
                    console.error('Error getting focused window:', err)
                    reject(err)
                    return
                  }
                  resolve(stdout.trim())
                },
              )
            })
          } catch (error) {
            console.error('Failed to get focused window:', error)
            isProcessing = false
            return
          }

          const isGameFocused = (focusedWindow === 'DJMAX RESPECT V' && isRunning) || (focusedWindow === 'WJMAX' && isRunningWjmax)

          if (isGameFocused || !settingData.captureOnlyFocused) {
            if (!isProcessing) {
              try {
                isProcessing = true
                console.log('Powershell isGameFocused Result : Game is focused. Capturing...', `(${focusedWindow})`)

                const gameSource = await captureScreen(isRunning ? 'djmax_respect_v' : 'wjmax')
                if (!gameSource) {
                  console.error('Failed to capture game screen')
                  isProcessing = false
                  return
                }

                const data = await processResultScreen(gameSource, false, false, isRunning ? 'djmax_respect_v' : 'wjmax')
                if (data?.playData && (data.playData.isVerified !== null || data.playData.screenType == 'versus' || data.playData.screenType == 'collection')) {
                  mainWindow.webContents.send('screenshot-uploaded', { ...data.playData, filePath: data.filePath })
                }
              } catch (error) {
                console.error('Error in capture and process:', error)
                isProcessing = false
              }
            } else {
              console.log('startCapturing : isProcessing is true. Skipping...')
            }
          } else {
            console.log('Powershell isGameFocused Result : Game is not focused. Skipping...', `(${focusedWindow})`)
          }
        }
      } catch (error) {
        console.error('Error in captureAndProcess:', error)
        isProcessing = false
      } finally {
        try {
          clearTimeout(settingData.autoCaptureIntervalId)
          settingData.autoCaptureIntervalId = setTimeout(
            captureAndProcess,
            [1000, 2000, 3000, 5000, 10000].includes(settingData.autoCaptureIntervalTime) ? settingData.autoCaptureIntervalTime : 3000,
          )
        } catch (error) {
          console.error('Error setting next capture interval:', error)
          isProcessing = false
        }
      }
    }

    captureAndProcess()
  }
  const pressAltInsert = async () => {
    try {
      console.log('Pressed Ctrl+Alt+Insert Key')
      if (settingData.resultOverlay) {
        overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
          message: '게임 화면 인식을 시작합니다. 잠시만 기다려주세요.',
          color: 'tw-bg-lime-600',
        })
      }
      const isRunning = await isDjmaxRunning('djmax_respect_v')
      const isRunningWjmax = await isDjmaxRunning('wjmax')
      console.log('isRunning:', isRunning, 'isRunningWjmax:', isRunningWjmax)
      if ((isRunning || isRunningWjmax) && isLogined) {
        try {
          isProcessing = true
          const gameSource = await captureScreen(isRunning ? 'djmax_respect_v' : 'wjmax')
          if (!gameSource) {
            console.error('Failed to capture game screen')
            isProcessing = false
            return
          }

          const data = await processResultScreen(gameSource, true, false, isRunning ? 'djmax_respect_v' : 'wjmax') // gameSource를 버퍼로 전달
          if (
            data !== null &&
            data !== undefined &&
            data !== '' &&
            data.playData &&
            (data.playData.isVerified !== undefined || data.playData.screenType == 'versus' || data.playData.screenType == 'collection')
          ) {
            mainWindow.webContents.send('screenshot-uploaded', { ...data.playData, filePath: data.filePath })
          } else {
            if (settingData.resultOverlay) {
              overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
                message: '게임 결과창이 아니거나 성과 기록 이미지를 처리 중에 오류가 발생하였습니다. 다시 시도해주시길 바랍니다.',
                color: 'tw-bg-red-600',
              })
            }
          }
        } catch (error) {
          isProcessing = false
          console.error('Error processing capture:', error)
        }
      }
    } catch (error) {
      console.error('Error processing capture:', error)
    }
  }

  ipcMain.on('open-external-link', (event, url) => {
    shell.openExternal(url)
  })
})()

// isDjmaxRunning 함수 수정
const isDjmaxRunning = (gameCode) => {
  return new Promise((resolve, reject) => {
    if (gameCode === 'djmax_respect_v') {
      exec('tasklist /FI "IMAGENAME eq DJMAX*" /FO CSV', (err, stdout, stderr) => {
        if (err) return reject(err)
        const isRunning = stdout.toLowerCase().includes('djmax')
        resolve(isRunning)
      })
    } else if (gameCode === 'wjmax') {
      exec('tasklist /FI "IMAGENAME eq WJMAX*" /FO CSV', (err, stdout, stderr) => {
        if (err) return reject(err)
        const isRunning = stdout.toLowerCase().includes('wjmax')
        resolve(isRunning)
      })
    }
  })
}

// captureScreen 함수 수정
async function captureScreen(gameCode) {
  try {
    if (['eapi', 'xcap-api', 'napi'].includes(settingData.autoCaptureApi)) {
      console.log(settingData.autoCaptureApi.toUpperCase() + ': Game Window Captured')

      let windows = Window.all().filter((value) => value.title.includes(gameList[gameCode]))

      if (windows.length > 0) {
        const window = windows[0]
        try {
          isFullscreen = window.isMaximized

          if (![640, 720, 800, 1024, 1128, 1280, 1366, 1600, 1680, 1760, 1920, 2048, 2288, 2560, 3072, 3200, 3840, 5120].includes(window.width)) {
            try {
              const image = window.captureImageSync()
              const pngImage = await sharp(image.toPngSync()).toBuffer()
              const metadata = await sharp(pngImage).metadata()

              // 이미지의 실제 컨텐츠 영역을 찾기 위한 분석
              const { data, info } = await sharp(pngImage).raw().toBuffer({ resolveWithObject: true })

              // 아래에서부터 검은색 픽셀(RGB: 0,0,0)이 아닌 첫 번째 행을 찾음
              let actualHeight = metadata.height
              for (let y = metadata.height - 1; y >= 0; y--) {
                let isNonBlackRow = false
                for (let x = 0; x < metadata.width; x++) {
                  const idx = (y * metadata.width + x) * info.channels
                  // RGB 값이 모두 0인지 확인
                  if (data[idx] !== 0 || data[idx + 1] !== 0 || data[idx + 2] !== 0) {
                    isNonBlackRow = true
                    break
                  }
                }
                if (isNonBlackRow) {
                  actualHeight = y + 1
                  break
                }
              }

              if (!isUploaded) {
                removedPixels = metadata.height - actualHeight
              }
              console.log(`Removed Black Pixels: ${removedPixels}px`)

              // 검은색 여백을 제거한 이미지 생성
              try {
                const croppedImage = await sharp(pngImage)
                  .extract({
                    left: removedPixels,
                    top: 0,
                    width: metadata.width - removedPixels * 2,
                    height: actualHeight,
                  })
                  .resize(1920)
                  .toBuffer()

                const croppedImageMetadata = await sharp(croppedImage).metadata()

                const resizedImage = await sharp(croppedImage)
                  .extract({
                    left: 0,
                    top: croppedImageMetadata.height - 1080,
                    width: croppedImageMetadata.width,
                    height: 1080,
                  })
                  .toBuffer()

                return resizedImage
              } catch (error) {
                console.error('Error processing image crop/resize:', error)
                isProcessing = false
                return null
              }
            } catch (error) {
              console.error('Error capturing or processing initial image:', error)
              isProcessing = false
              return null
            }
          } else {
            try {
              return await sharp(window.captureImageSync().toPngSync()).resize(1920, 1080).toBuffer()
            } catch (error) {
              console.error('Error capturing fullscreen image:', error)
              isProcessing = false
              return null
            }
          }
        } catch (error) {
          console.error('Error processing window capture:', error)
          isProcessing = false
          return null
        }
      } else {
        console.log('No matching game window found')
        return null
      }
    }
    return null
  } catch (error) {
    console.error('Critical error in captureScreen:', error)
    isProcessing = false
    return null
  }
}

// OCR 실행 함수
async function recognizeText(imageBuffer, lang = 'eng') {
  let worker = null
  try {
    worker = await Tesseract.createWorker('eng')

    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ',
    })

    const {
      data: { text },
    } = await worker.recognize(imageBuffer)

    return text || ''
  } catch (error) {
    console.error('Error in OCR text recognition:', error)
    return ''
  } finally {
    if (worker) {
      try {
        await worker.terminate()
      } catch (terminateError) {
        console.error('Error terminating Tesseract worker:', terminateError)
      }
    }
  }
}

app.on('will-quit', () => {
  clearInterval(settingData.autoCaptureIntervalId) // Clear the interval when the app is about to quit
})

app.on('window-all-closed', () => {
  app.quit()
})

ipcMain.on('message', async (event, arg) => {
  event.reply('message', `${arg} World!`)
})

ipcMain.on('reload-app', () => {
  app.relaunch()
  app.exit()
})

// 렌더러 프로세스에서 업데이트 승인 시 설치 및 앱 종료
ipcMain.on('update-app', () => {
  // 오버레이 윈도우 정리
  if (overlayWindow) {
    overlayWindow.destroy()
    overlayWindow = null
  }

  // 자동 캡처 인터벌 정리
  if (settingData.autoCaptureIntervalId) {
    clearTimeout(settingData.autoCaptureIntervalId)
  }

  // 전역 단축키 해제
  globalShortcut.unregisterAll()

  // 업데이트 설치 및 앱 재시작
  autoUpdater.quitAndInstall()
})

app.on('before-quit', () => {
  // 전역 단축키 해제
  globalShortcut.unregisterAll()

  // 자동 캡처 인터벌 정리
  if (settingData.autoCaptureIntervalId) {
    clearTimeout(settingData.autoCaptureIntervalId)
  }

  // 오버레이 윈도우 정리
  if (overlayWindow) {
    overlayWindow.destroy()
    overlayWindow = null
  }
})
