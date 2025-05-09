import { IpcHandle } from '@doubleshot/nest-electron'
import { Controller, Logger } from '@nestjs/common'
import type { LocalSessionData } from '@src/types/sessions/LocalSessionData'
import { AuthManagerService } from './auth-manager.service'

@Controller()
export class AuthManagerController {
  private readonly logger = new Logger(AuthManagerController.name)

  constructor(private readonly authManagerService: AuthManagerService) {}

  @IpcHandle('auth-manager:login')
  async login(sessionData: LocalSessionData): Promise<boolean> {
    try {
      this.logger.log(`User login attempt: ${sessionData.playerId}`)
      return await this.authManagerService.login(sessionData)
    } catch (error) {
      this.logger.error(`Login error: ${error.message}`, error.stack)
      return false
    }
  }

  @IpcHandle('auth-manager:logout')
  logout(): boolean {
    try {
      this.logger.log('User logout')
      return this.authManagerService.logout()
    } catch (error) {
      this.logger.error(`Logout error: ${error.message}`, error.stack)
      return false
    }
  }

  @IpcHandle('auth-manager:check-logged-in')
  checkLoggedIn(): boolean {
    try {
      return this.authManagerService.checkLoggedIn()
    } catch (error) {
      this.logger.error(`Check login status error: ${error.message}`, error.stack)
      return false
    }
  }

  @IpcHandle('auth-manager:get-session')
  async getSession(): Promise<LocalSessionData> {
    try {
      return await this.authManagerService.getSession()
    } catch (error) {
      this.logger.error(`Get session error: ${error.message}`, error.stack)
      return null
    }
  }

  @IpcHandle('auth-manager:create-player-file')
  createPlayerFile(data: { playerId: number; playerToken: string }): boolean {
    try {
      return this.authManagerService.createPlayerFile(data)
    } catch (error) {
      this.logger.error(`Create player file error: ${error.message}`, error.stack)
      return false
    }
  }

  @IpcHandle('auth-manager:open-discord-login')
  async openDiscordLogin(): Promise<string> {
    try {
      this.logger.log('Discord OAuth 로그인 요청 받음')
      return await this.authManagerService.openDiscordLogin()
    } catch (error) {
      this.logger.error(`Discord OAuth 로그인 실패: ${error.message}`, error.stack)
      return null
    }
  }

  @IpcHandle('auth-manager:open-browser')
  async openBrowser(url: string): Promise<boolean> {
    try {
      this.logger.log(`외부 URL 열기: ${url}`)
      return await this.authManagerService.openBrowser(url)
    } catch (error) {
      this.logger.error(`외부 URL 열기 실패: ${error.message}`, error.stack)
      return false
    }
  }
}
