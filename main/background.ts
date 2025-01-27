declare global {
  namespace Electron {
    interface App {
      isQuitting: boolean
    }
  }
}

import 'moment/locale/ko'

import {
  BrowserWindow,
  Menu,
  Tray,
  app,
  globalShortcut,
  ipcMain,
  screen,
  session,
  shell,
} from 'electron'
import path, { resolve } from 'path'
import {
  clearSession,
  getSession,
  getSettingData,
  getSongData,
  getWjmaxSongData,
  storeSession,
  storeSongData,
  storeWjmaxSongData,
} from './fsManager'

import { exec } from 'child_process'
import crypto from 'crypto'
import serve from 'electron-serve'
import { autoUpdater } from 'electron-updater'
import fs from 'fs'
import http from 'http'
import moment from 'moment'
import net from 'net'
import { Window } from 'node-screenshots'
import sharp from 'sharp'
import Tesseract from 'tesseract.js'
import { promisify } from 'util'
import { createWindow } from './helpers'
import { logMainError } from './mainLogger'
import { processResultScreen } from './ocrManager'
import { settingsManager } from './settingsManager'

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
  closeToTray: false,
}
let isUploaded = false
let overlayWindow: BrowserWindow | null = null
let removedPixels = 0
let isFullscreen = false
let isProcessing = false
let userData: any = {
  userNo: '',
  userToken: '',
}
const WJMAX_ENCRYPTION_KEY = '99FLKWJFL;l99r7@!()f09sodkjfs;a;o9fU#@'

const gameList = { djmax_respect_v: 'DJMAX RESPECT V', wjmax: 'WJMAX' }

const gotTheLock = app.requestSingleInstanceLock()
console.log('gotTheLock', gotTheLock)

if (!gotTheLock) {
  app.quit()
  process.exit(0)
}

// 윈도우 이동/리사이즈 중인지 추적하는 변수 추가
let isWindowMoving = false
let windowMoveTimeout = null

let tray: Tray | null = null
let mainWindow: BrowserWindow | null = null

// 사용 가능한 포트를 찾는 함수
const getAvailablePort = async (startPort: number = 3000): Promise<number> => {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.unref()
    server.on('error', () => {
      // 포트가 사용 중이면 다음 포트 시도
      getAvailablePort(startPort + 1).then(resolve, reject)
    })
    server.listen(startPort, () => {
      server.close(() => resolve(startPort))
    })
  })
}

