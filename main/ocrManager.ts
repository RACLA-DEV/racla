import axios from 'axios'
import { randomUUID } from 'crypto'
import fs from 'fs'
import moment from 'moment'
import path from 'path'
import sharp from 'sharp'
import Tesseract from 'tesseract.js'
import { getSession } from './fsManager'

interface OCRRegion {
  width: number
  height: number
  left: number
  top: number
}

interface ProfileRegion {
  myProfile: OCRRegion
  otherProfile: OCRRegion
}

interface GameRegions {
  [key: string]: {
    [screenType: string]: ProfileRegion
  }
}

interface ProcessOptions {
  isMenualUpload?: boolean
  isNotSaveImage?: boolean
  gameCode?: string
}

interface AppOptions {
  app: any
  settingData: any
  mainWindow: any
  overlayWindow: any
  isProd: boolean
  isLogined: boolean
  isUploaded: boolean
}

// 알림음 재생을 위한 함수 추가
function playNotificationSound() {
  try {
    const audio = new Audio(path.join(__dirname, '/../resources/', 'notification.mp3'))
    audio.play().catch((err) => console.error('Error playing notification sound:', err))
  } catch (error) {
    console.error('Failed to play notification sound:', error)
  }
}

// OCR 처리를 위한 클래스
class GameOCRProcessor {
  public readonly profileRegions: GameRegions = {
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
    wjmax: {
      result: {
        myProfile: { left: 1546, top: 32, width: 342, height: 70 },
        otherProfile: { left: 1, top: 1, width: 1, height: 1 },
      },
    },
  }

  constructor(
    private gameCode: string,
    private settingData: any,
    private mainWindow: any,
    private overlayWindow: any,
  ) {}

  async extractRegions(gameCode: string, imageBuffer: Buffer) {
    const regions: { [key: string]: Buffer } = {}
    const texts: { [key: string]: string } = {}

    if (gameCode === 'djmax_respect_v') {
      if (this.settingData.autoCaptureOcrResultRegion) {
        regions.result = await this.extractRegion(imageBuffer, {
          width: 230,
          height: 24,
          left: 100,
          top: 236,
        })
        texts.result = await this.recognizeText(regions.result)
      }

      if (this.settingData.autoCaptureOcrOpen3Region) {
        regions.open3 = await this.extractRegion(imageBuffer, {
          width: 57,
          height: 26,
          left: 596,
          top: 470,
        })
        texts.open3 = await this.recognizeText(regions.open3)
      }

      if (this.settingData.autoCaptureOcrOpen2Region) {
        regions.open2 = await this.extractRegion(imageBuffer, {
          width: 60,
          height: 25,
          left: 693,
          top: 471,
        })
        texts.open2 = await this.recognizeText(regions.open2)
      }

      if (this.settingData.autoCaptureOcrVersusRegion) {
        regions.versus = await this.extractRegion(imageBuffer, {
          width: 142,
          height: 104,
          left: 755,
          top: 52,
        })
        texts.versus = await this.recognizeText(regions.versus)
      }
    } else if (gameCode === 'wjmax') {
      if (this.settingData.autoCaptureWjmaxOcrResultRegion) {
        regions.result = await this.extractRegion(imageBuffer, {
          width: 135,
          height: 21,
          left: 1038,
          top: 307,
        })
        texts.result = await this.recognizeText(regions.result)
      }
    }

    return { regions, texts }
  }

  private async extractRegion(imageBuffer: Buffer, region: OCRRegion): Promise<Buffer> {
    return await sharp(imageBuffer).extract(region).grayscale().linear(1.5, 0).toBuffer()
  }

  private async recognizeText(buffer: Buffer): Promise<string> {
    return await recognizeText(buffer, 'eng')
  }

