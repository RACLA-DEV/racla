const fs = require('fs')

const dayjs = require('dayjs')

const buildTime = dayjs().format('YYYYMMDDHHmm')

const variable = process.argv[2] || 'Prod' // 기본값 설정

fs.writeFileSync(
  './src/render/constants/buildInfo.ts',
  `export const BUILD_DATE = '${buildTime} ${variable == 'Prod' ? 'Client (Vite)' : 'Client (Vite) Dev'}';\n`,
)
