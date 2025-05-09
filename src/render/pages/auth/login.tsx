import { Icon } from '@iconify/react/dist/iconify.js'
import { createLog } from '@render/libs/logger'
import { setOpenExternalLink } from '@render/store/slices/uiSlice'
import { SessionData } from '@src/types/sessions/SessionData'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { FaDiscord, FaV } from 'react-icons/fa6'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import apiClient from '../../../libs/apiClient'
import { useAuth } from '../../hooks/useAuth'
import { useNotificationSystem } from '../../hooks/useNotifications'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoggedIn } = useAuth()
  const { showNotification } = useNotificationSystem()
  const dispatch = useDispatch()
  const { t } = useTranslation()

  const raFileInputRef = useRef<HTMLInputElement>(null)
  const vArchiveFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/home')
    }
  }, [isLoggedIn, navigate])

  const handleError = (error: string) => {
    // 실제 알림 시스템 구현 시 사용
    createLog('error', error)
    showNotification({ mode: 'i18n', value: error }, 'error')
    window.electron.logout()
  }

  const onVArchiveFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const fileReader = new FileReader()

    fileReader.onload = async () => {
      const text = fileReader.result?.toString().trim() ?? ''

      try {
        if (
          // account.txt 유효성 검증
          text.includes(' ') &&
          text.split(' ').length === 2 &&
          !Number.isNaN(Number(text.split(' ')[0])) &&
          text.split(' ')[1].includes('-') &&
          text.split(' ')[1].split('-')[0].length === 8 &&
          text.split(' ')[1].split('-')[1].length === 4 &&
          text.split(' ')[1].split('-')[2].length === 4 &&
          text.split(' ')[1].split('-')[3].length === 4 &&
          text.split(' ')[1].split('-')[4].length === 12
        ) {
          try {
            const userNo = text.split(' ')[0]
            const token = text.split(' ')[1]

            const response = await apiClient.post<SessionData>(
              `/v3/racla/player/login/oauth/v-archive`,
              {
                externalServiceUserNo: userNo,
                externalServiceUserToken: token,
              },
            )

            if (response.status === 200) {
              const sessionData = response.data.data
              const success = await login(sessionData)

              if (success) {
                showNotification(
                  {
                    mode: 'i18n',
                    value: 'auth.loginSuccess',
                    props: { userName: sessionData.playerName },
                  },
                  'success',
                )
                navigate('/home')
              }
            } else {
              handleError('auth.vArchiveLoginFailed')
            }
          } catch (error) {
            createLog('error', 'V-ARCHIVE Login Error:', error.message)
            handleError('auth.vArchiveServerError')
          }
        } else {
          handleError('auth.invalidVArchiveUserInfo')
        }
      } catch (error) {
        createLog('error', 'Error in onVArchiveFileChange:', error.message)
        handleError('auth.unknownError')
        if (vArchiveFileInputRef.current) {
          vArchiveFileInputRef.current.value = ''
        }
        if (raFileInputRef.current) {
          raFileInputRef.current.value = ''
        }
      }
    }

    try {
      fileReader.readAsText(file)
    } catch (error) {
      createLog('error', 'Error reading file:', error.message)
      handleError('auth.unknownError')
    }
  }

  const handleVArchiveFileSelect = () => {
    createLog('debug', 'Select V-ARCHIVE account.txt file')
    vArchiveFileInputRef.current?.click()
  }

  const handleDiscordLogin = async () => {
    try {
      const code = await window.electron.openDiscordLogin()
      createLog('debug', 'Received Discord OAuth Code:', code)

      if (!code) {
        handleError('auth.discordLoginCanceled')
        return
      }

      const response = await apiClient.post<SessionData>(`/v3/racla/player/login/oauth/discord`, {
        externalServiceCode: code,
      })

      if (response.status === 200) {
        const sessionData = response.data.data
        const success = await login(sessionData)

        if (success) {
          showNotification(
            {
              mode: 'i18n',
              value: 'auth.loginSuccess',
              props: { userName: sessionData.playerName },
            },
            'success',
          )
          navigate('/home')
        }
      } else {
        handleError('auth.discordLoginFailed')
      }
    } catch (error) {
      createLog('error', 'Discord Login Error:', error.message)
      handleError('auth.discordLoginFailed')
    }
  }

  return (
    <div className='tw:flex tw:h-[calc(100vh-7rem)] tw:items-center tw:justify-center tw:px-4 tw:py-12'>
      <div className='tw:w-full tw:max-w-md'>
        <div className='tw:flex tw:flex-col tw:gap-1 tw:overflow-hidden tw:rounded-lg tw:bg-slate-800 tw:p-8 tw:shadow-lg tw:dark:bg-slate-800'>
          {/* 상단 */}
          <div className='tw:mb-6 tw:flex tw:w-full'>
            <span className='tw:me-auto tw:text-2xl tw:font-bold'>{t('auth.login')}</span>
          </div>

          {/* 컨텐츠 */}
          <div className='tw:relative' style={{ minHeight: 'auto' }}>
            <div className='tw:w-full'>
              {/* 로그인 섹션 내용 */}
              <div className='tw:space-y-4'>
                <div className='tw:flex tw:flex-col tw:gap-4'>
                  <input
                    ref={vArchiveFileInputRef}
                    type='file'
                    accept='.txt'
                    onChange={(e) => {
                      onVArchiveFileChange(e)
                    }}
                    className='tw:hidden'
                  />

                  {/* 로그인 버튼 */}
                  <button
                    onClick={() => {
                      void handleDiscordLogin()
                    }}
                    className='tw:flex tw:w-full tw:items-center tw:justify-center tw:gap-2 tw:rounded-md tw:bg-[#5865F2] tw:px-4 tw:py-3 tw:text-white tw:transition-colors tw:hover:bg-[#4752C4]'
                  >
                    <FaDiscord className='tw:text-lg' />
                    {t('auth.loginWithDiscord')}
                  </button>

                  <button
                    onClick={handleVArchiveFileSelect}
                    className='tw:flex tw:w-full tw:items-center tw:justify-center tw:gap-2 tw:rounded-md tw:bg-amber-600 tw:px-4 tw:py-3 tw:text-white tw:transition-colors tw:hover:bg-amber-700'
                  >
                    <FaV className='tw:text-base' />
                    {t('auth.loginWithVArchive')}
                  </button>
                </div>

                <div className='tw:mt-6 tw:flex tw:items-start tw:justify-center tw:gap-3 tw:border-t tw:border-slate-700 tw:pt-8 tw:text-sm tw:text-slate-300'>
                  <Icon icon='lucide:info' className='tw:mt-1 tw:min-w-3 tw:text-blue-400' />
                  <div className='tw:flex tw:flex-col tw:gap-1 tw:break-keep'>
                    <span>{t('auth.announcement_1')}</span>
                    <span>{t('auth.announcement_2')}</span>
                    <span>{t('auth.announcement_3')}</span>
                    <span>{t('auth.announcement_4')}</span>
                    <span
                      className='tw:flex tw:cursor-pointer tw:items-center tw:gap-1 tw:text-blue-400 tw:transition-colors tw:hover:text-blue-300'
                      onClick={() =>
                        dispatch(setOpenExternalLink('https://v-archive.net/downloads'))
                      }
                    >
                      {t('auth.announcement_5')} <Icon icon='lucide:external-link' />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
