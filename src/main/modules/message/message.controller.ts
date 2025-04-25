import { IpcHandle } from '@doubleshot/nest-electron'

import { Controller } from '@nestjs/common'
import { Observable, of } from 'rxjs'
import { MessageService } from './message.service'

@Controller()
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
  ) {}

  @IpcHandle('message:send-msg')
  public handleSendMsg(msg: string): Observable<string> {
    const response = this.messageService.createResponse(msg)
    return of(response)
  }
}
