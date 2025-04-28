// OCR 추출 결과 인터페이스
export interface ExtractedRegionsResult {
  regions: Record<string, Buffer>
  texts: Record<string, string>
}
