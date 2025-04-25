import { IpcHandle } from '@doubleshot/nest-electron'
import { Controller, Logger } from '@nestjs/common'
import type { SessionData } from '@src/types/common/SessionData'
import { AuthService } from './auth.service'

@Controller()
export class AuthController {
  private readonly logger = new Logger(AuthController.name)

  constructor(private readonly authService: AuthService) {}

  @IpcHandle('auth:login')
  async login(sessionData: SessionData): Promise<boolean> {
    try {
      this.logger.log(`User login attempt: ${sessionData.userNo}`)
      return await this.authService.login(sessionData)
    } catch (error) {
      this.logger.error(`Login error: ${error.message}`, error.stack)
      return false
    }
  }

  @IpcHandle('auth:logout')
  logout(): boolean {
    try {
      this.logger.log('User logout')
      return this.authService.logout()
    } catch (error) {
      this.logger.error(`Logout error: ${error.message}`, error.stack)
      return false
    }
  }

  @IpcHandle('auth:check-logged-in')
  checkLoggedIn(): boolean {
    try {
      return this.authService.checkLoggedIn()
    } catch (error) {
      this.logger.error(`Check login status error: ${error.message}`, error.stack)
      return false
    }
  }

  @IpcHandle('auth:get-session')
  async getSession(): Promise<SessionData> {
    try {
      return await this.authService.getSession()
    } catch (error) {
      this.logger.error(`Get session error: ${error.message}`, error.stack)
      return null
    }
  }

  @IpcHandle('auth:create-player-file')
  createPlayerFile(data: { userNo: string; userToken: string }): boolean {
    try {
      return this.authService.createPlayerFile(data)
    } catch (error) {
      this.logger.error(`Create player file error: ${error.message}`, error.stack)
      return false
    }
  }

  @IpcHandle('auth:open-discord-login')
  async openDiscordLogin(): Promise<string> {
    try {
      this.logger.log('Discord OAuth 로그인 요청 받음')
      return await this.authService.openDiscordLogin()
    } catch (error) {
      this.logger.error(`Discord OAuth 로그인 실패: ${error.message}`, error.stack)
      return null
    }
  }

  @IpcHandle('auth:open-browser')
  async openBrowser(url: string): Promise<boolean> {
    try {
      this.logger.log(`외부 URL 열기: ${url}`)
      return await this.authService.openBrowser(url)
    } catch (error) {
      this.logger.error(`외부 URL 열기 실패: ${error.message}`, error.stack)
      return false
    }
  }
}
