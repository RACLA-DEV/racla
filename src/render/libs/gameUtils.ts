import { GameType } from '@src/types/games/GameType'
import { PatternInfo } from '@src/types/games/SongData'

export const getDifficultyClassName = (
  gameType: GameType = 'djmax_respect_v',
  difficultyType: string,
): string => {
  const baseClass = 'tw:text-base text-stroke-100 tw:font-extrabold'
  return `${baseClass} text-${gameType}-${difficultyType}`
}

export const getDifficultyTextClassName = (
  gameType: GameType = 'djmax_respect_v',
  difficultyType: string,
): string => {
  const baseClass = 'tw:text-base tw:font-extrabold tw:text-left tw:z-50 text-stroke-100 tw:me-auto'
  return `${baseClass} text-${gameType}-${difficultyType}`
}

export const getDifficultyScoreBarClassName = (
  gameType: GameType = 'djmax_respect_v',
  difficultyType: string,
): string => {
  const baseClass = 'tw:h-6 tw:transition-all tw:duration-500 tw:ease-in-out'
  return `${baseClass} bg-${gameType}-${difficultyType}`
}

export const getScoreDisplayText = (
  gameType: GameType = 'djmax_respect_v',
  pattern: PatternInfo,
): string => {
  console.log(pattern)
  if (!pattern.score) return '0%(기록 미존재)'

  if (Number(pattern.score) === 0) return '0%(기록 미존재)'

  if (pattern.score === '100.00') {
    if (gameType === 'platina_lab') {
      return `PERFECT${pattern.rating ? ` / ${pattern.rating}` : ''}${pattern?.max === 0 ? ' / MAX' : pattern?.max ? ` / MAX-${pattern.max}` : ''}`
    } else {
      return `PERFECT${pattern.rating != null && pattern.rating > 0 ? ` / ${pattern.rating}` : ''}`
    }
  }

  if (gameType === 'platina_lab') {
    return `${pattern.score}%${pattern.maxCombo ? '(MAX COMBO)' : ''}${pattern.rating ? ` / ${pattern.rating}` : ''}`
  } else {
    return `${pattern.score}%${pattern.maxCombo ? '(MAX COMBO)' : ''}${
      pattern.rating != null && pattern.rating > 0 ? ` / ${pattern.rating}` : ''
    }`
  }
}

export const getDifficultyBgColor = (gameType: GameType, difficultyType: string): string => {
  return `bg-${gameType}-${difficultyType}`
}

export const getDifficultyTextColor = (gameType: GameType, difficultyType: string): string => {
  return `text-${gameType}-${difficultyType}`
}
