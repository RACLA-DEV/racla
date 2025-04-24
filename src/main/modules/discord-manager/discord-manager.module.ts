import { Module } from '@nestjs/common'
import { DiscordManagerController } from './discord-manager.controller'
import { DiscordManagerService } from './discord-manager.service'

@Module({
  imports: [],
  controllers: [DiscordManagerController],
  providers: [DiscordManagerService],
  exports: [DiscordManagerService],
})
export class DiscordManagerModule {}
