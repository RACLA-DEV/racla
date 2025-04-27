import { IpcHandle } from '@doubleshot/nest-electron'
import { Controller } from '@nestjs/common'
import type { PlayData } from '@src/types/common/PlayData'
import { DiscordManagerService } from './discord-manager.service'

@Controller()
export class DiscordManagerController {
  constructor(private readonly discordManagerService: DiscordManagerService) {}

  @IpcHandle('discord-manager:initialize')
  async initialize(): Promise<void> {
    return await this.discordManagerService.initialize()
  }

  @IpcHandle('discord-manager:update-presence')
  async updatePresence(gameData: PlayData) {
    return this.discordManagerService.updatePresence(gameData)
  }

  @IpcHandle('discord-manager:destroy')
  destroy() {
    this.discordManagerService.destroy()
  }
}
