import path from 'path'
import { app, dialog, ipcMain, ipcRenderer, session, shell } from 'electron'
import serve from 'electron-serve'
import { createWindow } from './helpers'
import { clearSession, getSession, getSettingData, getSongData, storeSession, storeSettingData, storeSongData } from './fsManager'
import { autoUpdater } from 'electron-updater'

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

;(async () => {
  await app.whenReady()

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

  if (isProd) {
    await mainWindow.loadURL('app://./')
  } else {
    const port = process.argv[2]
    await mainWindow.loadURL(`http://localhost:${port}/`)
    mainWindow.webContents.openDevTools()
  }

  // 창 닫기 버튼 감지
  ipcMain.on('closeApp', () => {
    mainWindow.close()
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
  ipcMain.on('login', async (event, { userNo, userToken }) => {
    try {
      storeSession({ userNo, userToken })
      mainWindow.webContents.send('IPC_RENDERER_IS_LOGINED', true)
    } catch (e) {
      mainWindow.webContents.send('IPC_RENDERER_IS_LOGINED', false)
    }
  })

  // 로그아웃 요청 처리
  ipcMain.on('logout', async (event) => {
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
    shell.openExternal(url)
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

  if (getSession() === undefined || getSession() === null) {
    storeSession({ userNo: '', userToken: '' })
  }

  if (getSongData() === undefined || getSongData() === null) {
    storeSongData([{}])
  }

  if (getSettingData() === undefined || getSettingData() === null) {
    storeSettingData({ hardwareAcceleration: true, homeButtonAlignRight: false })
  }

  // 자동 업데이트 체크
  autoUpdater.checkForUpdatesAndNotify()

  // 업데이트 가용 시 버전 정보를 렌더러 프로세스로 전송
  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('update-available', info.version)
  })

  // 다운로드 진행 상황을 렌더러 프로세스로 전송
  autoUpdater.on('download-progress', (progress) => {
    mainWindow.webContents.send('download-progress', {
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total,
    })
  })

  // 업데이트 다운로드 완료 시 렌더러 프로세스로 이벤트 전송
  autoUpdater.on('update-downloaded', (info) => {
    mainWindow.webContents.send('update-downloaded', info.version)
  })
})()

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

// 업데이트 테스트 용
// Object.defineProperty(app, 'isPackaged', {
//   get() {
//     return true
//   },
// })
