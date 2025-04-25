import { IpcHandle } from '@doubleshot/nest-electron'
import { Controller } from '@nestjs/common'
import { DiscordManagerService } from './discord-manager.service'

interface GameData {
  songName?: string
  button?: string
  pattern?: string
  score?: number
  max?: number
  level?: number
  maxCombo?: boolean
  gameCode?: string
}

@Controller()
export class DiscordManagerController {
  constructor(private readonly discordManagerService: DiscordManagerService) {}

  @IpcHandle('discord-manager:initialize')
  async initialize() {
    return this.discordManagerService.initialize()
  }

  @IpcHandle('discord-manager:update-presence')
  async updatePresence(gameData: GameData) {
    return this.discordManagerService.updatePresence(gameData)
  }

  @IpcHandle('discord-manager:destroy')
  destroy() {
    return this.discordManagerService.destroy()
  }
}
