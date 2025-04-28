import { OCRRegion } from './OcrRegion'

// 프로파일 영역 인터페이스
export interface ProfileRegion {
  myProfile: OCRRegion
  otherProfile: OCRRegion
  chat: OCRRegion
}
