/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const config = {
  appId: 'zip.r-archive.racla-electron-app',
  productName: 'RACLA for Desktop',
  copyright: 'Copyright © 2024-2025 GGDRN0 STUDIO & R-ARCHIVE',

  directories: {
    output: 'dist/electron',
  },
  npmRebuild: false,
  files: [
    'dist/main/**/*',
    'dist/preload/**/*',
    'dist/render/**/*',
  ],

  publish: {
    provider: 'github',
    owner: 'R-ARCHIVE-TEAM',
    repo: 'racla',
    releaseType: 'release',
  },

  mac: {
    target: ['dmg'],
    extendInfo: {
      LSUIElement: false,
    },
    category: 'public.app-category.utilities',
  },

  win: {
    target: ['nsis'],
  },

  linux: {
    target: ['AppImage'],
  },

  asar: true,
  asarUnpack: [
    '**/node_modules/sharp/**/*',
    '**/node_modules/@img/**/*',
  ],
}

module.exports = config
