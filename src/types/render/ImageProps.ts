export interface ImageProps {
  src: string
  alt: string
  width?: number | string
  height?: number | string
  className?: string
  blurClassName?: string
  style?: React.CSSProperties
  loading?: 'lazy' | 'eager'
  onLoad?: () => void
  onError?: () => void
  placeholder?: string
  fallbackSrc?: string // 이미지 로드 실패 시 대체 이미지
}
