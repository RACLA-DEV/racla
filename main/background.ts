import path from 'path'
import fs from 'fs'
import { app, ipcMain, session, shell, desktopCapturer } from 'electron'
import serve from 'electron-serve'
import { createWindow } from './helpers'
import { clearSession, getSession, getSettingData, getSongData, storeSession, storeSettingData, storeSongData } from './fsManager'
import { autoUpdater } from 'electron-updater'
const sharp = require('sharp')
const Tesseract = require('tesseract.js')

let intervalId
let gameSource = null // Variable to hold the identified game window source

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

;(async () => {
  await app.whenReady()
  await cacheImagesFromFolder(path.join(__dirname, '/../resources/images/jackets'))

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

  startCapturing()
})()

let imageCache = [] // 캐시된 이미지들을 저장할 배열

// 앱 부팅 시 모든 이미지를 메모리에 캐시
async function cacheImagesFromFolder(folderPath) {
  const files = fs.readdirSync(folderPath)
  imageCache = await Promise.all(
    files
      .filter((file) => path.extname(file).toLowerCase() === '.jpg')
      .map(async (file) => {
        const filePath = path.join(folderPath, file)
        const buffer = fs.readFileSync(filePath)
        return { filePath, buffer }
      }),
  )
}

let isResult = false

app.on('will-quit', () => {
  clearInterval(intervalId) // Clear the interval when the app is about to quit
})

function startCapturing() {
  const captureAndProcess = async () => {
    try {
      gameSource = await captureScreen()

      if (gameSource) {
        isResult = await checkIsReuslt(gameSource)

        if (isResult) {
          await processAndCapture(gameSource)
        }
      } else {
        console.log('Game window not detected.')
      }
    } catch (error) {
      console.error('Error during capture:', error)
    } finally {
      // 작업이 완료된 후 1초 후에 다음 작업 예약
      setTimeout(captureAndProcess, isResult ? 500 : 3000)
    }
  }

  captureAndProcess() // 초기 호출
}

async function captureScreen() {
  try {
    const sources = await desktopCapturer.getSources({ types: ['window'], thumbnailSize: { width: 1920, height: 1080 } })

    for (const source of sources) {
      if (source.name.includes('DJMAX RESPECT V')) {
        return source
      }
    }

    return null
  } catch (error) {}
}

// OCR 작업을 위한 영역 및 설정 정의
const ocrRegions = {
  button: { width: 66, height: 120, left: 70, top: 0, grayscale: true, linear: [1.5, 0] },
  pattern: { width: 92, height: 20, left: 711, top: 85, grayscale: true, linear: [1.5, 0] },
  score: { width: 428, height: 128, left: 752, top: 672, grayscale: false, linear: null },
  speed: { width: 70, height: 52, left: 105, top: 725, grayscale: false, linear: null },
  breakCount: { width: 67, height: 21, left: 354, top: 615, grayscale: true, linear: [1.5, 0] },
}

// 텍스트 정규화 함수 (중복 제거)
const normalizeText = (text) => String(text).replaceAll('|', '').replaceAll('\n', ' ').replaceAll('\\n', ' ').trim()

// 숫자만 추출하는 함수
const extractNumber = (text) => parseInt(normalizeText(text)) || 0

// OCR 실행 함수
async function recognizeText(imageBuffer, lang = 'eng') {
  const worker = await Tesseract.createWorker(lang)

  const {
    data: { text },
  } = await worker.recognize(imageBuffer)
  await worker.terminate()
  return normalizeText(text)
}

// 이미지 처리 및 OCR 함수 (Promise.all 적용)
async function processImageAndOCR(imageBuffer) {
  const promises = Object.entries(ocrRegions).map(async ([key, region]) => {
    const { width, height, left, top, grayscale, linear } = region
    let processedBuffer = sharp(imageBuffer).extract({ width, height, left, top })
    if (grayscale) processedBuffer = processedBuffer.grayscale()
    if (linear) processedBuffer = processedBuffer.linear(...linear)
    const buffer = await processedBuffer.toBuffer()
    const text = await (['button', 'score', 'speed'].includes(key) ? recognizeTextOnlyNumber(buffer) : recognizeText(buffer, key === 'nameKor' ? 'kor' : 'eng'))
    return { [key]: text }
  })

  const results = await Promise.all(promises)
  return Object.assign({}, ...results) // 객체 병합
}

