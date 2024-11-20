import path from 'path'
import fs from 'fs'
import { app, desktopCapturer, ipcMain, session, shell } from 'electron'
import serve from 'electron-serve'
import { createWindow } from './helpers'
import { clearSession, getSession, getSettingData, getSongData, storeSession, storeSettingData, storeSongData } from './fsManager'
import { autoUpdater } from 'electron-updater'
import sharp from 'sharp'
import Tesseract from 'tesseract.js'
import moment from 'moment'
import screenshotDesktop from 'screenshot-desktop'
import { Window } from 'node-screenshots'
import { exec } from 'child_process'
import 'moment/locale/ko'
import FormData from 'form-data'
import axios from 'axios'
import { randomUUID } from 'crypto'
const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

const baseDir = !isProd ? path.join(__dirname, '/../') : app.getAppPath().replace('app.asar', '')

let djmaxRespectVJacketCacheData = []
let djmaxRespectVEffectorCache = []

let autoCaptureMode = false
let autoCaptureIntervalId
let autoCaptureApi = 'eapi'
let autoCaptureIntervalTime = 3000
let lastAutoCaptureResultData = null
let isSendedAutoCapture = false
let isLogined = false
let displayName = ''
let isLoaded = false
let isUploaded = false
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
      // devTools: !isProd,
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

  ipcMain.on('getSettingData', async (event) => {
    const settingData = await getSettingData()
    mainWindow.webContents.send('IPC_RENDERER_GET_SETTING_DATA', settingData ? { ...settingData } : null)
  })

  ipcMain.on('getDisplayList', async () => {
    const displays = await screenshotDesktop.listDisplays()
    mainWindow.webContents.send('getDisplayListResponse', displays)
  })

  ipcMain.on('changeSettingData', async (event, data) => {
    const settingData = await getSettingData()
    storeSettingData({ ...settingData, ...data })
  })

  ipcMain.on('changeAutoCaptureMode', async (event, data) => {
    autoCaptureMode = data.autoCaptureMode
    const settingData = await getSettingData()
    storeSettingData({ ...settingData, ...data })
  })

  ipcMain.on('changeAutoCaptureMode', async (event, data) => {
    autoCaptureMode = data.autoCaptureMode
    const settingData = await getSettingData()
    storeSettingData({ ...settingData, ...data })
  })

  ipcMain.on('changeAutoCaptureApi', async (event, data) => {
    autoCaptureApi = data.autoCaptureApi
    const settingData = await getSettingData()
    storeSettingData({ ...settingData, ...data })
  })

  ipcMain.on('changeAutoCaptureIntervalTime', async (event, data) => {
    autoCaptureIntervalTime = data.autoCaptureIntervalTime
    const settingData = await getSettingData()
    storeSettingData({ ...settingData, ...data })
  })

  ipcMain.on('changeDisplay', async (event, data) => {
    displayName = data.displayName
    const settingData = await getSettingData()
    storeSettingData({ ...settingData, ...data })
  })

  // 자동 업데이트 체크
  ipcMain.on('PROGRAM_LOADED', () => {
    if (!isLoaded) {
      autoUpdater.checkForUpdatesAndNotify()
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

  async function processAndCapture(source, isUpload?) {
    try {
      const imageBuffer = isUpload ? source : await captureScreen()

      let processedBuffer = await sharp(imageBuffer).extract({ width: 230, height: 24, left: 100, top: 236 }).grayscale().linear(1.5, 0).toBuffer()

      const text = await recognizeText(processedBuffer, 'eng')

      const isResult = ['JUDGEMENT', 'DETAILS', 'DETAIL', 'JUDGE', 'JUDGEMENT DETAILS'].filter((value) => {
        return text.toUpperCase().trim().includes(value) && text.length !== 0
      })

      console.log('Section(isResultScreen) KeyWord :', text.toUpperCase().trim(), '/ isResultScreen:', isResult.length >= 1)

      if (isResult.length >= 1 && !isUploaded) {
        console.log('Result Screen Detected: Processing image data...')

        // 서버 사이드 OCR
        try {
          const serverOcrStartTime = Date.now()

          const formData = new FormData()
          formData.append('file', imageBuffer, {
            filename: randomUUID() + '.png',
            contentType: 'image/png',
          })

          const response = await axios.post('http://luna.koreacentral.cloudapp.azure.com:8080/api/v1/ocr/upload', formData, {
            headers: {
              ...formData.getHeaders(),
              // 'Authorization': 'Bearer your-token-here'
            },
          })

          console.log('서버 사이드 OCR 요청 처리 시간:', Date.now() - serverOcrStartTime, 'ms')
          console.log('서버 사이드 OCR 요청 결과:', response.data)
        } catch (error) {
          console.error('서버 사이드 OCR 요청 실패:', error)
        }

        if (!isSendedAutoCapture && !isUpload) {
          mainWindow.webContents.send('isDetectedResultScreen', moment().utcOffset(9).format('YYYY-MM-DD-HH-mm-ss'))
        }

        const clientOcrStartTime = Date.now()
        const ocrResult = await processImageAndOCR(imageBuffer)

        const { button, pattern, score, speed, ...judgement } = ocrResult

        const SongData: any[] = await getSongData()

        const title = await findJacketToTitleId(isUpload ? source : source, isUpload)
        const note = await findNote(isUpload ? source : source, isUpload)
        const fader = await findFader(isUpload ? source : source, isUpload)
        const chaos = await findChaos(isUpload ? source : source, isUpload)

        if (!title) {
          console.log('Error processing capture: Result Screen Jacket Image not Detected.')
          return {
            playData: {
              isVerified: false,
              error: '수록곡 이미지(자켓) 인식에 실패하였습니다.',
            },
          }
        }

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

        const isVerified =
          // String(score).replaceAll('\n', '').replaceAll('\\', '') === normalizedScore &&
          normalizedScore !== null &&
          normalizedScore.length === 6 &&
          [4, 5, 6, 8].includes(Number(button.replaceAll('\n', '').replaceAll('\\', ''))) &&
          ['NORMAL', 'NM', 'HARD', 'HD', 'MAXIMUM', 'MX', 'SC'].includes(
            String(pattern).toUpperCase().replaceAll(' ', '').replaceAll('-', '').replaceAll('.', '').replaceAll(',', ''),
          )

        // 수동 업로드 시 예외 처리
        if (isUpload) {
          isSendedAutoCapture = false
          isUploaded = false
        }

        const data = {
          playData: {
            isVerified,
            button: Number(button.replaceAll('\n', '').replaceAll('\\', '')),
            pattern: String(pattern).toUpperCase(),
            score: normalizedScore !== null ? parseFloat(normalizedScore.substring(0, 2) + '.' + normalizedScore.substring(2, 4)) : null,
            normalizedScore: normalizedScore,
            maxCombo:
              !isNaN(Number(judgement.breakCount.replaceAll('\n', '').replaceAll('\\', ''))) &&
              Number(judgement.breakCount.replaceAll('\n', '').replaceAll('\\', '')) === 0
                ? Number(1)
                : Number(0),
            speed:
              speed.replaceAll('\n', '').replaceAll('\\', '').length === 2
                ? parseFloat(
                    speed.replaceAll('\n', '').replaceAll('\\', '').substring(0, 1) + '.' + speed.replaceAll('\n', '').replaceAll('\\', '').substring(1, 2),
                  )
                : null,
            note: String(note).includes('BLANK') ? null : String(note),
            fader: String(fader).includes('BLANK') ? null : String(fader),
            chaos: String(chaos).includes('BLANK') ? null : String(chaos),
            songData: SongData[Number(title)],
          },
        }

        console.log('클라이언트 사이드 OCR 처리 소요 시간:', Date.now() - clientOcrStartTime, 'ms')
        console.log('클라이언트 사이드 OCR 처리 결과: ', data)

        if (isVerified && !isSendedAutoCapture && data !== lastAutoCaptureResultData) {
          isSendedAutoCapture = true

          if (!isUpload) {
            lastAutoCaptureResultData = data
          }

          if (!isUpload) {
            const filePath = path.join(
              app.getPath('pictures'),
              'PROJECT-RA',
              String(SongData[Number(title)].name).replaceAll(':', '-') +
                '-' +
                parseFloat(normalizedScore.substring(0, 2) + '.' + normalizedScore.substring(2, 4)) +
                '-' +
                moment().utcOffset(9).format('YYYY-MM-DD-HH-mm-ss') +
                '.png',
            )

            fs.writeFile(filePath, Buffer.from(imageBuffer), (err) => {
              if (err) {
                console.error('Failed to save file:', err)
              } else {
                console.log('File saved to', filePath)
              }
            })
          }

          isUploaded = true
          return data
        } else {
          if (isSendedAutoCapture) {
            console.log('Result Screen Processed Result : Already Uploaded Data(Auto)')
            return {
              playData: {
                isVerified: null,
                error: '이미 자동 업로드된 성과 기록입니다.',
              },
            }
          } else {
            if (isUpload) {
              console.log('Result Screen Processed Result : Data Verify Failed(Menual)')
              return {
                playData: {
                  isVerified: false,
                  error: '성과 기록 유효성 검증에 실패하였습니다. 게임 화면을 다시 캡쳐한 후 업로드해주세요.',
                },
              }
            } else {
              console.log('Result Screen Processed Result : Data Verify Failed(Auto)')
              isSendedAutoCapture = false
              return {
                playData: {
                  isVerified: false,
                },
              }
            }
          }
        }
      } else {
        console.log('Waiting for Result Screen...')
        isSendedAutoCapture = false
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

  ipcMain.on('captureTest', async (event, data) => {
    const imageBuffer = await captureScreen()

    console.log(imageBuffer)

    const filePath = path.join(app.getPath('pictures'), 'PROJECT-RA', '화면 캡쳐-' + moment().utcOffset(9).format('YYYY-MM-DD-HH-mm-ss-SSS') + '.png')

    fs.writeFile(filePath, Buffer.from(imageBuffer), (err) => {
      if (err) {
        console.error('Failed to save file:', err)
      } else {
        console.log('File saved to', filePath)
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

      const { playData } = await processAndCapture(croppedBuffer, true)
      if (playData !== null && playData.isVerified !== undefined) {
        mainWindow.webContents.send('screenshot-uploaded', playData)
      }
    } else {
      console.log('Full Screen Image Detected.')
      const { playData } = await processAndCapture(image, true)
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

        if (isLogined && autoCaptureMode) {
          const gameSource = await captureScreen()
          const data = await processAndCapture(gameSource) // gameSource를 버퍼로 전달
          if (data !== null && data !== undefined && data.playData && data.playData.isVerified !== null) {
            mainWindow.webContents.send('screenshot-uploaded', data.playData)
          }
        }
      } catch (error) {
        console.error('Error processing capture:', error)
      } finally {
        // 작업이 완료된 후 2초 후에 다음 작업 예약
        clearTimeout(autoCaptureIntervalId)
        autoCaptureIntervalId = setTimeout(
          captureAndProcess,
          [1000, 2000, 3000, 5000, 10000].includes(autoCaptureIntervalTime) ? autoCaptureIntervalTime : 3000,
        )
      }
    }

    captureAndProcess() // 초기 호출
  }

  startCapturing()

  // 앱 부팅 시 모든 이미지를 메모리에 캐시
  async function cacheImagesFromFolder(folderPath) {
    const files = fs.readdirSync(folderPath)
    djmaxRespectVJacketCacheData = await Promise.all(
      files
        .filter((file) => path.extname(file).toLowerCase() === '.jpg')
        .map(async (file) => {
          const filePath = path.join(folderPath, file)
          const buffer = fs.readFileSync(filePath)
          return { filePath, buffer }
        }),
    )
    return true
  }

  async function cacheImagesFromFolderEffector(folderPath) {
    const files = fs.readdirSync(folderPath)
    djmaxRespectVEffectorCache = await Promise.all(
      files
        .filter((file) => path.extname(file).toLowerCase() === '.jpg')
        .map(async (file) => {
          const filePath = path.join(folderPath, file)
          const buffer = fs.readFileSync(filePath)
          return { filePath, buffer }
        }),
    )
    return true
  }

  ipcMain.on('startCache', async (event, name) => {
    console.log('Started Cache Data.')
    const cache1 = await cacheImagesFromFolder(path.join(baseDir, 'images/jackets'))
    const cache2 = await cacheImagesFromFolderEffector(path.join(baseDir, 'images/effectors'))

    console.log('Started Load Setting Data')
    const settingData = await getSettingData()
    console.log(settingData)
    autoCaptureMode = settingData.autoCaptureMode
    autoCaptureApi = settingData.autoCaptureApi
    autoCaptureIntervalTime = settingData.autoCaptureIntervalTime
    displayName = 'eapi'
    console.log('Setting Data Loaded.')

    // console.log('Started Analyze Display')
    // const displays = await screenshotDesktop.listDisplays()

    // if (displays.filter((value) => value.id === displayName).length === 0) {
    //   displayName = displays[0].id
    //   storeSettingData({ ...settingData, displayName })
    // }
    // console.log('Display Analyzed.')

    if (cache1 && cache2 && settingData) {
      console.log('Finished Cache Data.')
      mainWindow.webContents.send('cacheResponse', true)
    } else {
      console.log('Image Cached Failed.')
    }
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

    for (const { filePath, buffer } of djmaxRespectVJacketCacheData) {
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

async function compareImagesEffector(image1Buffer, image2Buffer) {
  const [image1, image2] = await Promise.all([sharp(image1Buffer).toBuffer(), sharp(image2Buffer).toBuffer()])

  const { data: data1 } = await sharp(image1).raw().toBuffer({ resolveWithObject: true })
  const { data: data2 } = await sharp(image2).raw().toBuffer({ resolveWithObject: true })

  let diff = 0
  for (let i = 0; i < data1.length; i++) {
    diff += Math.abs(data1[i] - data2[i])
  }

  diff /= data1.length
  return diff
}

async function findMostSimilarImageEffector(capturedImageBuffer) {
  try {
    let mostSimilarImage = null
    let minDiff = Infinity

    for (const { filePath, buffer } of djmaxRespectVEffectorCache) {
      const diff = await compareImagesEffector(capturedImageBuffer, buffer)
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

async function findJacketToTitleId(source, isUpload?) {
  try {
    const imageBuffer = isUpload
      ? await sharp(Buffer.from(new Uint8Array(source)))
          .toFormat('jpg')
          .toBuffer()
      : await sharp(source).toFormat('jpg').toBuffer()

    let processedBuffer = await sharp(imageBuffer).extract({ width: 60, height: 60, left: 705, top: 14 }).toBuffer()

    return await findMostSimilarImage(processedBuffer)
  } catch (error) {
    console.log('Error finding most similar image:', error)
  }
}

async function findNote(source, isUpload?) {
  try {
    const imageBuffer = isUpload
      ? await sharp(Buffer.from(new Uint8Array(source)))
          .toFormat('jpg')
          .toBuffer()
      : await sharp(source).toFormat('jpg').toBuffer()

    let processedBuffer = await sharp(imageBuffer).extract({ width: 70, height: 70, left: 184, top: 707 }).toBuffer()

    return await findMostSimilarImageEffector(processedBuffer)
  } catch (error) {}
}

async function findFader(source, isUpload?) {
  try {
    const imageBuffer = isUpload
      ? await sharp(Buffer.from(new Uint8Array(source)))
          .toFormat('jpg')
          .toBuffer()
      : await sharp(source).toFormat('jpg').toBuffer()

    let processedBuffer = await sharp(imageBuffer).extract({ width: 70, height: 70, left: 266, top: 707 }).toBuffer()

    return await findMostSimilarImageEffector(processedBuffer)
  } catch (error) {}
}

async function findChaos(source, isUpload?) {
  try {
    const imageBuffer = isUpload
      ? await sharp(Buffer.from(new Uint8Array(source)))
          .toFormat('jpg')
          .toBuffer()
      : await sharp(source).toFormat('jpg').toBuffer()

    let processedBuffer = await sharp(imageBuffer).extract({ width: 70, height: 70, left: 348, top: 707 }).toBuffer()

    return await findMostSimilarImageEffector(processedBuffer)
  } catch (error) {}
}

async function captureScreen() {
  try {
    if (['napi', 'eapi', 'xcap-api'].includes(autoCaptureApi)) {
      console.log('Game Window Captured')

      if (autoCaptureApi === 'xcap-api') {
        const windows = Window.all().filter((value) => value.title.includes('DJMAX RESPECT V'))

        // forEach 대신 find나 map을 사용하여 첫 번째 찾은 창의 이미지를 반환
        if (windows.length > 0) {
          const window = windows[0]

          if (![640, 720, 800, 1024, 1128, 1280, 1366, 1600, 1680, 1760, 1920, 2048, 2288, 2560, 3072, 3200, 3840, 5120].includes(window.width)) {
            const image = window.captureImageSync()
            const sharpedImage = await sharp(image.toPngSync()).resize(1920).toBuffer()

            const extractedImage = await sharp(sharpedImage).extract({ left: 10, top: 44, width: 1900, height: 1068 }).resize(1920, 1080).toBuffer()

            return extractedImage
          } else {
            return await sharp(window.captureImageSync().toPngSync()).resize(1920, 1080).toBuffer()
          }
        }
        return null
      } else if (autoCaptureApi === 'eapi') {
        const screenshot = (await desktopCapturer.getSources({ types: ['window'], thumbnailSize: { width: 1920, height: 1080 } })).filter((value) =>
          value.name.includes('DJMAX RESPECT V'),
        )

        console.log(screenshot[0].thumbnail.getSize())

        if (screenshot.length > 0) {
          if (Number(screenshot[0].thumbnail.getSize().width) === 1920) {
            return screenshot[0].thumbnail.toPNG()
          } else {
            // 1080p 이상 창모드
            if (Number(screenshot[0].thumbnail.getSize().width) <= 1861) {
              if (Number(screenshot[0].thumbnail.getSize().width) <= 1848) {
                return sharp(screenshot[0].thumbnail.toPNG()).extract({ left: 9, top: 36, width: 1830, height: 1035 }).resize(1920, 1080).toBuffer()
              } else {
                return sharp(screenshot[0].thumbnail.toPNG()).extract({ left: 9, top: 36, width: 1841, height: 1035 }).resize(1920, 1080).toBuffer()
              }
            }
            // 900p 창모드
            else {
              console.log('900p')
              return sharp(screenshot[0].thumbnail.toPNG()).extract({ left: 8, top: 30, width: 1853, height: 1042 }).resize(1920, 1080).toBuffer()
            }
          }
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

// OCR 작업을 위한 영역 및 설정 정의
const ocrRegions = {
  button: { width: 66, height: 120, left: 70, top: 0, grayscale: true, linear: [2, 0] },
  pattern: { width: 92, height: 20, left: 711, top: 85, grayscale: true, linear: [2, 0] },
  score: { width: 458, height: 128, left: 732, top: 672, grayscale: false, linear: [1, 0] },
  speed: { width: 70, height: 52, left: 105, top: 725, grayscale: false, linear: null },
  breakCount: { width: 67, height: 21, left: 354, top: 615, grayscale: false, linear: null },
}

// 텍스트 정규화 함수 (중복 제거)
const normalizeText = (text) => String(text).replaceAll('|', '').replaceAll('\n', ' ').replaceAll('\\n', ' ').trim()

// OCR 실행 함수
async function recognizeText(imageBuffer, lang = 'eng') {
  const worker = await Tesseract.createWorker(lang)

  const {
    data: { text },
  } = await worker.recognize(imageBuffer)
  await worker.terminate()
  return normalizeText(text)
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

// 이미지 처리 및 OCR 함수 (Promise.all 적용)
async function processImageAndOCR(imageBuffer) {
  const promises = Object.entries(ocrRegions).map(async ([key, region]) => {
    const { width, height, left, top, grayscale, linear } = region
    let processedBuffer = sharp(imageBuffer).extract({ width, height, left, top })
    if (grayscale) processedBuffer = processedBuffer.grayscale()
    if (linear) processedBuffer = processedBuffer.linear(...linear)
    const buffer = await processedBuffer.toBuffer()
    const text = await (['button', 'score', 'speed', 'breakCount'].includes(key)
      ? recognizeTextOnlyNumber(buffer)
      : recognizeText(buffer, key === 'nameKor' ? 'kor' : 'eng'))
    return { [key]: text }
  })

  const results = await Promise.all(promises)
  return Object.assign({}, ...results) // 객체 병합
}

app.on('will-quit', () => {
  clearInterval(autoCaptureIntervalId) // Clear the interval when the app is about to quit
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
