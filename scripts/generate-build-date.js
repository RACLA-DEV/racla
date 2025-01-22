const fs = require('fs')

const moment = require('moment')

const buildTime = moment().format('YYYYMMDDHHmm')

fs.writeFileSync(
  './renderer/src/libs/server/buildInfo.ts',
  `export const BUILD_DATE = '${buildTime}';\n`,
)
