// 메인 프로세스에서 사용하는 상수
export const GLOBAL_DICTONARY = {
  SUPPORTED_GAME_PROCESS_NAME_LIST: [
    // 왜 하나가 더 많지?
    'DJMAX RESPECT V.exe', // GOAT
    'WJMAX.exe', // LIAR GAME
    'PLATiNA LAB.exe', // 플라티나 랩은 프로세스는 PLATiNA LAB으로 나오고...
    'PLATiNA :: LAB.exe', // 또 앱(프로그램) 명으로는 PLATiNA :: LAB으로 나오기 때문에...
  ],
  NOT_SUPPORTED_GAME_PROCESS_NAME_LIST: [
    // 지원하지 않지만 게임 중일때 라클라가 켜져있다면 사용자 환경 최적화를 위해서
    'DivaMegaMix.exe', // 미쿠미쿠빔
    'MuseDash.exe', // 우리부로
    'osu!.exe', // 저작권 주작은 뭐야
  ],
}
