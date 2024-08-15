// sessionManager.js
const fs = require('fs')
const path = require('path')

const sessionFile = path.join(__dirname, 'session.json')

// 세션 저장
export function storeSession(session) {
  console.log(sessionFile)
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
