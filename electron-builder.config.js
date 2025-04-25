/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const config = {
  appId: 'app.racla.racla-electron-app',
  productName: 'RACLA for Desktop',
  copyright: 'Copyright © 2024-2025 RACLA from 공감대로0번길(GGDRN0 STUDIO)',

  directories: {
    output: 'dist/electron',
    buildResources: 'resources',
  },

  extraResources: [
    {
      from: './resources/',
      to: './',
    },
  ],

  npmRebuild: false,
  files: ['dist/main/**/*', 'dist/preload/**/*', 'dist/render/**/*'],
  // extraResources: [
  //   {
  //     from: 'src/render/assets',
  //     to: 'assets',
  //     filter: ['**/*'],
  //   },
  //   {
  //     from: 'src/render/images',
  //     to: 'images',
  //     filter: ['**/*'],
  //   },
  // ],

  publish: {
    provider: 'github',
    owner: 'RACLA-DEV',
    repo: 'racla-vite',
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
  asarUnpack: ['**/node_modules/sharp/**/*', '**/node_modules/@img/**/*'],
}

module.exports = config
