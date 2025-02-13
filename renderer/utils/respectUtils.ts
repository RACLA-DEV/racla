export const getDifficultyStarImage = (level: number, difficultyType: string): string => {
  const baseType = difficultyType === 'SC' ? 'sc' : 'nm'

  if (difficultyType === 'SC')
    return `https://ribbon.r-archive.zip/djmax_respect_v/${baseType}_15_star.png`
  if (difficultyType === 'NM')
    return `https://ribbon.r-archive.zip/djmax_respect_v/${baseType}_5_star.png`
  if (difficultyType === 'HD')
    return `https://ribbon.r-archive.zip/djmax_respect_v/${baseType}_10_star.png`
  return `https://ribbon.r-archive.zip/djmax_respect_v/${baseType}_15_star.png`
}

export const getDifficultyClassName = (level: number, difficultyType: string): string => {
  const baseClass = 'tw-text-base text-stroke-100 tw-font-extrabold'
  const difficultyClass = difficultyType === 'SC' ? 'tw-text-respect-sc' : 'tw-text-respect-nm'

  if (difficultyType === 'SC') return `${baseClass} ${difficultyClass}-15`
  if (difficultyType === 'NM') return `${baseClass} ${difficultyClass}-5`
  if (difficultyType === 'HD') return `${baseClass} ${difficultyClass}-10`
  return `${baseClass} ${difficultyClass}-15`
}

export const getDifficultyTextClassName = (difficultyType: string): string => {
  const baseClass = 'tw-text-base tw-font-extrabold tw-text-left tw-z-50 text-stroke-100 tw-me-auto'

  switch (difficultyType) {
    case 'NM':
      return `${baseClass} tw-text-respect-nm-5`
    case 'HD':
      return `${baseClass} tw-text-respect-nm-10`
    case 'MX':
      return `${baseClass} tw-text-respect-nm-15`
    case 'SC':
      return `${baseClass} tw-text-respect-sc-15`
    default:
      return baseClass
  }
}

export const getDifficultyScoreBarClassName = (difficultyType: string): string => {
  const baseClass = 'tw-h-6 tw-transition-all tw-duration-500 tw-ease-in-out'

  switch (difficultyType) {
    case 'NM':
      return `${baseClass} tw-bg-respect-nm-5`
    case 'HD':
      return `${baseClass} tw-bg-respect-nm-10`
    case 'MX':
      return `${baseClass} tw-bg-respect-nm-15`
    case 'SC':
      return `${baseClass} tw-bg-respect-sc-15`
    default:
      return baseClass
  }
}

interface PatternScore {
  score?: string | null
  maxCombo?: boolean
  rating?: number
}

export const getScoreDisplayText = (pattern: PatternScore): string => {
  if (!pattern.score) return '0%(기록 미존재)'

  if (pattern.score === '100.00')
    return `PERFECT${pattern.rating != null && pattern.rating > 0 ? ` / ${pattern.rating}` : ''}`

  return `${pattern.score}%${pattern.maxCombo ? '(MAX COMBO)' : ''}${
    pattern.rating != null && pattern.rating > 0 ? ` / ${pattern.rating}` : ''
  }`
}

export const getSCPatternScoreDisplayText = (patterns: any, keyMode: string): string => {
  const scPattern = patterns[`${keyMode}B`].SC
  const mxPattern = patterns[`${keyMode}B`].MX

  // SC 패턴이 .5 레벨인 경우 MX 패턴의 점수를 표시
  if (String(scPattern.level).includes('.5')) {
    if (!mxPattern.score) return '0.00'
    return mxPattern.score === '100.00' ? 'PERFECT' : mxPattern.score
  }

  // 일반적인 SC 패턴 점수 표시
  if (!scPattern.score) return '0.00'
  return scPattern.score === '100.00' ? 'PERFECT' : scPattern.score
}

export const perfectConst = {
  SC15: 99.9899,
  SC14: 95.55,
  SC13: 91.11,
  SC12: 86.6699,
  SC11: 82.23,
  SC10: 77.79,
  SC9: 73.34,
  SC8: 68.91,
  SC7: 66.69,
  SC6: 64.47,
  SC5: 62.25,
  SC4: 60.0299,
  SC3: 57.81,
  SC2: 55.59,
  SC1: 53.3699,
  NM15: 68.91,
  NM14: 64.47,
  NM13: 60.0299,
  NM12: 55.59,
  NM11: 51.15,
  NM10: 46.7099,
  NM9: 42.27,
  NM8: 37.83,
  NM7: 33.3899,
  NM6: 28.95,
  NM5: 24.51,
  NM4: 20.0699,
  NM3: 15.63,
  NM2: 11.1899,
  NM1: 6.75,
}

export const calDjpower = (x: any, c: any) => {
  if (parseFloat(x) === 100) return parseFloat(c)
  if (parseFloat(x) === 0) return 0
  return (
    parseFloat(c) *
    (0.9016 * (1 / (1 + Math.exp(-0.9175 * parseFloat(x) + 88.6))) + 0.125)
  ).toFixed(3)
}
