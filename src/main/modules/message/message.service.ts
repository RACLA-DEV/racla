import { Injectable } from '@nestjs/common'
import { BrowserWindow } from 'electron'

@Injectable()
export class MessageService {
  constructor() {}

  public getTime(): number {
    return new Date().getTime()
  }

  public sendToRenderer(window: BrowserWindow, channel: string, message: any): void {
    window.webContents.send(channel, message)
  }

  public createResponse(msg: string): string {
    return `The main process received your message: ${msg} at time: ${this.getTime()}`
  }
}
