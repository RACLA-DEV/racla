import { createLog } from '@render/libs/logger'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

import en_US_board from './en_US/board.json'
import en_US_common from './en_US/common.json'
import en_US_db from './en_US/db.json'
import en_US_feedback from './en_US/feedback.json'
import en_US_games from './en_US/games.json'
import en_US_grade from './en_US/grade.json'
import en_US_home from './en_US/home.json'
import en_US_languages from './en_US/languages.json'
import en_US_menu from './en_US/menu.json'
import en_US_overlay from './en_US/overlay.json'
import en_US_ranking from './en_US/ranking.json'
import en_US_regScore from './en_US/regScore.json'
import en_US_settings from './en_US/settings.json'
import ja_JP_board from './ja_JP/board.json'
import ja_JP_common from './ja_JP/common.json'
import ja_JP_db from './ja_JP/db.json'
import ja_JP_feedback from './ja_JP/feedback.json'
import ja_JP_games from './ja_JP/games.json'
import ja_JP_grade from './ja_JP/grade.json'
import ja_JP_home from './ja_JP/home.json'
import ja_JP_languages from './ja_JP/languages.json'
import ja_JP_menu from './ja_JP/menu.json'
import ja_JP_overlay from './ja_JP/overlay.json'
import ja_JP_ranking from './ja_JP/ranking.json'
import ja_JP_regScore from './ja_JP/regScore.json'
import ja_JP_settings from './ja_JP/settings.json'
import ko_KR_board from './ko_KR/board.json'
import ko_KR_common from './ko_KR/common.json'
import ko_KR_db from './ko_KR/db.json'
import ko_KR_feedback from './ko_KR/feedback.json'
import ko_KR_games from './ko_KR/games.json'
import ko_KR_grade from './ko_KR/grade.json'
import ko_KR_home from './ko_KR/home.json'
import ko_KR_languages from './ko_KR/languages.json'
import ko_KR_menu from './ko_KR/menu.json'
import ko_KR_overlay from './ko_KR/overlay.json'
import ko_KR_ranking from './ko_KR/ranking.json'
import ko_KR_regScore from './ko_KR/regScore.json'
import ko_KR_settings from './ko_KR/settings.json'
export const defaultNS = 'common'

i18next
  .use(initReactI18next)
  .init({
    lng: 'ko_KR', // if you're using a language detector, do not define the lng option
    debug: true,
    resources: {
      en_US: {
        common: en_US_common,
        games: en_US_games,
        menu: en_US_menu,
        settings: en_US_settings,
        home: en_US_home,
        languages: en_US_languages,
        db: en_US_db,
        board: en_US_board,
        feedback: en_US_feedback,
        overlay: en_US_overlay,
        grade: en_US_grade,
        ranking: en_US_ranking,
        regScore: en_US_regScore,
      },
      ko_KR: {
        common: ko_KR_common,
        games: ko_KR_games,
        menu: ko_KR_menu,
        settings: ko_KR_settings,
        home: ko_KR_home,
        languages: ko_KR_languages,
        db: ko_KR_db,
        board: ko_KR_board,
        feedback: ko_KR_feedback,
        overlay: ko_KR_overlay,
        grade: ko_KR_grade,
        ranking: ko_KR_ranking,
        regScore: ko_KR_regScore,
      },
      ja_JP: {
        common: ja_JP_common,
        games: ja_JP_games,
        menu: ja_JP_menu,
        settings: ja_JP_settings,
        home: ja_JP_home,
        languages: ja_JP_languages,
        db: ja_JP_db,
        board: ja_JP_board,
        feedback: ja_JP_feedback,
        overlay: ja_JP_overlay,
        grade: ja_JP_grade,
        ranking: ja_JP_ranking,
        regScore: ja_JP_regScore,
      },
    },
    defaultNS,
  })
  .catch((err: unknown) => {
    createLog('error', 'i18n initialize failed', err)
  })
