import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import common from './ko/common.json'
import settings from './ko/settings.json'

export const defaultNS = 'common'

i18next.use(initReactI18next).init({
  lng: 'ko', // if you're using a language detector, do not define the lng option
  debug: true,
  resources: {
    ko: {
      common,
      settings,
    },
  },
  defaultNS,
})
