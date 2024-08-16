// sessionManager.js
const fs = require('fs')
const path = require('path')

const sessionFile = path.join(__dirname, 'session.json')
const songDataFile = path.join(__dirname, 'songData.json')

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
