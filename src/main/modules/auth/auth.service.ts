import { Injectable, Logger } from '@nestjs/common'
import type { SessionData } from '@src/types/common/SessionData'
import * as crypto from 'crypto'
import { shell } from 'electron'
import * as fs from 'fs'
import * as http from 'http'
import * as path from 'path'
import { FileManagerService } from '../file-manager/file-manager.service'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(private readonly fileManagerService: FileManagerService) {}

  async login(sessionData: SessionData): Promise<boolean> {
    try {
      this.logger.log(`User login attempt: ${sessionData.userNo}`)
      await this.fileManagerService.saveSession(sessionData)
      return true
    } catch (error) {
      this.logger.error(`Login error: ${error.message}`, error.stack)
      return false
    }
  }

  async logout(): Promise<boolean> {
    try {
      this.logger.log('User logout')
      this.fileManagerService.clearSession()
      return true
    } catch (error) {
      this.logger.error(`Logout error: ${error.message}`, error.stack)
      return false
    }
  }

  async checkLoggedIn(): Promise<boolean> {
    try {
      const sessionData = this.fileManagerService.loadSession()
      return !!(sessionData && sessionData.userNo && sessionData.userToken)
    } catch (error) {
      this.logger.error(`Check login status error: ${error.message}`, error.stack)
      return false
    }
  }

  async getSession(): Promise<SessionData> {
    try {
      return this.fileManagerService.loadSession()
    } catch (error) {
      this.logger.error(`Get session error: ${error.message}`, error.stack)
      return null
    }
  }

  async createPlayerFile(data: { userNo: string; userToken: string }): Promise<boolean> {
    try {
      const { userNo, userToken } = data
      if (!userNo || !userToken) {
        throw new Error('유효하지 않은 사용자 데이터')
      }

      const documentsPath = path.join(this.fileManagerService['documentsPath'])
      const playerFilePath = path.join(documentsPath, 'player.txt')

      // 파일 내용 생성 (RACLA 형식: userNo|userToken)
      const fileContent = `${userNo}|${userToken}`
      fs.writeFileSync(playerFilePath, fileContent, 'utf-8')

      this.logger.log(`Player file created: ${playerFilePath}`)
      return true
    } catch (error) {
      this.logger.error(`Create player file error: ${error.message}`, error.stack)
      return false
    }
  }

  async openDiscordLogin(): Promise<string> {
    try {
      const state = crypto.randomBytes(16).toString('hex')
      const DISCORD_CLIENT_ID = '1331547515744682036'
      const startPort = 54321
      const endPort = 54325

      return this.tryCreateServerOnPorts(state, DISCORD_CLIENT_ID, startPort, endPort)
    } catch (error) {
      this.logger.error(`Discord OAuth 로그인 실패: ${error.message}`, error.stack)
      return null
    }
  }

  private async tryCreateServerOnPorts(
    state: string,
    clientId: string,
    currentPort: number,
    endPort: number,
  ): Promise<string> {
    if (currentPort > endPort) {
      this.logger.error(`사용 가능한 포트를 찾을 수 없습니다(${endPort}까지 시도).`)
      throw new Error('모든 포트가 사용 중입니다')
    }

    let server: http.Server | null = null
    const REDIRECT_URI = `http://localhost:${currentPort}/oauth/discord/callback`

    return new Promise((resolve, reject) => {
      server = http.createServer(async (req, res) => {
        if (req.url?.startsWith('/oauth/discord/callback')) {
          const urlObj = new URL(req.url, `http://localhost:${currentPort}`)
          const code = urlObj.searchParams.get('code')
          const returnedState = urlObj.searchParams.get('state')

          if (code && returnedState === state) {
            res.writeHead(302, {
              Location: 'https://racla.app/login/oauth/success',
            })
            res.end()

            // 모든 연결 종료 후 서버 닫기
            server?.closeAllConnections()
            server?.close(() => {
              server = null
              resolve(code)
            })
          }
        }
      })

      server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          this.logger.log(`포트 ${currentPort}는 이미 사용 중, 다음 포트 시도...`)
          // 현재 서버 닫기
          server?.close()
          server = null

          // 다음 포트로 재귀적 시도
          resolve(this.tryCreateServerOnPorts(state, clientId, currentPort + 1, endPort))
        } else {
          this.logger.error(`Discord OAuth 로그인 오류: ${error.message}`)
          reject(error)
        }
      })

      server.listen(currentPort, () => {
        const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20email&state=${state}`
        shell.openExternal(authUrl)
        this.logger.log(`OAuth 서버가 포트 ${currentPort}에서 실행 중`)
      })
    })
  }

  async openBrowser(url: string): Promise<boolean> {
    try {
      await shell.openExternal(url)
      return true
    } catch (error) {
      this.logger.error(`외부 URL 열기 실패: ${error.message}`, error.stack)
      return false
    }
  }
}