  async determineResultScreen(gameCode: string, texts: any) {
    const resultInfo = {
      isResult: [] as string[],
      text: '',
      where: '',
    }

    if (gameCode === 'djmax_respect_v') {
      const resultKeywords = ['JUDGEMENT', 'DETAILS', 'DETAIL', 'JUDGE', 'JUDGEMENT DETAILS']
      if (this.settingData.autoCaptureOcrResultRegion && texts.result) {
        resultInfo.isResult = this.checkResultKeywords(texts.result, resultKeywords)
        if (resultInfo.isResult.length > 0) {
          resultInfo.where = 'result'
          resultInfo.text = texts.result
        }
      }

      if (!resultInfo.where && this.settingData.autoCaptureOcrOpen3Region && texts.open3) {
        if (texts.open3.trim().toUpperCase() === 'MAX') {
          resultInfo.where = 'open3'
          resultInfo.isResult = ['open3']
          resultInfo.text = texts.open3
        }
      }

      if (!resultInfo.where && this.settingData.autoCaptureOcrOpen2Region && texts.open2) {
        if (texts.open2.trim().toUpperCase() === 'MAX') {
          resultInfo.where = 'open2'
          resultInfo.isResult = ['open2']
          resultInfo.text = texts.open2
        }
      }

      if (!resultInfo.where && this.settingData.autoCaptureOcrVersusRegion && texts.versus) {
        if (texts.versus.trim().toUpperCase().replaceAll(' ', '') === 'RE') {
          resultInfo.where = 'versus'
          resultInfo.isResult = ['versus']
          resultInfo.text = texts.versus
        }
      }
    } else if (gameCode === 'wjmax') {
      const resultKeywords = ['JUDGEMENT', 'JUDGE', 'MENT', 'MENTS', 'JUDGEMENTS']
      if (this.settingData.autoCaptureWjmaxOcrResultRegion && texts.result) {
        resultInfo.isResult = this.checkResultKeywords(texts.result, resultKeywords)
        if (resultInfo.isResult.length > 0) {
          resultInfo.where = 'result'
          resultInfo.text = texts.result
        }
      }
    }

    return resultInfo
  }

  private checkResultKeywords(text: string, keywords: string[]): string[] {
    return keywords.filter(
      (value) => text.toUpperCase().trim().includes(value) && text.length !== 0,
    )
  }
}

// 이미지 처리를 위한 클래스
class ImageProcessor {
  private readonly profileRegions: GameRegions

  constructor(
    private settingData: any,
    gameOcrProcessor: GameOCRProcessor,
  ) {
    this.profileRegions = gameOcrProcessor.profileRegions
  }

  async applyProfileMask(
    imageBuffer: Buffer,
    gameCode: string,
    screenType: string,
  ): Promise<Buffer> {
    try {
      const image = sharp(imageBuffer)
      const regions = this.getRegionsToMask(gameCode, screenType)

      if (regions.length === 0) return imageBuffer

      const overlays = await Promise.all(
        regions.map(async (region) => ({
          input: await this.createMask(imageBuffer, region),
          left: region.left,
          top: region.top,
        })),
      )

      return await image.composite(overlays).toBuffer()
    } catch (error) {
      console.error('Error applying profile mask:', error)
      return imageBuffer
    }
  }

  private getRegionsToMask(gameCode: string, screenType: string): OCRRegion[] {
    const regions = this.profileRegions[gameCode]?.[screenType]
    if (!regions) return []

    let regionsToMask: OCRRegion[] = []

    if (this.settingData.saveImageWithoutAllProfileWhenCapture) {
      if (screenType === 'result' || screenType === 'select' || screenType === 'collection') {
        regionsToMask = [regions.myProfile]
      } else if (screenType === 'openSelect') {
        regionsToMask = [
          regions.myProfile,
          regions.otherProfile,
          { left: 58, top: 687, width: 524, height: 256 },
        ]
      } else {
        regionsToMask = [regions.myProfile, regions.otherProfile]
      }
    } else if (this.settingData.saveImageWithoutOtherProfileWhenCapture) {
      if (screenType === 'result' || screenType === 'select' || screenType === 'collection') {
        regionsToMask = []
      } else if (screenType === 'openSelect') {
        regionsToMask = [regions.otherProfile, { left: 58, top: 687, width: 524, height: 256 }]
      } else {
        regionsToMask = [regions.otherProfile]
      }
    } else {
      if (screenType === 'openSelect') {
        regionsToMask = [{ left: 58, top: 687, width: 524, height: 256 }]
      }
    }

    return regionsToMask
  }

  private async createMask(imageBuffer: Buffer, region: OCRRegion): Promise<Buffer> {
    if (this.settingData.saveImageBlurMode === 'black') {
      return await this.createBlackMask(region)
    }
    return await this.createBlurMask(imageBuffer, region)
  }

  private async createBlackMask(region: OCRRegion): Promise<Buffer> {
    return await sharp({
      create: {
        width: region.width,
        height: region.height,
        channels: 4,
        background: '#000000',
      },
    })
      .jpeg()
      .toBuffer()
  }

  private async createBlurMask(imageBuffer: Buffer, region: OCRRegion): Promise<Buffer> {
    return await sharp(imageBuffer).extract(region).blur(15).toBuffer()
  }

  async saveImage(imageBuffer: Buffer, filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.writeFile(filePath, imageBuffer, (err) => {
        if (err) {
          console.error('Failed to save file:', err)
          reject(err)
        } else {
          console.log('File saved to', filePath)
          resolve()
        }
      })
    })
  }
}

