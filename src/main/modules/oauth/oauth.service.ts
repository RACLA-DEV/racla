import { Injectable, Logger } from '@nestjs/common'
import * as crypto from 'crypto'
import { BrowserWindow, shell } from 'electron'
import * as http from 'http'
import * as url from 'url'

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name)
  private server: http.Server | null = null
  private authWindow: BrowserWindow | null = null
  private resolveCodePromise: (code: string) => void = null
  private rejectCodePromise: (reason: Error) => void = null

  // Discord OAuth 설정 (환경 변수 또는 설정 파일에서 가져오는 것이 좋음)
  private readonly discordClientId = process.env.DISCORD_CLIENT_ID || '1141982795351134259'
  private readonly discordRedirectUri = 'http://localhost:3000/auth/discord/callback'
  private readonly discordScopes = ['identify', 'email']

  /**
   * Discord OAuth 인증 창을 열고 인증 코드를 받는 프로세스 시작
   * @returns 인증 성공 시 Discord에서 반환한 코드
   */
  async startDiscordOAuth(): Promise<string> {
    // 이미 인증 중이면 기존 프로세스 취소
    this.cleanupOAuth()

    // 로컬 서버 시작
    await this.startLocalServer()

    // 사용자 경험 향상을 위한 상태 및 PKCE 도전 값 생성
    const state = crypto.randomBytes(16).toString('hex')
    const codeVerifier = crypto.randomBytes(32).toString('hex')
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    // OAuth 인증 URL 생성
    const authUrl = new URL('https://discord.com/api/oauth2/authorize')
    authUrl.searchParams.append('client_id', this.discordClientId)
    authUrl.searchParams.append('redirect_uri', this.discordRedirectUri)
    authUrl.searchParams.append('response_type', 'code')
    authUrl.searchParams.append('scope', this.discordScopes.join(' '))
    authUrl.searchParams.append('state', state)
    authUrl.searchParams.append('code_challenge', codeChallenge)
    authUrl.searchParams.append('code_challenge_method', 'S256')
    authUrl.searchParams.append('prompt', 'consent')

    // 사용자의 기본 브라우저에서 OAuth 인증 URL 열기
    shell.openExternal(authUrl.toString())

    // 인증 코드를 비동기로 기다리기
    return new Promise<string>((resolve, reject) => {
      this.resolveCodePromise = resolve
      this.rejectCodePromise = reject

      // 5분 후 타임아웃
      setTimeout(
        () => {
          if (this.resolveCodePromise) {
            this.cleanupOAuth()
            reject(new Error('인증 시간이 초과되었습니다.'))
          }
        },
        5 * 60 * 1000,
      )
    })
  }

  /**
   * 로컬 서버를 시작하여 OAuth 리디렉션을 처리
   */
  private async startLocalServer(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        const parsedUrl = url.parse(req.url, true)

        // OAuth 콜백 URL인 경우에만 처리
        if (parsedUrl.pathname === '/auth/discord/callback') {
          const code = parsedUrl.query.code as string
          const state = parsedUrl.query.state as string
          const error = parsedUrl.query.error as string

          // 완료 HTML 응답
          const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>인증 완료</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  margin: 0;
                  background-color: #f5f5f5;
                }
                .container {
                  text-align: center;
                  padding: 2rem;
                  background-color: white;
                  border-radius: 8px;
                  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                  max-width: 80%;
                }
                h1 {
                  margin-bottom: 1rem;
                  color: ${error ? '#e74c3c' : '#2ecc71'};
                }
                p {
                  margin-bottom: 2rem;
                  color: #333;
                }
                .close-button {
                  padding: 0.5rem 1rem;
                  background-color: #3498db;
                  color: white;
                  border: none;
                  border-radius: 4px;
                  cursor: pointer;
                }
                .close-button:hover {
                  background-color: #2980b9;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>${error ? '인증 실패' : '인증 완료'}</h1>
                <p>${
                  error
                    ? '인증 과정에서 오류가 발생했습니다. RACLA로 돌아가서 다시 시도해주세요.'
                    : '인증이 성공적으로 완료되었습니다. 이 창은 닫으셔도 됩니다.'
                }</p>
                <button class="close-button" onclick="window.close()">창 닫기</button>
              </div>
              <script>
                // 5초 후 자동으로 창 닫기
                setTimeout(() => window.close(), 5000);
              </script>
            </body>
          </html>
          `

          // 응답 헤더 및 본문 설정
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end(html)

          // 인증 결과 처리
          if (error) {
            this.logger.error(`OAuth 오류: ${error}`)
            this.rejectCodePromise?.(new Error(error))
          } else if (code) {
            this.logger.log('OAuth 코드 수신 성공')
            this.resolveCodePromise?.(code)
          }

          // 서버 정리
          setTimeout(() => this.cleanupOAuth(), 1000)
        }
      })

      // 로컬 서버를 포트 3000에서 시작
      this.server.listen(3000, 'localhost', () => {
        this.logger.log('OAuth 콜백 서버가 시작되었습니다: http://localhost:3000')
        resolve()
      })

      this.server.on('error', (err) => {
        if ((err as any).code === 'EADDRINUSE') {
          this.logger.warn('포트 3000이 이미 사용 중입니다. 서버가 이미 실행 중일 수 있습니다.')
          resolve() // 이미 실행 중인 서버가 있을 가능성이 있으므로 에러로 처리하지 않음
        } else {
          this.logger.error(`서버 시작 오류: ${err.message}`)
          reject(err)
        }
      })
    })
  }

  /**
   * OAuth 관련 리소스 정리
   */
  cleanupOAuth(): void {
    // 인증 창 닫기
    if (this.authWindow) {
      this.authWindow.close()
      this.authWindow = null
    }

    // 로컬 서버 종료
    if (this.server && this.server.listening) {
      this.server.close()
      this.server = null
    }

    // 프로미스 참조 정리
    this.resolveCodePromise = null
    this.rejectCodePromise = null
  }
}