;(async () => {
  await app.whenReady()

  // 최상단에서 프로토콜 설정
  if (process.defaultApp) {
    app.setAsDefaultProtocolClient('racla', process.execPath, [resolve(process.argv[1])])
  } else {
    app.setAsDefaultProtocolClient('racla')
  }

  app.setAppUserModelId('RACLA')

  const isRegistered = globalShortcut.register('Alt+Insert', () => {
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

  mainWindow = createWindow('main', {
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
      devTools: !isProd,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  // 윈도우 닫기 버튼 클릭 시 설정에 따라 트레이로 최소화 또는 종료
  mainWindow.on('close', (event) => {
    if (!app.isQuitting && settingData.closeToTray) {
      event.preventDefault()
      mainWindow?.hide()
      return false
    }
    return true
  })

  // 최소화 버튼 클릭 시 항상 작업 표시줄로 최소화
  ipcMain.on('minimizeApp', () => {
    mainWindow?.minimize()
  })

  // 트레이 아이콘 생성/제거 함수
  const setupTray = () => {
    if (settingData.closeToTray && !tray) {
      tray = new Tray(path.join(__dirname + '/../resources/', 'icon.ico'))

      const contextMenu = Menu.buildFromTemplate([
        {
          label: 'RACLA 데스크톱 앱',
          enabled: false,
        },
        { type: 'separator' },
        {
          label: '열기',
          click: () => {
            mainWindow?.show()
          },
        },
        {
          label: '종료',
          click: () => {
            app.isQuitting = true
            app.quit()
          },
        },
      ])

      tray.setToolTip('RACLA')
      tray.setContextMenu(contextMenu)

      tray.on('click', () => {
        mainWindow?.show()
      })
    } else if (!settingData.closeToTray && tray) {
      tray.destroy()
      tray = null
    }
  }

  // 설정 변경 시 트레이 아이콘 업데이트
  ipcMain.on('changeSettingData', async (event, data) => {
    const updatedSettings = await settingsManager.updateSettings(data)
    settingData = updatedSettings

    // closeToTray 설정이 변경되었을 때 트레이 아이콘 설정 업데이트
    if ('closeToTray' in data) {
      setupTray()
    }

    // 재시작이 필요한 설정이 변경되었는지 확인
    if (settingsManager.requiresRestart(Object.keys(data))) {
      app.relaunch()
      app.exit()
    }

    mainWindow.webContents.send('IPC_RENDERER_GET_SETTING_DATA', updatedSettings)
  })

  // 초기 트레이 아이콘 설정
  setupTray()

  // 앱 종료 전 플래그 설정
  app.on('before-quit', () => {
    app.isQuitting = true
  })

  // 메인 윈도우 생성 부분에서 이벤트 리스너 추가
  mainWindow.on('move', () => {
    if (windowMoveTimeout) {
      clearTimeout(windowMoveTimeout)
    }
    isWindowMoving = true
    windowMoveTimeout = setTimeout(() => {
      isWindowMoving = false
    }, 100)
  })

  mainWindow.on('resize', () => {
    if (windowMoveTimeout) {
      clearTimeout(windowMoveTimeout)
    }
    isWindowMoving = true
    windowMoveTimeout = setTimeout(() => {
      isWindowMoving = false
    }, 100)
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
          } catch (error) {
            console.error('Error processing window information:', error)
            logMainError(error, isLogined ? userData : null)
            resolve(null)
          }
        })
      } catch (error) {
        console.error('Error in findGameWindow:', error)
        logMainError(error, isLogined ? userData : null)
        resolve(null)
      }
    })
  }

  async function checkGameAndUpdateOverlay() {
    try {
      // 윈도우 이동/리사이즈 중일 때는 오버레이 업데이트 건너뛰기
      if (isWindowMoving) {
        return
      }

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
      let isGameFocused =
        (isGameRunning && focusedWindow === 'DJMAX RESPECT V') ||
        (isWjmaxRunning && focusedWindow === 'WJMAX')

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
            x:
              (gamePos.width / 16) * 9 !== gamePos.height
                ? Math.round(gamePos.x / scaleFactor) + removedPixels
                : Math.round(gamePos.x / scaleFactor),
            y:
              Math.round(gamePos.y / scaleFactor) +
              ((gamePos.width / 16) * 9 !== gamePos.height
                ? (gamePos.height - (gamePos.width / 16) * 9) / scaleFactor + 0
                : 0),
            width:
              (gamePos.width / 16) * 9 !== gamePos.height
                ? gamePos.width / scaleFactor - removedPixels * 2
                : gamePos.width / scaleFactor,
            height:
              (gamePos.width / 16) * 9 !== gamePos.height
                ? (gamePos.height - (gamePos.height - (gamePos.width / 16) * 9)) / scaleFactor -
                  removedPixels
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
      logMainError(error, isLogined ? userData : null)
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
        logMainError(error, isLogined ? userData : null)
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
      logMainError(error, isLogined ? userData : null)
    } finally {
      // 체크 간격을 100ms로 증가 (초당 10회)
      setTimeout(() => checkGameOverlayLoop(), 100)
    }
  }

  // 초기 체크 시작
  checkGameOverlayLoop()

  ipcMain.on('hideToTray', () => {
    if (!tray) {
      tray = new Tray(path.join(__dirname + '/../resources/', 'icon.ico'))

      const contextMenu = Menu.buildFromTemplate([
        {
          label: 'RACLA 데스크톱 앱',
          enabled: false, // 클릭 불가능하게 설정
        },
        { type: 'separator' },
        {
          label: '열기',
          click: () => {
            showWindowAndRemoveTray()
          },
        },
        {
          label: '종료',
          click: async () => {
            try {
              app.isQuitting = true

              // 모든 IPC 리스너 제거
              ipcMain.removeAllListeners()

              // 오버레이 윈도우 정리
              if (overlayWindow) {
                overlayWindow.removeAllListeners()
                overlayWindow.destroy()
                overlayWindow = null
              }

              // 트레이 아이콘 정리
              if (tray) {
                tray.destroy()
                tray = null
              }

              // 메인 윈도우 정리
              if (mainWindow) {
                mainWindow.removeAllListeners()
                mainWindow.destroy()
                mainWindow = null
              }

              // 잠시 대기 후 앱 종료
              setTimeout(() => {
                app.quit()
              }, 100)
            } catch (error) {
              console.error('Error during app closure:', error)
              logMainError(error, isLogined ? userData : null)
              app.exit(1)
            }
          },
        },
      ])

      tray.setToolTip('RACLA')
      tray.setContextMenu(contextMenu)

      // 더블클릭 이벤트로 변경
      tray.on('double-click', () => {
        showWindowAndRemoveTray()
      })
    }

    mainWindow?.hide()
  })

  // 윈도우를 보여주고 트레이 아이콘을 무조건 제거
  const showWindowAndRemoveTray = () => {
    mainWindow?.show()
    if (tray) {
      tray.destroy()
      tray = null
    }
  }

  ipcMain.on('closeApp', async () => {
    try {
      app.isQuitting = true

      // 모든 IPC 리스너 제거
      ipcMain.removeAllListeners()

      // 오버레이 윈도우 정리
      if (overlayWindow) {
        overlayWindow.removeAllListeners()
        overlayWindow.destroy()
        overlayWindow = null
      }

      // 트레이 아이콘 정리
      if (tray) {
        tray.destroy()
        tray = null
      }

      // 메인 윈도우 정리
      if (mainWindow) {
        mainWindow.removeAllListeners()
        mainWindow.destroy()
        mainWindow = null
      }

      // 잠시 대기 후 앱 종료
      setTimeout(() => {
        app.quit()
      }, 100)
    } catch (error) {
      console.error('Error during app closure:', error)
      logMainError(error, isLogined ? userData : null)
      app.exit(1)
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

  // 창 크기 최대화 감지
  mainWindow.on('resize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.webContents.send('IPC_RENDERER_RESIZE_IS_MAXIMIZED', true)
    } else {
      mainWindow.webContents.send('IPC_RENDERER_RESIZE_IS_MAXIMIZED', false)
    }
  })

  // Discord OAuth 관련 추가
  app.setAsDefaultProtocolClient('app') // 기존 프로토콜

  // Discord OAuth 콜백을 위한 새로운 엔드포인트
  ipcMain.handle('OPEN_DISCORD_LOGIN', async () => {
    const state = crypto.randomBytes(16).toString('hex')
    const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1331547515744682036'
    const REDIRECT_URI = 'http://localhost:54321/oauth/discord/callback'
    let server: http.Server | null = null

    return new Promise((resolve, reject) => {
      server = http.createServer(async (req, res) => {
        if (req.url?.startsWith('/oauth/discord/callback')) {
          const urlObj = new URL(req.url, `http://localhost:54321`)
          const code = urlObj.searchParams.get('code')
          const returnedState = urlObj.searchParams.get('state')

          if (code && returnedState === state) {
            res.writeHead(302, {
              Location: 'https://r-archive.zip/login/oauth/success',
            })
            res.end()

            // 모든 연결 종료 후 서버 닫기
            server?.closeAllConnections()
            server?.close(() => {
              server = null
              resolve(code)
            })
          }
        }
      })

      server.on('error', (e: any) => {
        if (e.code === 'EADDRINUSE') {
          mainWindow?.webContents.send('pushNotification', {
            message:
              '다른 프로그램에서 54321 포트를 사용하고 있어 Discord로 로그인을 할 수 없습니다.',
            color: 'tw-bg-red-600',
          })
          reject(new Error('Port 54321 is already in use'))
        } else {
          mainWindow?.webContents.send('pushNotification', {
            message: 'Discord로 로그인 중 오류가 발생했습니다.',
            color: 'tw-bg-red-600',
          })
          reject(e)
        }
      })

      server.listen(54321, () => {
        const authUrl = new URL('https://discord.com/api/oauth2/authorize')
        authUrl.searchParams.append('client_id', DISCORD_CLIENT_ID)
        authUrl.searchParams.append('response_type', 'code')
        authUrl.searchParams.append('redirect_uri', REDIRECT_URI)
        authUrl.searchParams.append('scope', 'identify')
        authUrl.searchParams.append('state', state)

        console.log('Discord OAuth URL:', authUrl.toString())
        shell.openExternal(authUrl.toString())
      })

      // 타임아웃 시 서버 정리
      setTimeout(() => {
        if (server) {
          server.closeAllConnections()
          server.close(() => {
            server = null
            reject(new Error('Discord login timeout'))
          })
        }
      }, 300000)
    })
  })

  // 세션 저장 처리
  ipcMain.on('logined', async (event, value) => {
    isLogined = true
  })

  // 세션 저장 처리
  ipcMain.on(
    'login',
    async (event, { userNo, userToken, vArchiveUserNo, vArchiveUserToken, vArchiveUserName }) => {
      if (vArchiveUserNo && vArchiveUserToken) {
        try {
          storeSession({
            vArchiveUserNo,
            vArchiveUserToken,
            vArchiveUserName,
            userNo: '',
            userToken: '',
          })
          mainWindow.webContents.send('IPC_RENDERER_IS_LOGINED', true)
        } catch (error) {
          mainWindow.webContents.send('IPC_RENDERER_IS_LOGINED', false)
          logMainError(error, isLogined ? userData : null)
        }
      }
      if (userNo && userToken) {
        try {
          storeSession({
            vArchiveUserNo: '',
            vArchiveUserToken: '',
            vArchiveUserName: '',
            userNo,
            userToken,
          })
          mainWindow.webContents.send('IPC_RENDERER_IS_LOGINED', true)
        } catch (error) {
          mainWindow.webContents.send('IPC_RENDERER_IS_LOGINED', false)
          logMainError(error, isLogined ? userData : null)
        }
      }
    },
  )

  ipcMain.on('storeSession', async (event, value) => {
    storeSession(value)
  })

  // 로그아웃 요청 처리
  ipcMain.on('logout', async (event) => {
    isLogined = false
    clearSession()
    userData = {
      userNo: '',
      userToken: '',
    }
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
    } catch (error) {
      mainWindow.webContents.send('IPC_RENDERER_IS_LOADED_SONG_DATA', false)
      logMainError(error, isLogined ? userData : null)
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
    mainWindow.webContents.send(
      'IPC_RENDERER_GET_SONG_DATA',
      songData ? { songData, gameCode } : null,
    )
  })

  ipcMain.on('openBrowser', (event, url) => {
    event.preventDefault()
    mainWindow.webContents.send('confirm-external-link', url)
  })

  ipcMain.on('setAuthorization', async (event, { userNo, userToken }) => {
    userData = {
      userNo,
      userToken,
    }
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
      session.defaultSession.cookies
        .remove(
          isProd ? 'https://aosame-rain.r-archive.zip/' : 'https://kamome-sano.r-archive.zip/',
          'Authorization',
        )
        .then(() => {
          console.log('Authorization Cookie Removed.')
        })
    }
  })

  ipcMain.on('getSettingData', async (event) => {
    await settingsManager.initializeSettings()
    const settingData = await getSettingData()
    mainWindow.webContents.send('IPC_RENDERER_GET_SETTING_DATA', settingData)
  })

  ipcMain.on('PROGRAM_LOADED', async () => {
    if (!isLoaded) {
      // 자동 업데이트 체크
      settingData = await getSettingData()
      if (settingData.autoUpdate) {
        autoUpdater.checkForUpdatesAndNotify({
          title: 'RACLA 데스크톱 앱 업데이트가 준비되었습니다.',
          body: '업데이트를 적용하기 위해 앱을 종료하고 다시 실행하거나 해당 알림을 클릭해주세요.',
        })
      }
      startCapturing()
      isLoaded = true
      if (settingData.autoStartGame) {
        if (settingData.autoStartGameDjmaxRespectV) {
          const isRunning = await isDjmaxRunning('djmax_respect_v')
          if (!isRunning) {
            shell.openExternal('steam://run/960170')
            mainWindow.webContents.send('pushNotification', {
              message:
                '자동 시작 옵션이 활성화되어 DJMAX RESPECT V(게임)을 실행 중에 있습니다. 잠시만 기다려주세요.',
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
    if (data.currentCutoff > data.previousCutoff) {
      overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
        title: data.title,
        message: `방금 전 업로드된 ${data.name} 곡의 성과로 TOP50이 ${data.previousCutoff}TP에서 ${data.currentCutoff}TP로 갱신되었습니다.`,
        color: 'tw-bg-amber-600',
      })
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

  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      mainWindow.focus()

      // 알림 표시 (선택사항)
      mainWindow.webContents.send('pushNotification', {
        message: '앱이 이미 실행 중입니다.',
        color: 'tw-bg-blue-600',
      })
    }
  })

  ipcMain.on('create-player-file', async (event, data) => {
    const { userNo, userToken } = data

    const filePath = path.join(app.getPath('documents'), 'RACLA', 'player.txt')

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

    const filePath = path.join(
      app.getPath('pictures'),
      'RACLA',
      '화면 캡쳐-' + moment().utcOffset(9).format('YYYY-MM-DD-HH-mm-ss-SSS') + '.png',
    )

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
          .extract({
            width: 1920,
            height: 1080,
            left: 0,
            top: resizedImageMetadata.height - (resizedImageMetadata.width / 16) * 9,
          })
          .toBuffer()

        const data = await processResultScreen(
          croppedBuffer,
          { isMenualUpload: true, isNotSaveImage: true, gameCode },
          { app, settingData, mainWindow, overlayWindow, isProd, isLogined, isUploaded },
          userData,
        )
        isProcessing = false
        if (
          data?.playData !== null &&
          (data?.playData?.isVerified !== undefined ||
            data?.playData?.screenType == 'versus' ||
            data?.playData?.screenType == 'collection')
        ) {
          overlayWindow.webContents.send('PLAY_NOTIFICATION_SOUND')
          mainWindow.webContents.send('screenshot-uploaded', data?.playData)
        } else {
          mainWindow.webContents.send('screenshot-uploaded', {
            playData: { isVerified: false, screenType: 'unknown' },
          })
          if (settingData.resultOverlay) {
            overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
              message:
                '게임 결과창이 아니거나 성과 기록 이미지를 처리 중에 오류가 발생하였습니다. 다시 시도해주시길 바랍니다.',
              color: 'tw-bg-red-600',
            })
          }
        }
      } catch (error) {
        mainWindow.webContents.send('screenshot-uploaded', {
          playData: { isVerified: false, screenType: 'unknown' },
        })
        if (settingData.resultOverlay) {
          overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
            message:
              '게임 결과창이 아니거나 성과 기록 이미지를 처리 중에 오류가 발생하였습니다. 다시 시도해주시길 바랍니다.',
            color: 'tw-bg-red-600',
          })
        }
        console.error('Error processing capture:', error)
        logMainError(error, isLogined ? userData : null)
        isProcessing = false
      }
    } else {
      console.log('Full Screen Image Detected.')
      try {
        isProcessing = true
        const data = await processResultScreen(
          image,
          { isMenualUpload: true, isNotSaveImage: true, gameCode },
          { app, settingData, mainWindow, overlayWindow, isProd, isLogined, isUploaded },
          userData,
        )
        isProcessing = false
        if (
          data?.playData !== null &&
          (data?.playData?.isVerified !== undefined ||
            data?.playData?.screenType == 'versus' ||
            data?.playData?.screenType == 'collection')
        ) {
          mainWindow.webContents.send('screenshot-uploaded', data?.playData)
        } else {
          mainWindow.webContents.send('screenshot-uploaded', {
            playData: { isVerified: false, screenType: 'unknown' },
          })
          if (settingData.resultOverlay) {
            overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
              message:
                '게임 결과창이 아니거나 성과 기록 이미지를 처리 중에 오류가 발생하였습니다. 다시 시도해주시길 바랍니다.',
              color: 'tw-bg-red-600',
            })
          }
        }
      } catch (error) {
        mainWindow.webContents.send('screenshot-uploaded', {
          playData: { isVerified: false, screenType: 'unknown' },
        })
        if (settingData.resultOverlay) {
          overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
            message:
              '게임 결과창이 아니거나 성과 기록 이미지를 처리 중에 오류가 발생하였습니다. 다시 시도해주시길 바랍니다.',
            color: 'tw-bg-red-600',
          })
        }
        console.error('Error processing capture:', error)
        logMainError(error, isLogined ? userData : null)
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
        mainWindow.webContents.send('isDetectedGame', {
          status: true,
          game: isRunning ? 'DJMAX RESPECT V' : 'WJMAX',
        })

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
            logMainError(error, isLogined ? userData : null)
            isProcessing = false
            return
          }

          const isGameFocused =
            (focusedWindow === 'DJMAX RESPECT V' && isRunning) ||
            (focusedWindow === 'WJMAX' && isRunningWjmax)

          if (isGameFocused || !settingData.captureOnlyFocused) {
            if (!isProcessing) {
              try {
                isProcessing = true
                console.log(
                  'Powershell isGameFocused Result : Game is focused. Capturing...',
                  `(${focusedWindow})`,
                )

                const gameSource = await captureScreen(isRunning ? 'djmax_respect_v' : 'wjmax')
                if (!gameSource) {
                  console.error('Failed to capture game screen')
                  isProcessing = false
                  return
                }

                const data = await processResultScreen(
                  gameSource,
                  {
                    isMenualUpload: false,
                    isNotSaveImage: false,
                    gameCode: isRunning ? 'djmax_respect_v' : 'wjmax',
                  },
                  { app, settingData, mainWindow, overlayWindow, isProd, isLogined, isUploaded },
                  userData,
                )
                isProcessing = false
                if (
                  data?.playData &&
                  (data.playData.isVerified !== null ||
                    data.playData.screenType == 'versus' ||
                    data.playData.screenType == 'collection')
                ) {
                  mainWindow.webContents.send('screenshot-uploaded', {
                    ...data.playData,
                    filePath: data.filePath,
                  })
                }
                if (data?.isUploaded != null || data?.playData?.isUploaded != null) {
                  isUploaded = data.isUploaded || data.playData.isUploaded
                }
              } catch (error) {
                console.error('Error in capture and process:', error)
                logMainError(error, isLogined ? userData : null)
                isProcessing = false
              }
            } else {
              console.log('startCapturing : isProcessing is true. Skipping...')
            }
          } else {
            console.log(
              'Powershell isGameFocused Result : Game is not focused. Skipping...',
              `(${focusedWindow})`,
            )
          }
        }
      } catch (error) {
        console.error('Error in captureAndProcess:', error)
        logMainError(error, isLogined ? userData : null)
        isProcessing = false
      } finally {
        try {
          clearTimeout(settingData.autoCaptureIntervalId)
          settingData.autoCaptureIntervalId = setTimeout(
            captureAndProcess,
            [1000, 2000, 3000, 5000, 10000].includes(settingData.autoCaptureIntervalTime)
              ? settingData.autoCaptureIntervalTime
              : 3000,
          )
        } catch (error) {
          console.error('Error setting next capture interval:', error)
          logMainError(error, isLogined ? userData : null)
          isProcessing = false
        }
      }
    }

    captureAndProcess()
  }
  const pressAltInsert = async () => {
    try {
      console.log('Pressed Alt+Insert Key')
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

          const data = await processResultScreen(
            gameSource,
            {
              isMenualUpload: true,
              isNotSaveImage: false,
              gameCode: isRunning ? 'djmax_respect_v' : 'wjmax',
            },
            { app, settingData, mainWindow, overlayWindow, isProd, isLogined, isUploaded },
            userData,
          )
          isProcessing = false
          if (
            data !== null &&
            data !== undefined &&
            data !== '' &&
            data?.playData &&
            (data?.playData?.isVerified !== undefined ||
              data?.playData?.screenType == 'versus' ||
              data?.playData?.screenType == 'collection')
          ) {
            mainWindow.webContents.send('screenshot-uploaded', {
              ...data?.playData,
              filePath: data?.filePath,
            })
          } else {
            mainWindow.webContents.send('screenshot-uploaded', {
              playData: { isVerified: false, screenType: 'unknown' },
            })
            if (settingData.resultOverlay) {
              overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
                message:
                  '게임 결과창이 아니거나 성과 기록 이미지를 처리 중에 오류가 발생하였습니다. 다시 시도해주시길 바랍니다.',
                color: 'tw-bg-red-600',
              })
            }
          }
        } catch (error) {
          isProcessing = false
          mainWindow.webContents.send('screenshot-uploaded', {
            playData: { isVerified: false, screenType: 'unknown' },
          })
          if (settingData.resultOverlay) {
            overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
              message:
                '게임 결과창이 아니거나 성과 기록 이미지를 처리 중에 오류가 발생하였습니다. 다시 시도해주시길 바랍니다.',
              color: 'tw-bg-red-600',
            })
          }
          console.error('Error processing capture:', error)
          logMainError(error, isLogined ? userData : null)
        }
      }
    } catch (error) {
      isProcessing = false
      mainWindow.webContents.send('screenshot-uploaded', {
        playData: { isVerified: false, screenType: 'unknown' },
      })
      if (settingData.resultOverlay) {
        overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
          message:
            '게임 결과창이 아니거나 성과 기록 이미지를 처리 중에 오류가 발생하였습니다. 다시 시도해주시길 바랍니다.',
          color: 'tw-bg-red-600',
        })
      }
      console.error('Error processing capture:', error)
      logMainError(error, isLogined ? userData : null)
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

          if (
            ![
              640, 720, 800, 1024, 1128, 1280, 1366, 1600, 1680, 1760, 1920, 2048, 2288, 2560, 3072,
              3200, 3840, 5120,
            ].includes(window.width)
          ) {
            try {
              const image = window.captureImageSync()
              const pngImage = await sharp(image.toPngSync()).toBuffer()
              const metadata = await sharp(pngImage).metadata()

              // 이미지의 실제 컨텐츠 영역을 찾기 위한 분석
              const { data, info } = await sharp(pngImage)
                .raw()
                .toBuffer({ resolveWithObject: true })

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
                logMainError(error, isLogined ? userData : null)
                isProcessing = false
                return null
              }
            } catch (error) {
              console.error('Error capturing or processing initial image:', error)
              logMainError(error, isLogined ? userData : null)
              isProcessing = false
              return null
            }
          } else {
            try {
              return await sharp(window.captureImageSync().toPngSync())
                .resize(1920, 1080)
                .toBuffer()
            } catch (error) {
              console.error('Error capturing fullscreen image:', error)
              logMainError(error, isLogined ? userData : null)
              isProcessing = false
              return null
            }
          }
        } catch (error) {
          console.error('Error processing window capture:', error)
          logMainError(error, isLogined ? userData : null)
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
    logMainError(error, isLogined ? userData : null)
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
    logMainError(error, isLogined ? userData : null)
    return ''
  } finally {
    if (worker) {
      try {
        await worker.terminate()
      } catch (error) {
        console.error('Error terminating Tesseract worker:', error)
        logMainError(error, isLogined ? userData : null)
      }
    }
  }
}

app.on('will-quit', () => {
  clearInterval(settingData.autoCaptureIntervalId) // Clear the interval when the app is about to quit
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
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
  app.isQuitting = true

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

  // 트레이 아이콘 정리
  if (tray) {
    tray.destroy()
    tray = null
  }

  // 혹시 남아있는 서버 정리
  const connections = require('net')
    .createServer()
    .getConnections((err, count) => {
      if (count > 0) {
        console.log(`Cleaning up ${count} remaining connections...`)
      }
    })
})