// API 통신을 위한 클래스
class OCRApiService {
  constructor(
    private isProd: boolean,
    private isLogined: boolean,
    private gameCode: string,
  ) {}

  async uploadForOCR(formData: FormData, where: string): Promise<any> {
    const session = await this.getSession()
    const baseUrl = this.isProd
      ? 'https://near.r-archive.zip/api'
      : 'https://noah.r-archive.zip/api'

    try {
      const response = await axios.post(`${baseUrl}/v1/ocr/upload/${this.gameCode}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: this.isLogined
            ? `${this.gameCode == 'djmax_respect_v' ? session.vArchiveUserNo : session.userNo}|${
                this.gameCode == 'djmax_respect_v' ? session.vArchiveUserToken : session.userToken
              }`
            : '',
        },
        withCredentials: true,
      })

      console.log('Server Side OCR Upload Result:', response.data)
      return response.data
    } catch (error) {
      console.error('Server Side OCR Upload Error:', error)
      throw error
    }
  }

  private async getSession() {
    // 세션 정보 가져오기
    return await getSession()
  }
}

// 메인 처리 함수
export async function processResultScreen(
  imageBuffer: Buffer,
  options: ProcessOptions,
  appOptions: AppOptions,
) {
  const { isMenualUpload = false, isNotSaveImage = false, gameCode = 'djmax_respect_v' } = options
  const { app, settingData, mainWindow, overlayWindow, isProd, isLogined, isUploaded } = appOptions

  const ocrProcessor = new GameOCRProcessor(gameCode, settingData, mainWindow, overlayWindow)
  const imageProcessor = new ImageProcessor(settingData, ocrProcessor)
  const apiService = new OCRApiService(isProd, isLogined, gameCode)

  try {
    console.log('Client Side OCR isResultScreen Requested. Processing image data...')

    // 1. OCR 처리
    const { texts } = !isMenualUpload
      ? await ocrProcessor.extractRegions(gameCode, imageBuffer)
      : { texts: null }
    const resultInfo = !isMenualUpload
      ? await ocrProcessor.determineResultScreen(gameCode, texts)
      : { isResult: ['server'], text: 'server', where: 'server' }

    if (resultInfo.isResult.length === 0) {
      console.log('Waiting for Result Screen...')
      return { playData: { isVerified: null }, isUploaded: false }
    }

    // 2. 서버 OCR 요청
    if (resultInfo.isResult.length >= 1 && (!appOptions.isUploaded || isMenualUpload)) {
      try {
        if (!isMenualUpload) {
          mainWindow.webContents.send('pushNotification', {
            time: moment().utcOffset(9).format('YYYY-MM-DD-HH-mm-ss'),
            message: `${
              gameCode == 'djmax_respect_v' ? 'DJMAX RESPECT V' : 'WJMAX'
            }의 게임 결과창이 자동 인식되어 성과 기록 이미지를 처리 중에 있습니다. 잠시만 기다려주세요.`,
            color: 'tw-bg-blue-600',
          })
          overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
            message: `${
              gameCode == 'djmax_respect_v' ? 'DJMAX RESPECT V' : 'WJMAX'
            }의 게임 결과창이 자동 인식되어 성과 기록 이미지를 처리 중에 있습니다. 잠시만 기다려주세요.`,
            color: 'tw-bg-blue-600',
          })
        }
        const formData = new FormData()
        const blob = new Blob([imageBuffer], { type: 'image/png' })
        formData.append('file', blob, randomUUID() + '.png')
        formData.append('where', resultInfo.where)

        const response = await apiService.uploadForOCR(formData, resultInfo.where)
        const { playData } = response

        // 3. 결과 처리
        if (
          playData.isVerified ||
          playData.screenType === 'versus' ||
          playData.screenType === 'collection'
        ) {
          // 이미지 저장 처리
          if (settingData.saveImageWhenCapture && !isNotSaveImage) {
            const finalImageBuffer = await imageProcessor.applyProfileMask(
              imageBuffer,
              gameCode,
              playData.screenType,
            )
            await imageProcessor.saveImage(finalImageBuffer, getFilePath(playData, app))
          }

          await handleNotifications(gameCode, playData, mainWindow, overlayWindow, isProd)
          return {
            ...response,
            filePath: settingData.saveImageWhenCapture ? getFilePath(playData, app) : null,
            isUploaded: true,
          }
        }
      } catch (error) {
        handleError(error)
      }
    } else {
      console.log('Waiting for Exit Result Screen...')
      return { playData: { isVerified: null } }
    }
  } catch (error) {
    handleError(error)
    return { playData: { isVerified: false, error: '처리 중 오류가 발생했습니다.' } }
  }
}

// 유틸리티 함수들
function getFilePath(playData: any, app: any): string {
  return path.join(
    app.getPath('pictures'),
    'RACLA',
    `${playData.gameCode.toUpperCase().replaceAll('_', ' ')}-${getFileNamePart(playData)}-${moment().utcOffset(9).format('YYYY-MM-DD-HH-mm-ss')}.png`,
  )
}

function getFileNamePart(playData: any): string {
  if (playData.screenType === 'versus') {
    return `${playData.screenType}-Match`
  } else if (playData.screenType === 'collection') {
    return `Collection`
  }
  return `${String(playData.songData.name).replaceAll(':', '-')}-${String(playData.score)}`
}

function handleError(error: any) {
  console.error('Error in processResultScreen:', error)
}

async function handleNotifications(
  gameCode: string,
  playData: any,
  mainWindow: any,
  overlayWindow: any,
  isProd: boolean,
) {
  if (playData.screenType === 'versus') {
    await handleVersusNotifications(gameCode, playData, overlayWindow, isProd, mainWindow)
  } else if (playData.screenType === 'collection') {
    handleCollectionNotification(overlayWindow, mainWindow)
  } else if (playData.isVerified) {
    await handleRegularNotification(gameCode, playData, overlayWindow, isProd, mainWindow)
  } else {
    handleErrorNotification(overlayWindow)
  }
}

async function handleRegularNotification(
  gameCode: string,
  playData: any,
  overlayWindow: any,
  isProd: boolean,
  mainWindow: any,
) {
  try {
    let lastScore = null
    if (gameCode === 'djmax_respect_v') {
      const session = await getSession()
      const backupResponse = await axios.get(
        `${isProd ? 'https://aosame-rain.r-archive.zip/' : 'https://kamome-sano.r-archive.zip/'}?url=https://v-archive.net/api/archive/${
          session.vArchiveUserName
        }/title/${playData.songData.title}`,
      )
      lastScore =
        backupResponse.data?.patterns?.[`${playData.button}B`]?.[playData.pattern]?.score || null
    }

    overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
      ...playData,
      ...(gameCode === 'djmax_respect_v' ? { lastScore } : {}),
    })
    mainWindow.webContents.send('PLAY_NOTIFICATION_SOUND')
  } catch (error) {
    console.error('Error fetching backup data:', error)
    overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
      ...playData,
    })
  }
}

async function handleVersusNotifications(
  gameCode: string,
  playData: any,
  overlayWindow: any,
  isProd: boolean,
  mainWindow: any,
) {
  playData.versusData.forEach(async (value: any, index: number) => {
    if (Number(value.score) > 0) {
      try {
        let lastScore = null
        if (gameCode === 'djmax_respect_v') {
          const session = await getSession()
          const backupResponse = await axios.get(
            `${isProd ? 'https://aosame-rain.r-archive.zip/' : 'https://kamome-sano.r-archive.zip/'}?url=https://v-archive.net/api/archive/${
              session.vArchiveUserName
            }/title/${value.songData.title}`,
          )
          lastScore =
            backupResponse.data?.patterns?.[`${value.button}B`]?.[value.pattern]?.score || null
        }

        mainWindow.webContents.send('PLAY_NOTIFICATION_SOUND')
        setTimeout(() => {
          overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
            ...value,
            gameCode,
            ...(gameCode === 'djmax_respect_v' ? { lastScore } : {}),
          })
        }, 2000 * index)
      } catch (error) {
        console.error('Error fetching backup data:', error)
        setTimeout(() => {
          overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
            ...value,
            gameCode,
          })
        }, 2000 * index)
      }
    }
  })
}

function handleCollectionNotification(overlayWindow: any, mainWindow: any) {
  mainWindow.webContents.send('PLAY_NOTIFICATION_SOUND')
  overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
    message:
      '컬렉션(COLLECTION) 화면 인식에 성공하였습니다. 결과는 RACLA 데스크톱 앱에서 확인해주세요.',
    color: 'tw-bg-lime-600',
  })
}

function handleErrorNotification(overlayWindow: any) {
  overlayWindow.webContents.send('IPC_RENDERER_GET_NOTIFICATION_DATA', {
    message:
      '게임 결과창이 아니거나 성과 기록 이미지를 처리 중에 오류가 발생하였습니다. 다시 시도해주시길 바랍니다.',
    color: 'tw-bg-red-600',
  })
}

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
