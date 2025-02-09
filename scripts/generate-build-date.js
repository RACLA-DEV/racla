const fs = require('fs')

const dayjs = require('dayjs')

const buildTime = dayjs().format('YYYYMMDDHHmm')

const variable = process.argv[2] || 'Main' // 기본값 설정

fs.writeFileSync(
  './renderer/constants/buildInfo.ts',
  `export const BUILD_DATE = '${buildTime} ${variable == 'Main' ? 'Main' : 'Dev (개발자 빌드)'}';\n`,
)