async function checkIsReuslt(source) {
  try {
    const imageBuffer = await source.thumbnail.toPNG()

    let processedBuffer = await sharp(imageBuffer).extract({ width: 230, height: 24, left: 100, top: 236 }).grayscale().linear(1.5, 0).toBuffer()

    const text = await recognizeText(processedBuffer, 'eng')

    console.log(
      'Section(isResultScreen) KeyWord :',
      text.toUpperCase().trim(),
      '/ isResultScreen:',
      ['JUDGEMENT DETAILS', 'JUDGEMENT', 'DETAILS', 'JUDGE', 'DETAIL'].includes(text.toUpperCase().trim()),
    )

    return ['JUDGEMENT DETAILS', 'JUDGEMENT', 'DETAILS', 'JUDGE', 'DETAIL'].includes(text.toUpperCase().trim())
  } catch (error) {}
}

async function processAndCapture(source) {
  try {
    const imageBuffer = await source.thumbnail.toPNG()
    const ocrResult = await processImageAndOCR(imageBuffer)
    const { button, pattern, score, speed, ...judgement } = ocrResult

    const SongData: any[] = await getSongData()

    const title = await findJacketToTitleId(gameSource)

    if (!title) {
      console.log('Jackets Images not detected.')
      return
    }

    const SongDataFiltered = SongData.map((songItem) => ({
      title: songItem.title,
      name: songItem.name,
      composer: songItem.composer,
      dlcCode: songItem.dlcCode,
      dlc: songItem.dlc,
    })).filter((SongItem) => SongItem.title === Number(title))

    const resizeScore = () => {
      return score.length === 7 && score.replaceAll('\n', '').replaceAll('\\', '').startsWith('90')
        ? score.replaceAll('\n', '').replaceAll('\\', '').replace('90', '9')
        : score.replaceAll('\n', '').replaceAll('\\', '')
    }

    const normalizedScore =
      resizeScore().length === 6
        ? resizeScore().startsWith('00')
          ? resizeScore().replace('00', '99')
          : resizeScore().startsWith('0')
          ? resizeScore().replace('0', '9')
          : resizeScore()
        : null

    console.log({
      ocrUnStableData: {
        originalScore: String(score).replaceAll('\n', '').replaceAll('\\', ''),
      },
      playData: {
        button: button.replaceAll('\n', '').replaceAll('\\', ''),
        pattern: String(pattern).toUpperCase(),
        score: normalizedScore,
        acc: normalizedScore !== null ? normalizedScore.substring(0, 2) + '.' + normalizedScore.substring(2, 4) : null,
        maxCombo: !isNaN(Number(judgement.breakCount)) && Number(judgement.breakCount) === 0,
        speed:
          speed.replaceAll('\n', '').replaceAll('\\', '').length === 2
            ? speed.replaceAll('\n', '').replaceAll('\\', '').substring(0, 1) + '.' + speed.replaceAll('\n', '').replaceAll('\\', '').substring(1, 2)
            : null,
      },
      songData: SongDataFiltered.length > 0 ? SongDataFiltered[0] : null,
    })
  } catch (error) {
    console.error('Error processing capture:', error)
  }
}

async function recognizeTextOnlyNumber(imageBuffer) {
  const worker = await Tesseract.createWorker('eng')

  const workingNumber = async () => {
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789',
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

async function compareImages(image1Buffer, image2Buffer) {
  const [image1, image2] = await Promise.all([sharp(image1Buffer).toBuffer(), sharp(image2Buffer).resize(60, 60).toBuffer()])

  const { data: data1 } = await sharp(image1).raw().toBuffer({ resolveWithObject: true })
  const { data: data2 } = await sharp(image2).raw().toBuffer({ resolveWithObject: true })

  let diff = 0
  for (let i = 0; i < data1.length; i++) {
    diff += Math.abs(data1[i] - data2[i])
  }

  diff /= data1.length
  return diff
}

async function findMostSimilarImage(capturedImageBuffer) {
  try {
    let mostSimilarImage = null
    let minDiff = Infinity

    for (const { filePath, buffer } of imageCache) {
      const diff = await compareImages(capturedImageBuffer, buffer)
      if (diff < minDiff) {
        minDiff = diff
        mostSimilarImage = String(filePath).split('\\').pop()
      }
    }

    return mostSimilarImage.replaceAll('.jpg', '')
  } catch (error) {
    console.error('Error finding most similar image:', error)
    return null
  }
}

async function findJacketToTitleId(source) {
  try {
    const imageBuffer = await source.thumbnail.toPNG()

    let processedBuffer = await sharp(imageBuffer).extract({ width: 60, height: 60, left: 708, top: 14 }).toBuffer()

    return await findMostSimilarImage(processedBuffer)
  } catch (error) {}
}

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
