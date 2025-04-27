import { Injectable, Logger } from '@nestjs/common'
import { SettingsData } from '@src/types/common/SettingData'
import { FileManagerService } from '../file-manager/file-manager.service'
import { ImageProcessorService } from '../image-processor/image-processor.service'

// OCR 영역 인터페이스
export interface OCRRegion {
  width: number
  height: number
  left: number
  top: number
}

// 프로파일 영역 인터페이스
export interface ProfileRegion {
  myProfile: OCRRegion
  otherProfile: OCRRegion
}

// 게임별 화면 타입에 따른 영역 인터페이스
export interface GameRegions {
  [key: string]: {
    [screenType: string]: ProfileRegion
  }
}

// OCR 결과 인터페이스
export interface OCRResultInfo {
  isResult: string[]
  text: string
  where: string
}

// OCR 추출 결과 인터페이스
export interface ExtractedRegionsResult {
  regions: { [key: string]: Buffer }
  texts: { [key: string]: string }
}

@Injectable()
export class OcrManagerService {
  private readonly logger = new Logger(OcrManagerService.name)

  // 프로필 마스킹 영역 정의 (개인정보 보호)
  private readonly profileRegions: GameRegions = {
    djmax_respect_v: {
      result: {
        myProfile: { left: 1542, top: 26, width: 320, height: 68 },
        otherProfile: { left: 1, top: 1, width: 1, height: 1 },
      },
      select: {
        myProfile: { left: 1522, top: 22, width: 320, height: 68 },
        otherProfile: { left: 1, top: 1, width: 1, height: 1 },
      },
      open3: {
        myProfile: { left: 211, top: 177, width: 320, height: 68 },
        otherProfile: { left: 777, top: 116, width: 1106, height: 852 },
      },
      open2: {
        myProfile: { left: 310, top: 176, width: 321, height: 69 },
        otherProfile: { left: 1290, top: 176, width: 321, height: 69 },
      },
      versus: {
        myProfile: { left: 201, top: 867, width: 320, height: 68 },
        otherProfile: { left: 1401, top: 867, width: 320, height: 68 },
      },
      collection: {
        myProfile: { left: 1512, top: 22, width: 320, height: 68 },
        otherProfile: { left: 1, top: 1, width: 1, height: 1 },
      },
      openSelect: {
        myProfile: { left: 1361, top: 216, width: 320, height: 68 },
        otherProfile: { left: 1363, top: 318, width: 316, height: 464 },
      },
    },
    wjmax: {
      result: {
        myProfile: { left: 1546, top: 32, width: 342, height: 70 },
        otherProfile: { left: 1, top: 1, width: 1, height: 1 },
      },
    },
    platina_lab: {
      result: {
        myProfile: { left: 1452, top: 14, width: 422, height: 88 },
        otherProfile: { left: 1, top: 1, width: 1, height: 1 },
      },
    },
  }

  // OCR 인식 영역 정의 (화면 타입 구분을 위한 영역)
  private readonly ocrRegions = {
    djmax_respect_v: {
      result: { width: 230, height: 24, left: 100, top: 236 },
      versus: { width: 151, height: 106, left: 748, top: 45 },
      open3: { width: 78, height: 24, left: 236, top: 724 },
      open2: { width: 80, height: 26, left: 335, top: 723 },
    },
    wjmax: {
      result: { width: 135, height: 21, left: 1038, top: 307 },
    },
    platina_lab: {
      result: { width: 100, height: 26, left: 694, top: 864 },
    },
  }

  // 결과 화면 키워드 (각 영역별로 다른 키워드 지정)
  private readonly resultKeywords = {
    djmax_respect_v: {
      result: ['JUDGEMENT', 'DETAILS', 'DETAIL', 'JUDGE', 'JUDGEMENT DETAILS'],
      versus: ['RE'],
      open3: ['SCORE', 'ORE'],
      open2: ['SCORE', 'ORE'],
    },
    wjmax: {
      result: ['JUDGEMENT', 'JUDGE', 'MENT', 'MENTS', 'JUDGEMENTS'],
    },
    platina_lab: {
      result: ['COMBO', 'COM', 'MBO'],
    },
  }

  constructor(
    private readonly imageProcessor: ImageProcessorService,
    private readonly fileManagerService: FileManagerService,
  ) {}

