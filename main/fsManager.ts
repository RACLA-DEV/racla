import { app } from 'electron'

// sessionManager.js
const fs = require('fs')
const path = require('path')

// const sessionFile = path.join('C:\\Users\\Administrator\\Desktop', 'session.json')
// const songDataFile = path.join('C:\\Users\\Administrator\\Desktop', 'songData.json')

const sessionFile = path.join(app.getPath('userData'), 'session.json')
const songDataFile = path.join(app.getPath('userData'), 'songData.json')
const settingDataFile = path.join(app.getPath('userData'), 'settings.json')

// 세션 저장
export function storeSession(session) {
  console.log('session Saved:', sessionFile)
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
  console.log('settingData Saved:', settingDataFile)
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
