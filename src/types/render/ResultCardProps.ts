import { OcrPlayDataBase } from '../dto/ocr/OcrPlayDataResponse'

export interface ResultCardProps {
  data: OcrPlayDataBase
  isMain: boolean
  viewMode: 'grid' | 'list'
  className?: string
}
