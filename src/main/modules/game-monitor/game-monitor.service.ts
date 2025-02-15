import { GLOBAL_DICTONARY } from '@main/constants/GLOBAL_DICTONARY'
import { Injectable } from '@nestjs/common'
import type { Result } from 'get-windows'
import type { ProcessDescriptor } from 'ps-list'

@Injectable()
export class GameMonitorService {
  // 게임 프로세스 정보를 저장
  private gameProcess: ProcessDescriptor | null = null
  private gameWindow: Result | null = null
  private cachedWindow: Result | null = null
  private lastCheckTime = 0
  private readonly CACHE_DURATION = 100; // 100ms 캐시

  public async getActiveWindows(): Promise<Result> {
    const { activeWindow } = await import('get-windows')
    return await activeWindow()
  }

  public async getProcessList(): Promise<ProcessDescriptor[]> {
    const psList = await import('ps-list')
    return await psList.default()
  }

  public async checkGameStatus(processName: string[] | string): Promise<boolean> {
    if(Array.isArray(processName)) {
      const processes = await this.getProcessList()
      this.gameProcess = processes.find(p => processName.includes(p.name)) || null
      return !!this.gameProcess
    }
    else {
      const processes = await this.getProcessList()
      this.gameProcess = processes.find(p => p.name === processName) || null
      return !!this.gameProcess
    }
  }

  public async getGameWindowInfo(): Promise<Result | null> {
    const now = Date.now()
    if (this.cachedWindow && now - this.lastCheckTime < this.CACHE_DURATION) {
      return this.cachedWindow
    }

    const activeWindow = await this.getActiveWindows()
    if (activeWindow && this.isGameWindow(activeWindow)) {
      this.cachedWindow = activeWindow
      this.lastCheckTime = now
      return activeWindow
    }
    
    this.cachedWindow = null
    return null
  }

  private isGameWindow(window: Result): boolean {
    if(GLOBAL_DICTONARY.SUPPORTED_GAME_PROCESS_NAME_LIST.map(game => game.replace('.exe', '')).includes(window.title)) {
      return true
    }
    return false
  }

  public getGameWindowBounds() {
    return this.gameWindow
  }
}
