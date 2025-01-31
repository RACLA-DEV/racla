const fs = require('fs')

const dayjs = require('dayjs')

const buildTime = dayjs().format('YYYYMMDDHHmm')

fs.writeFileSync(
  './renderer/src/libs/server/buildInfo.ts',
  `export const BUILD_DATE = '${buildTime}';\n`,
)
