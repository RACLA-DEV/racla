import { IpcHandle } from '@doubleshot/nest-electron'
import { Controller, Logger } from '@nestjs/common'
import { OAuthService } from './oauth.service'

@Controller()
export class OAuthController {
  private readonly logger = new Logger(OAuthController.name)

  constructor(private readonly oauthService: OAuthService) {}

  @IpcHandle('app:open-discord-login')
  async handleDiscordLogin(): Promise<string> {
    this.logger.log('Discord OAuth 로그인 요청 받음')
    try {
      const code = await this.oauthService.startDiscordOAuth()
      this.logger.log('Discord OAuth 코드 획득 성공')
      return code
    } catch (error) {
      this.logger.error(`Discord OAuth 로그인 실패: ${error.message}`)
      return null
    }
  }

  @IpcHandle('app:open-browser')
  async openExternalUrl(url: string): Promise<boolean> {
    this.logger.log(`외부 URL 열기 요청: ${url}`)
    try {
      const { shell } = require('electron')
      await shell.openExternal(url)
      return true
    } catch (error) {
      this.logger.error(`외부 URL 열기 실패: ${error.message}`)
      return false
    }
  }
}
