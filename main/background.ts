import path from 'path'
import { app, ipcMain, ipcRenderer, shell } from 'electron'
import serve from 'electron-serve'
import { createWindow } from './helpers'
import { clearSession, getSession, getSongData, storeSession, storeSongData } from './sessionManager'

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

;(async () => {
  await app.whenReady()

  const mainWindow = createWindow('main', {
    width: 1600,
    height: 900,
    minWidth: 1600,
    minHeight: 900,
    frame: false,
    center: true,
    icon: path.join(__dirname + '/../resources/', 'icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      devTools: true,
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
  ipcMain.handle('login', async (event, { userNo, userToken }) => {
    try {
      storeSession({ userNo, userToken })
      mainWindow.webContents.send('IPC_RENDERER_IS_LOGINED', true)
      return { success: true }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  // 로그아웃 요청 처리
  ipcMain.handle('logout', () => {
    clearSession()
    return { success: true }
  })

  // 세션 정보 요청 처리
  ipcMain.handle('get-session', () => {
    const session = getSession()
    return session ? session : null
  })

  // 곡 데이터 저장 처리
  ipcMain.handle('putSongData', async (event, songData) => {
    try {
      storeSongData(songData)
      mainWindow.webContents.send('IPC_RENDERER_IS_LOADED_SONG_DATA', true)
      return { success: true }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  // 세션 정보 요청 처리
  ipcMain.handle('getSongData', () => {
    const songData = getSongData()
    return songData ? songData : null
  })

  ipcMain.on('openBrowser', (event, url) => {
    event.preventDefault()
    shell.openExternal(url)
  })

  if (getSession() === undefined || getSession() === null) {
    storeSession({ userNo: '', userToken: '' })
  }

  if (getSongData() === undefined || getSongData() === null) {
    storeSongData([{}])
  }
})()

app.on('window-all-closed', () => {
  app.quit()
})

ipcMain.on('message', async (event, arg) => {
  event.reply('message', `${arg} World!`)
})
