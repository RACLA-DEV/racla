import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import en_common from './en/common.json'
import en_games from './en/games.json'
import en_languages from './en/languages.json'
import en_menu from './en/menu.json'
import en_settings from './en/settings.json'
import ja_common from './ja/common.json'
import ja_games from './ja/games.json'
import ja_languages from './ja/languages.json'
import ja_menu from './ja/menu.json'
import ja_settings from './ja/settings.json'
import ko_common from './ko/common.json'
import ko_games from './ko/games.json'
import ko_languages from './ko/languages.json'
import ko_menu from './ko/menu.json'
import ko_settings from './ko/settings.json'

export const defaultNS = 'common'

i18next.use(initReactI18next).init({
  lng: 'ko', // if you're using a language detector, do not define the lng option
  debug: true,
  resources: {
    ko: {
      common: ko_common,
      games: ko_games,
      menu: ko_menu,
      settings: ko_settings,
      languages: ko_languages,
    },
    en: {
      common: en_common,
      games: en_games,
      menu: en_menu,
      settings: en_settings,
      languages: en_languages,
    },
    ja: {
      common: ja_common,
      games: ja_games,
      menu: ja_menu,
      settings: ja_settings,
      languages: ja_languages,
    },
  },
  defaultNS,
})
