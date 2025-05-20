import { OcrPlayDataResponse } from '../dto/ocr/OcrPlayDataResponse'

export interface ResultDisplayProps {
  result: OcrPlayDataResponse
  viewMode: 'grid' | 'list'
}
