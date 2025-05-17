import { ProfileRegion } from './ProfileRegion'

// 게임별 화면 타입에 따른 영역 인터페이스
export type GameRegions = Record<string, Record<string, ProfileRegion>>
