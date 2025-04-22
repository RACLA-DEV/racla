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
      const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1331547515744682036'
      const REDIRECT_URI = 'http://localhost:54321/oauth/discord/callback'
      let server: http.Server | null = null

      return new Promise((resolve, reject) => {
        server = http.createServer(async (req, res) => {
          if (req.url?.startsWith('/oauth/discord/callback')) {
            const urlObj = new URL(req.url, `http://localhost:54321`)
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

        server.listen(54321, () => {
          const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20email&state=${state}`
          shell.openExternal(authUrl)
        })

        server.on('error', (error: any) => {
          if (error.code === 'EADDRINUSE') {
            this.logger.error('Port 54321 is already in use')
            reject(new Error('Port 54321 is already in use'))
          } else {
            this.logger.error(`Discord OAuth 로그인 오류: ${error.message}`)
            reject(error)
          }
        })
      })
    } catch (error) {
      this.logger.error(`Discord OAuth 로그인 실패: ${error.message}`, error.stack)
      return null
    }
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
