import { Client } from 'discord-rpc'
import log from 'electron-log/main'
import { BUILD_DATE } from '../renderer/constants/buildInfo'
import { customAxios } from './axios'
import { logMainError } from './mainLogger'

log.transports.console.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'

const CLIENT_ID =
  BUILD_DATE.includes('Dev') || process.env.NODE_ENV === 'development'
    ? '0000000000000000000'
    : '0000000000000000000'

interface RecentScore {
  songName: string
  button: string
  pattern: string
  score: number
  maxCombo: boolean
  playedAt: string
  gameCode: string
}

class DiscordManager {
  private client: Client
  private isConnected: boolean = false
  private userData: any = null
  private startTimestamp: number | null = null

  constructor() {
    this.client = new Client({ transport: 'ipc' })
    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    this.client.on('ready', () => {
      this.isConnected = true
      log.info('Discord RPC Connected')
    })

    this.client.on('disconnected', () => {
      this.isConnected = false
      log.info('Discord RPC Disconnected')
    })
  }

  async initialize(userData: any = null) {
    try {
      this.userData = userData
      await this.client.login({ clientId: CLIENT_ID })
      await this.updatePresence()
    } catch (error) {
      log.error('Discord RPC initialization failed:', error)
      logMainError(error, this.userData)
    }
  }

  async updatePresence(gameData?: {
    songName?: string
    button?: string
    pattern?: string
    score?: number
    max?: number
    level?: number
    maxCombo?: boolean
    gameCode?: string
  }) {
    if (!this.isConnected) return

    if (!this.startTimestamp) {
      this.startTimestamp = Date.now()
    }

    try {
      if (gameData) {
        await this.client.setActivity({
          details: `${
            gameData.gameCode === 'djmax_respect_v'
              ? 'DMRV'
              : gameData.gameCode === 'wjmax'
                ? 'WJMAX'
                : gameData.gameCode === 'platina_lab'
                  ? 'PLATiNA :: LAB'
                  : null
          } - ${gameData.songName}`,
          state: `${String(gameData.button).replace('B', '')}B | ${gameData.pattern}${gameData?.level && gameData.gameCode === 'platina_lab' ? ` Lv.${gameData?.level})` : ''} | ${gameData.score.toFixed(2)}% ${gameData?.max && gameData.score == 100 ? (gameData?.max == 0 ? 'MAX' : `MAX-${gameData?.max}`) : ''} ${gameData.maxCombo && gameData.score !== 100 && gameData.gameCode != 'platina_lab' ? '(MAX COMBO)' : ''}`,
          largeImageKey: 'racla_logo',
          largeImageText: 'RACLA for Desktop',
          startTimestamp: this.startTimestamp,
        })
      } else if (this.userData?.userNo && this.userData?.userToken) {
        const recentScore = await this.getRecentScore()
        if (recentScore) {
          await this.client.setActivity({
            details: `${
              recentScore.gameCode === 'djmax_respect_v'
                ? 'DMRV'
                : recentScore.gameCode === 'wjmax'
                  ? 'WJMAX'
                  : recentScore.gameCode === 'platina_lab'
                    ? 'PLATiNA :: LAB'
                    : null
            } - ${recentScore.songName}`,
            state: `${String(recentScore.button).replace('B', '')}B | ${recentScore.pattern} | ${recentScore.score.toFixed(2)}% ${recentScore.maxCombo ? '(MAX COMBO)' : ''}`,
            largeImageKey: 'racla_logo',
            largeImageText: 'RACLA for Desktop',
            startTimestamp: this.startTimestamp,
          })
        } else {
          await this.setDefaultPresence()
        }
      } else {
        await this.setDefaultPresence()
      }
    } catch (error) {
      log.error('Failed to update Discord presence:', error)
      logMainError(error, this.userData)
    }
  }

  private async getRecentScore(): Promise<RecentScore | null> {
    try {
      const response = await customAxios.get(
        `${process.env.NODE_ENV === 'production' ? 'https://api.racla.app/api' : 'https://api.racla.app/api'}/v2/racla/play/history/${this.userData.userNo}/djmax_respect_v`,
        {
          headers: {
            Authorization: `${this.userData.userNo}|${this.userData.userToken}`,
          },
        },
      )

      if (
        response.data.success &&
        response.data.recentHistory &&
        response.data.recentHistory.length > 0
      ) {
        const recentPlay = response.data.recentHistory[0]
        return {
          songName: recentPlay.songName,
          button: recentPlay.keyType,
          pattern: recentPlay.difficultyType,
          score: recentPlay.score,
          maxCombo: recentPlay.maxCombo,
          playedAt: recentPlay.playedAt,
          gameCode: recentPlay.gameCode,
        }
      }
      return null
    } catch (error) {
      log.error('Failed to fetch recent score:', error)
      logMainError(error, this.userData)
      return null
    }
  }

  private async setDefaultPresence() {
    await this.client.setActivity({
      details: 'RACLA for Desktop',
      largeImageKey: 'racla_logo',
      largeImageText: 'RACLA for Desktop',
      startTimestamp: this.startTimestamp || Date.now(),
    })
  }

  destroy() {
    if (this.isConnected) {
      this.client.destroy()
      this.isConnected = false
    }
  }
}

export const discordManager = new DiscordManager()
