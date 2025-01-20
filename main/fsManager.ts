import { app } from 'electron'

// sessionManager.js
const fs = require('fs')
const path = require('path')

/**
 * 폴더가 존재하는지 확인하고, 없으면 새로 생성합니다.
 * @param {string} dirPath - 폴더 경로
 */
function ensureDirectoryExists(dirPath) {
  // 폴더 경로를 절대 경로로 변환합니다.
  const absolutePath = path.resolve(dirPath)
  const parentDir = path.dirname(absolutePath)
  const oldFolderName = 'PROJECT-RA'
  const oldFolderName2 = 'R-ARCHIVE'
  const oldPath = path.join(parentDir, oldFolderName)
  const oldPath2 = path.join(parentDir, oldFolderName2)

  // 파일/폴더를 복사하는 헬퍼 함수
  const copyFolderRecursive = (src: string, dest: string) => {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true })
    }

    const files = fs.readdirSync(src)
    files.forEach((file) => {
      const srcPath = path.join(src, file)
      const destPath = path.join(dest, file)

      if (fs.statSync(srcPath).isDirectory()) {
        copyFolderRecursive(srcPath, destPath)
      } else {
        fs.copyFileSync(srcPath, destPath)
      }
    })
  }

  // 기존 PROJECT-RA 폴더가 있는지 확인
  if (fs.existsSync(oldPath)) {
    if (fs.existsSync(absolutePath)) {
      // RACLA 폴더가 이미 존재하면 데이터 병합
      copyFolderRecursive(oldPath, absolutePath)
      fs.rmSync(oldPath, { recursive: true })
      console.log(`Merged data from ${oldPath} to ${absolutePath}`)
    } else {
      // RACLA 폴더가 없으면 이름만 변경
      fs.renameSync(oldPath, absolutePath)
      console.log(`Folder Renamed: ${oldPath} -> ${absolutePath}`)
    }
    return
  }

  if (fs.existsSync(oldPath2)) {
    if (fs.existsSync(absolutePath)) {
      // RACLA 폴더가 이미 존재하면 데이터 병합
      copyFolderRecursive(oldPath2, absolutePath)
      fs.rmSync(oldPath2, { recursive: true })
      console.log(`Merged data from ${oldPath2} to ${absolutePath}`)
    } else {
      // RACLA 폴더가 없으면 이름만 변경
      fs.renameSync(oldPath2, absolutePath)
      console.log(`Folder Renamed: ${oldPath2} -> ${absolutePath}`)
    }
    return
  }

  // 폴더가 존재하는지 확인합니다.
  if (!fs.existsSync(absolutePath)) {
    // 폴더가 없으면 새로 생성합니다.
    fs.mkdirSync(absolutePath, { recursive: true })
    console.log(`Folder Created: ${absolutePath}`)
  } else {
    console.log(`Folder Already Exists: ${absolutePath}`)
  }
}

const picturePath = path.join(app.getPath('pictures'), 'RACLA')
ensureDirectoryExists(picturePath)

const documentPath = path.join(app.getPath('documents'), 'RACLA')
ensureDirectoryExists(documentPath)

const sessionFile = path.join(documentPath, 'session.json')
const songDataFile = path.join(documentPath, 'songData.json')
const wjmaxSongDataFile = path.join(documentPath, 'wjmaxSongData.json')
const settingDataFile = path.join(documentPath, 'settings.json')

// 세션 저장
export function storeSession(session) {
  console.log('session Saved:', sessionFile, session)
  fs.writeFileSync(sessionFile, JSON.stringify(session), 'utf-8')
}

// 세션 읽기
export function getSession() {
  if (fs.existsSync(sessionFile)) {
    const data = fs.readFileSync(sessionFile, 'utf-8')
    return JSON.parse(data)
  }
  return null
}

// 세션 삭제
export function clearSession() {
  if (fs.existsSync(sessionFile)) {
    fs.writeFileSync(
      sessionFile,
      JSON.stringify({ userNo: '', userToken: '', vArchiveUserNo: '', vArchiveUserToken: '' }),
      'utf-8',
    )
  }
}

// 곡 데이터 저장
export function storeSongData(songData) {
  console.log('songData Saved:', songDataFile)
  fs.writeFileSync(songDataFile, JSON.stringify(songData), 'utf-8')
}

// 곡 데이터 읽기
export function getSongData() {
  if (fs.existsSync(songDataFile)) {
    const data = fs.readFileSync(songDataFile, 'utf-8')
    return JSON.parse(data)
  }
  return null
}

// wjmax 곡 데이터 저장
export function storeWjmaxSongData(wjmaxSongData) {
  console.log('wjmaxSongData Saved:', wjmaxSongDataFile)
  fs.writeFileSync(wjmaxSongDataFile, JSON.stringify(wjmaxSongData), 'utf-8')
}

// wjmax 곡 데이터 읽기
export function getWjmaxSongData() {
  if (fs.existsSync(wjmaxSongDataFile)) {
    const data = fs.readFileSync(wjmaxSongDataFile, 'utf-8')
    return JSON.parse(data)
  }
  return null
}

// 설정 파일 저장
export function storeSettingData(settingData) {
  console.log('settingData Saved:', settingDataFile, settingData)
  fs.writeFileSync(settingDataFile, JSON.stringify(settingData), 'utf-8')
}

// 설정 파일 읽기
export function getSettingData() {
  if (fs.existsSync(settingDataFile)) {
    const data = fs.readFileSync(settingDataFile, 'utf-8')
    return JSON.parse(data)
  }
  return null
}

if (getSession() === undefined || getSession() === null) {
  console.log('File Created: ', sessionFile)
  storeSession({ userNo: '', userToken: '' })
}

if (getSongData() === undefined || getSongData() === null) {
  console.log('File Created: ', songDataFile)
  storeSongData([{}])
}

if (getWjmaxSongData() === undefined || getWjmaxSongData() === null) {
  console.log('File Created: ', wjmaxSongDataFile)
  storeWjmaxSongData([{}])
}

if (getSettingData() === undefined || getSettingData() === null) {
  console.log('File Created: ', settingDataFile)
  storeSettingData({
    hardwareAcceleration: true,
    homeButtonAlignRight: false,
    visibleBga: true,
    autoCaptureMode: true,
    autoCaptureIntervalTime: 3000,
    language: 'ko',
    autoCaptureApi: 'xcap-api',
    visibleAnimation: true,
    captureOnlyFocused: true,
    autoUpdate: true,
    autoRemoveBlackPixel: true,
    removeBlackPixelPx: 8,
    saveImageWhenCapture: true,
    resultOverlay: true,
  })
}
