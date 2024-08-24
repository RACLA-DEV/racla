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

  // 폴더가 존재하는지 확인합니다.
  if (!fs.existsSync(absolutePath)) {
    // 폴더가 없으면 새로 생성합니다.
    fs.mkdirSync(absolutePath, { recursive: true })
    console.log(`Folder Created: ${absolutePath}`)
  } else {
    console.log(`Folder Already Exists: ${absolutePath}`)
  }
}

const picturePath = path.join(app.getPath('pictures'), 'PROJECT-RA')
ensureDirectoryExists(picturePath)

const documentPath = path.join(app.getPath('documents'), 'PROJECT-RA')
ensureDirectoryExists(documentPath)

const sessionFile = path.join(documentPath, 'session.json')
const songDataFile = path.join(documentPath, 'songData.json')
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
    fs.writeFileSync(sessionFile, JSON.stringify({ userNo: '', userToken: '' }), 'utf-8')
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

if (getSettingData() === undefined || getSettingData() === null) {
  console.log('File Created: ', settingDataFile)
  storeSettingData({
    hardwareAcceleration: true,
    homeButtonAlignRight: false,
    autoCaptureMode: false,
    autoCaptureIntervalTime: 3000,
    autoCaptureDisplayName: '',
    autoCaptureApi: 'napi',
    visibleBga: true,
    language: 'ko',
    rivalName: '',
  })
}
