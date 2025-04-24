import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
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
  },
  defaultNS,
})
