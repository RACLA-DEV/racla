import path from 'path'
import fs from 'fs'
import { app, BrowserWindow, desktopCapturer, ipcMain, screen, session, shell, globalShortcut } from 'electron'
import serve from 'electron-serve'
import { createWindow } from './helpers'
import { clearSession, getSession, getSettingData, getSongData, storeSession, storeSettingData, storeSongData } from './fsManager'
import { autoUpdater } from 'electron-updater'
import sharp from 'sharp'
import Tesseract from 'tesseract.js'
import moment from 'moment'
import { Window } from 'node-screenshots'
import { exec } from 'child_process'
import 'moment/locale/ko'
import FormData from 'form-data'
import axios from 'axios'
import { randomUUID } from 'crypto'
import { settingsManager } from './settingsManager'
const isProd = process.env.NODE_ENV === 'production'

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
    width: 1440,
    height: 810,
    minWidth: 1440,
    minHeight: 810,
    frame: false,
    center: true,
    icon: path.join(__dirname + '/../resources/', 'icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      devTools: !isProd,
      preload: path.join(__dirname, 'preload.js'),
    },
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
    useContentSize: true,
    type: 'toolbar', // 창 유형을 'toolbar'로 설정
  })

  // 오버레이 창 설정
  overlayWindow.setIgnoreMouseEvents(true, { forward: true })
  overlayWindow.setAlwaysOnTop(true, 'screen-saver')
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  if (isProd) {
    await mainWindow.loadURL('app://./projectRa/home')
    await overlayWindow.loadURL('app://./projectRa/overlay/widget')
  } else {
    const port = process.argv[2]
    await mainWindow.loadURL(`http://localhost:${port}/projectRa/home`)
    await overlayWindow.loadURL(`http://localhost:${port}/projectRa/overlay/widget`)
    mainWindow.webContents.openDevTools()
    overlayWindow.webContents.openDevTools()
  }

  // findGameWindow 함수 수정
  async function findGameWindow() {
    return new Promise((resolve, reject) => {
      exec('tasklist /FI "IMAGENAME eq DJMAX*" /FO CSV', (err, stdout, stderr) => {
        if (err) return reject(err)

        if (stdout.toLowerCase().includes('djmax')) {
          const windows = Window.all().filter((w) => w.title.includes('DJMAX RESPECT V'))
          if (windows.length > 0) {
            const gameWindow = windows[0]

            // 원래 윈도우의 실제 좌표와 크기를 그대로 반환
            const bounds = {
              x: gameWindow.x,
              y: gameWindow.y,
              width: gameWindow.width,
              height: gameWindow.height,
            }

            resolve(bounds)
          }
        }
        resolve(null)
      })
    })
  }

  // checkGameAndUpdateOverlay 함수 수정
  async function checkGameAndUpdateOverlay() {
    try {
      const isGameRunning = await isDjmaxRunning()

      // 게임이 실행중이지 않으면 오버레이 숨기고 early return
      if (!isGameRunning) {
        if (overlayWindow.isVisible()) {
          overlayWindow.hide()
        }
        mainWindow.webContents.send('isDetectedGame', false)
        return
      }

      const gamePos: any = await findGameWindow()
      const focusedWindow = await getFocusedWindow()
      const isGameFocused = focusedWindow === 'DJMAX RESPECT V'

      if (gamePos) {
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

        mainWindow.webContents.send('isDetectedGame', true)
      } else {
        if (overlayWindow.isVisible()) {
          overlayWindow.hide()
        }
        mainWindow.webContents.send('isDetectedGame', false)
      }
    } catch (error) {
      console.error('Error checking game status:', error)
    }
  }

  // getFocusedWindow 함수 추가 - PowerShell 명령어를 별도 함수로 분리
  async function getFocusedWindow(): Promise<string> {
    return new Promise((resolve) => {
      exec(
        'powershell -command "Add-Type -TypeDefinition \'using System; using System.Runtime.InteropServices; public class Window { [DllImport(\\"user32.dll\\")] public static extern IntPtr GetForegroundWindow(); [DllImport(\\"user32.dll\\")] public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder text, int count); }\' ; $window = [Window]::GetForegroundWindow(); $buffer = New-Object System.Text.StringBuilder(256); [Window]::GetWindowText($window, $buffer, 256) > $null; $buffer.ToString()"',
        (err, stdout) => {
          resolve(stdout.trim())
        },
      )
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
      setTimeout(checkGameOverlayLoop, 100)
    }
  }

  // 초기 체크 시작
  checkGameOverlayLoop()

  ipcMain.on('closeApp', () => {
    // 오버레이 윈도우 먼저 제거
    if (overlayWindow) {
      overlayWindow.destroy()
      overlayWindow = null
    }
    // 메인 윈도우 종료
    mainWindow.close()
    // 앱 종료 강제 실행
    app.quit()
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
  ipcMain.on('login', async (event, { userNo, userToken }) => {
    try {
      isLogined = true
      storeSession({ userNo, userToken })
      mainWindow.webContents.send('IPC_RENDERER_IS_LOGINED', true)
    } catch (e) {
      mainWindow.webContents.send('IPC_RENDERER_IS_LOGINED', false)
    }
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
  ipcMain.on('putSongData', async (event, songData) => {
    try {
      storeSongData(songData)
      mainWindow.webContents.send('IPC_RENDERER_IS_LOADED_SONG_DATA', true)
    } catch (e) {
      mainWindow.webContents.send('IPC_RENDERER_IS_LOADED_SONG_DATA', false)
    }
  })

  // 세션 정보 요청 처리
  ipcMain.on('getSongData', async (event) => {
    const songData = await getSongData()
    mainWindow.webContents.send('IPC_RENDERER_GET_SONG_DATA', songData ? songData : null)
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
          url: isProd ? 'https://app-proxy.lunatica.kr' : 'https://dev-proxy.lunatica.kr',
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
      session.defaultSession.cookies.remove(isProd ? 'https://app-proxy.lunatica.kr' : 'https://dev-proxy.lunatica.kr', 'Authorization').then(() => {
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
    }
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

  async function processResultScreen(imageBuffer, isMenualUpload?, isNotSaveImage?) {
    try {
      console.log('Client Side OCR isResultScreen Requested. Processing image data...')
      let processedBuffer = await sharp(imageBuffer).extract({ width: 230, height: 24, left: 100, top: 236 }).grayscale().linear(1.5, 0).toBuffer()
      const text = await recognizeText(processedBuffer, 'eng')
      const isResult = ['JUDGEMENT', 'DETAILS', 'DETAIL', 'JUDGE', 'JUDGEMENT DETAILS'].filter((value) => {
        return text.toUpperCase().trim().includes(value) && text.length !== 0
      })
      console.log('Client Side OCR isResultScreen:', isResult.length >= 1, `(${text.toUpperCase().trim()})`)

      if (isResult.length >= 1 && (!isUploaded || isMenualUpload)) {
        if (!isMenualUpload) {
          mainWindow.webContents.send('push', {
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
          formData.append('file', imageBuffer, {
            filename: randomUUID() + '.png',
            contentType: 'image/png',
          })
          const session = await getSession()
          const response = await axios.post(
            `${isProd ? 'https://project-ra-app.lunatica.kr/api/v1' : 'https://project-ra-dev.lunatica.kr/api/v1'}/ocr/upload`,
            formData,
            {
              headers: {
                ...formData.getHeaders(),
                Authorization: isLogined ? `${session.userNo}|${session.userToken}` : '',
              },
              withCredentials: true,
            },
          )
          console.log('Server Side OCR PlayData Result:', { ...response.data, processedTime: Date.now() - serverOcrStartTime + 'ms' })

          const { playData } = response.data

          if (playData.isVerified) {
            const filePath = path.join(
              app.getPath('pictures'),
              'PROJECT-RA',
              String(playData.songData.name).replaceAll(':', '-') +
                '-' +
                String(playData.score) +
                '-' +
                moment().utcOffset(9).format('YYYY-MM-DD-HH-mm-ss') +
                '.png',
            )

            if (settingData.saveImageWhenCapture && !isNotSaveImage) {
              fs.writeFile(filePath, Buffer.from(imageBuffer), (err) => {
                if (err) {
                  console.error('Failed to save file:', err)
                } else {
                  console.log('File saved to', filePath)
                }
              })
            }

            isUploaded = true
            settingData.resultOverlay && overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', { ...response.data.playData })
            return { ...response.data, filePath: settingData.saveImageWhenCapture ? filePath : null }
          } else {
            return {
              playData: {
                isVerified: null,
              },
            }
          }
        } catch (error) {
          console.error('서버 사이드 OCR 요청 실패:', error)
          return {
            playData: {
              isVerified: false,
              error: '서버 사이드 OCR 요청 실패',
            },
          }
        }
      } else if (isResult.length >= 1 && isUploaded) {
        console.log('Waiting for Exit Result Screen...')
        return {
          playData: {
            isVerified: null,
          },
        }
      } else {
        console.log('Waiting for Result Screen...')
        isUploaded = false
        return {
          playData: {
            isVerified: null,
          },
        }
      }
    } catch (error) {
      console.error('Error processing capture:', error)
    }
  }

  ipcMain.on('canvas-screenshot-upload', async (event, data) => {
    const { buffer, fileName } = data
    const imageBuffer = Buffer.from(buffer, 'base64')
    const filePath = path.join(app.getPath('pictures'), 'PROJECT-RA', fileName)
    fs.writeFile(filePath, imageBuffer, (err) => {
      if (err) {
        console.error('Failed to save file:', err)
      }
    })
  })

  ipcMain.on('captureTest', async (event, data) => {
    const imageBuffer = await captureScreen()

    console.log(imageBuffer)

    const filePath = path.join(app.getPath('pictures'), 'PROJECT-RA', '화면 캡쳐-' + moment().utcOffset(9).format('YYYY-MM-DD-HH-mm-ss-SSS') + '.png')

    fs.writeFile(filePath, Buffer.from(imageBuffer), (err) => {
      if (err) {
        console.error('Failed to save file:', err)
      } else {
        console.log('File saved to', filePath)
        shell.showItemInFolder(filePath)
      }
    })
  })

  ipcMain.on('screenshot-upload', async (event, buffer) => {
    const image = await sharp(buffer).resize(1920).toFormat('png').toBuffer()

    const resizedImageMetadata = await sharp(image).metadata()

    if (resizedImageMetadata.height !== (resizedImageMetadata.width / 16) * 9) {
      console.log('Windowed Image Detected.')
      const croppedBuffer = await sharp(image)
        .extract({ width: 1920, height: 1080, left: 0, top: resizedImageMetadata.height - (resizedImageMetadata.width / 16) * 9 })
        .toBuffer()

      const { playData } = await processResultScreen(croppedBuffer, true, true)
      if (playData !== null && playData.isVerified !== undefined) {
        mainWindow.webContents.send('screenshot-uploaded', playData)
      }
    } else {
      console.log('Full Screen Image Detected.')
      const { playData } = await processResultScreen(image, true, true)
      if (playData !== null && playData.isVerified !== undefined) {
        mainWindow.webContents.send('screenshot-uploaded', playData)
      }
    }
  })

  async function startCapturing() {
    const captureAndProcess = async () => {
      try {
        const isRunning = await isDjmaxRunning()
        if (!isRunning) {
          mainWindow.webContents.send('isDetectedGame', false)
          return
        }
        mainWindow.webContents.send('isDetectedGame', true)

        if (isLogined && settingData.autoCaptureMode) {
          const focusedWindow = await new Promise<string>((resolve) => {
            exec(
              'powershell -command "Add-Type -TypeDefinition \'using System; using System.Runtime.InteropServices; public class Window { [DllImport(\\"user32.dll\\")] public static extern IntPtr GetForegroundWindow(); [DllImport(\\"user32.dll\\")] public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder text, int count); }\' ; $window = [Window]::GetForegroundWindow(); $buffer = New-Object System.Text.StringBuilder(256); [Window]::GetWindowText($window, $buffer, 256) > $null; $buffer.ToString()"',
              (err, stdout) => {
                resolve(stdout.trim())
              },
            )
          })

          const isGameFocused = focusedWindow == 'DJMAX RESPECT V'

          if (isGameFocused || !settingData.captureOnlyFocused) {
            console.log('Powershell isGameFocused Result : Game is focused. Capturing...', `(${focusedWindow})`)
            const gameSource = await captureScreen()
            const data = await processResultScreen(gameSource) // gameSource를 버퍼로 전달
            if (data !== null && data !== undefined && data.playData && data.playData.isVerified !== null) {
              mainWindow.webContents.send('screenshot-uploaded', { ...data.playData, filePath: data.filePath })
            }
          } else {
            console.log('Powershell isGameFocused Result : Game is not focused. Skipping...', `(${focusedWindow})`)
          }
        }
      } catch (error) {
        console.error('Error processing capture:', error)
      } finally {
        // 작업이 완료된 후 2초 후에 다음 작업 예약
        clearTimeout(settingData.autoCaptureIntervalId)
        settingData.autoCaptureIntervalId = setTimeout(
          captureAndProcess,
          [1000, 2000, 3000, 5000, 10000].includes(settingData.autoCaptureIntervalTime) ? settingData.autoCaptureIntervalTime : 3000,
        )
      }
    }

    captureAndProcess() // 초기 호출
  }
  const pressAltInsert = async () => {
    try {
      console.log('Pressed Ctrl+Alt+Insert Key')
      if (settingData.resultOverlay) {
        overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
          message: '게임 결과창 인식을 시작합니다. 잠시만 기다려주세요.',
          color: 'tw-bg-lime-600',
        })
      }
      const isRunning = await isDjmaxRunning()
      console.log('isRunning:', isRunning)
      if (isRunning && isLogined) {
        const gameSource = await captureScreen()
        const data = await processResultScreen(gameSource, true) // gameSource를 버퍼로 전달
        if (data !== null && data !== undefined && data.playData && data.playData.isVerified !== null) {
          mainWindow.webContents.send('screenshot-uploaded', { ...data.playData, filePath: data.filePath })
        } else {
          if (settingData.resultOverlay) {
            overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
              message: '게임 결과창이 아니거나 성과 기록 이미지를 처리 중에 오류가 발생하였습니다. 다시 시도해주시길 바랍니다.',
              color: 'tw-bg-red-600',
            })
          }
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

const isDjmaxRunning = () => {
  return new Promise((resolve, reject) => {
    // 'tasklist' 명령어를 사용하여 'DJMAX RESPECT V'가 실행 중인지 확인
    exec('tasklist /FI "IMAGENAME eq DJMAX*" /FO CSV', (err, stdout, stderr) => {
      if (err) {
        return reject(err)
      }

      // stdout에 'DJMAX'가 포함된 프로세스가 있는지 확인
      const isRunning = stdout.toLowerCase().includes('djmax')
      resolve(isRunning)
    })
  })
}

async function captureScreen() {
  try {
    if (['eapi', 'xcap-api', 'napi'].includes(settingData.autoCaptureApi)) {
      console.log(settingData.autoCaptureApi.toUpperCase() + ': Game Window Captured')

      const windows = Window.all().filter((value) => value.title.includes('DJMAX RESPECT V'))

      if (windows.length > 0) {
        const window = windows[0]

        isFullscreen = window.isMaximized

        if (![640, 720, 800, 1024, 1128, 1280, 1366, 1600, 1680, 1760, 1920, 2048, 2288, 2560, 3072, 3200, 3840, 5120].includes(window.width)) {
          // ... existing code ...
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
        } else {
          return await sharp(window.captureImageSync().toPngSync()).resize(1920, 1080).toBuffer()
        }
      } else {
        return null
      }
    }

    return null // 게임 창을 찾지 못한 경우 null 반환
  } catch (error) {
    console.error('Error capturing screen:', error)
    return null
  }
}

// OCR 실행 함수
async function recognizeText(imageBuffer, lang = 'eng') {
  const worker = await Tesseract.createWorker('eng')

  const workingNumber = async () => {
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ',
    })
    const {
      data: { text },
    } = await worker.recognize(imageBuffer)
    await worker.terminate()

    return text
  }

  const data = await workingNumber()

  return data
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