  /**
   * 이미지에서 OCR 영역을 추출하고 텍스트를 인식하는 메서드
   */
  async extractRegions(
    gameCode: string,
    imageBuffer: Buffer,
    settings: any,
  ): Promise<ExtractedRegionsResult> {
    const regions: Record<string, Buffer> = {}
    const texts: { [key: string]: string } = {}

    if (gameCode === 'djmax_respect_v') {
      if (settings.autoCaptureOcrResultRegion) {
        regions.result = await this.imageProcessor.extractRegion(
          imageBuffer,
          this.ocrRegions.djmax_respect_v.result,
        )
        texts.result = await this.imageProcessor.recognizeText(regions.result)
      }

      if (settings.autoCaptureOcrVersusRegion) {
        regions.versus = await this.imageProcessor.extractRegion(
          imageBuffer,
          this.ocrRegions.djmax_respect_v.versus,
        )
        texts.versus = await this.imageProcessor.recognizeText(regions.versus)
      }

      if (settings.autoCaptureOcrOpen3Region) {
        regions.open3 = await this.imageProcessor.extractRegion(
          imageBuffer,
          this.ocrRegions.djmax_respect_v.open3,
        )
        texts.open3 = await this.imageProcessor.recognizeText(regions.open3)
      }

      if (settings.autoCaptureOcrOpen2Region) {
        regions.open2 = await this.imageProcessor.extractRegion(
          imageBuffer,
          this.ocrRegions.djmax_respect_v.open2,
        )
        texts.open2 = await this.imageProcessor.recognizeText(regions.open2)
      }
    } else if (gameCode === 'wjmax') {
      if (settings.autoCaptureWjmaxOcrResultRegion) {
        regions.result = await this.imageProcessor.extractRegion(
          imageBuffer,
          this.ocrRegions.wjmax.result,
        )
        texts.result = await this.imageProcessor.recognizeText(regions.result)
      }
    } else if (gameCode === 'platina_lab') {
      if (settings.autoCapturePlatinaLabOcrResultRegion) {
        regions.result = await this.imageProcessor.extractRegion(
          imageBuffer,
          this.ocrRegions.platina_lab.result,
        )
        texts.result = await this.imageProcessor.recognizeText(regions.result)
      }
    }

    return { regions, texts }
  }

  /**
   * 텍스트 분석을 통해 결과 화면인지 판단하는 메서드
   */
  async determineResultScreen(gameCode: string, texts: any, settings: any): Promise<OCRResultInfo> {
    const resultInfo: OCRResultInfo = {
      isResult: [],
      text: '',
      where: '',
    }

    if (gameCode === 'djmax_respect_v') {
      if (settings.autoCaptureOcrResultRegion && texts.result) {
        resultInfo.isResult = this.checkResultKeywords(
          texts.result,
          this.resultKeywords.djmax_respect_v.result,
        )
        if (resultInfo.isResult.length > 0) {
          resultInfo.where = 'result'
          resultInfo.text = texts.result
        }
      }

      // if (!resultInfo.where && settings.autoCaptureOcrVersusRegion && texts.versus) {
      //   if (texts.versus.trim().toUpperCase().replaceAll(' ', '') === 'RE') {
      //     resultInfo.where = 'versus'
      //     resultInfo.isResult = ['versus']
      //     resultInfo.text = texts.versus
      //   }
      // }

      if (!resultInfo.where && settings.autoCaptureOcrOpen3Region && texts.open3) {
        const keywords = this.resultKeywords.djmax_respect_v.open3
        const normalizedText = texts.open3.trim().replaceAll(' ', '').toUpperCase()

        if (keywords.some((keyword) => normalizedText.includes(keyword))) {
          resultInfo.where = 'open3'
          resultInfo.isResult = ['open3']
          resultInfo.text = texts.open3
        }
      }

      if (!resultInfo.where && settings.autoCaptureOcrOpen2Region && texts.open2) {
        const keywords = this.resultKeywords.djmax_respect_v.open2
        const normalizedText = texts.open2.trim().replaceAll(' ', '').toUpperCase()

        if (keywords.some((keyword) => normalizedText.includes(keyword))) {
          resultInfo.where = 'open2'
          resultInfo.isResult = ['open2']
          resultInfo.text = texts.open2
        }
      }
    } else if (gameCode === 'wjmax') {
      if (settings.autoCaptureWjmaxOcrResultRegion && texts.result) {
        resultInfo.isResult = this.checkResultKeywords(
          texts.result,
          this.resultKeywords.wjmax.result,
        )
        if (resultInfo.isResult.length > 0) {
          resultInfo.where = 'result'
          resultInfo.text = texts.result
        }
      }
    } else if (gameCode === 'platina_lab') {
      if (settings.autoCapturePlatinaLabOcrResultRegion && texts.result) {
        resultInfo.isResult = this.checkResultKeywords(
          texts.result,
          this.resultKeywords.platina_lab.result,
        )
        if (resultInfo.isResult.length > 0) {
          resultInfo.where = 'result'
          resultInfo.text = texts.result
        }
      }
    }

    return resultInfo
  }

  /**
   * 결과 화면 키워드 확인 메서드
   */
  private checkResultKeywords(text: string, keywords: string[]): string[] {
    return keywords.filter(
      (value) => text.toUpperCase().trim().includes(value) && text.length !== 0,
    )
  }

  /**
   * 게임 프로필 마스크 영역 가져오기
   */
  getProfileRegions(gameCode: string, screenType: string): ProfileRegion | null {
    return this.profileRegions[gameCode]?.[screenType] || null
  }

  /**
   * 마스킹할 영역 목록 가져오기
   */
  getMaskingRegions(gameCode: string, screenType: string): OCRRegion[] {
    const settings: SettingsData = this.fileManagerService.loadSettings()

    const regions = this.profileRegions[gameCode]?.[screenType]
    if (!regions) return []

    let regionsToMask: OCRRegion[] = []

    if (settings.saveImageWithoutAllProfileWhenCapture) {
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
    } else if (settings.saveImageWithoutOtherProfileWhenCapture) {
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
}
