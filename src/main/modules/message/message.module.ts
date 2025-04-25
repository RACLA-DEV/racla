import { Module } from '@nestjs/common'
import { LoggerModule } from '../logger/logger.module'
import { MessageController } from './message.controller'
import { MessageService } from './message.service'

@Module({
  imports: [LoggerModule],
  controllers: [MessageController],
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule {}
