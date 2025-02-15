import axios from 'axios'
import packageJson from '../../../package.json'

// 커스텀 axios 인스턴스 생성
export const api = axios.create({
  headers: {
    'User-Agent': `racla-electron-app/${packageJson.version}`,
  },
})
