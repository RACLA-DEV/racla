import { createOverlayLog } from '@render/libs/logger'
import { RootState } from '@render/store'
import type { Result } from 'get-windows'
import type { ProcessDescriptor } from 'ps-list'

import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

// 오버레이 모드 타입 정의
type OverlayMode = 'debug' | 'transparent' | 'minimal' | 'full'

function OverlayPage() {
  const [processes, setProcesses] = useState<ProcessDescriptor[]>([])
  const [activeWindows, setActiveWindows] = useState<Result | null>(null)
  const [messages, setMessages] = useState<string[]>([])
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('debug')
  const { font } = useSelector((state: RootState) => state.app.settingData)
  const isOverlayMode = useSelector((state: RootState) => state.ui.isOverlayMode)
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    // 문서 스타일 설정
    document.body.style.background = 'transparent'
    document.documentElement.style.background = 'transparent'

    const searchParams = new URLSearchParams(window.location.search)
    const mode = searchParams.get('mode') as OverlayMode
    if (mode && ['debug', 'transparent', 'minimal', 'full'].includes(mode)) {
      setOverlayMode(mode)
    }

    // 프로세스 리스트 초기 로드
    if (window.electron && window.electron.getProcessList) {
      window.electron.getProcessList().then((result) => {
        setProcesses(result as ProcessDescriptor[])
      })
    }

    // 활성 윈도우 초기 로드
    if (window.electron && window.electron.getActiveWindows) {
      window.electron.getActiveWindows().then((result) => {
        setActiveWindows(result as Result)
      })
    }

    // 오버레이 메시지 수신
    if (window.electron && window.electron.onOverlayMessage) {
      window.electron.onOverlayMessage((message) => {
        try {
          const data = JSON.parse(message)
          if (data.type === 'process-list') {
            setProcesses(data.data as ProcessDescriptor[])
          }
          if (data.type === 'active-windows') {
            setActiveWindows(data.data as Result)
            setIsMaximized(data.isMaximized)
          }
          setMessages((prev) => [...prev, JSON.stringify(data)])
        } catch (error) {
          createOverlayLog('error', 'Failed to parse message:', error.message)
        }
      })
    }

    // 키보드 단축키 설정
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC 키로 오버레이 닫기
      if (e.key === 'Escape') {
        if (window.electron && window.electron.closeOverlay) {
          window.electron.closeOverlay()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // 디버그 모드인 경우에도 동일한 UI 적용
  if (overlayMode === 'debug') {
    return (
      <div
        className={`tw:flex tw:flex-col tw:h-full tw:w-full tw:relative tw:bg-transparent tw:p-2`}
      >
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            fontFamily: 'monospace',
            width: 'auto',
            maxWidth: '400px',
          }}
          className={`${font != 'default' ? 'tw:font-medium' : ''}`}
        >
          <h2 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>활성 윈도우</h2>
          {activeWindows ? (
            <div style={{ fontSize: '0.9rem' }}>
              <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>{activeWindows.title}</div>
              {activeWindows.owner && (
                <div style={{ fontSize: '0.8rem', opacity: '0.9' }}>
                  <div>{activeWindows.owner.name}</div>
                  <div>PID: {activeWindows.owner.processId}</div>
                  <div>Overlay Mode: {String(isOverlayMode)}</div>
                </div>
              )}
            </div>
          ) : (
            <div>활성 윈도우 없음</div>
          )}
        </div>
      </div>
    )
  }

  // 투명 모드
  if (overlayMode === 'transparent') {
    return <div style={{ width: '100%', height: '100vh' }}></div>
  }

  // 미니멀 모드
  if (overlayMode === 'minimal') {
    return (
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          fontFamily: 'monospace',
        }}
      >
        {activeWindows ? (
          <div>
            <div style={{ fontWeight: 'bold' }}>{activeWindows.title}</div>
            {activeWindows.owner && (
              <div style={{ fontSize: '10px', opacity: '0.9', marginTop: '3px' }}>
                {activeWindows.owner.name}
              </div>
            )}
          </div>
        ) : (
          <div>활성 윈도우 없음</div>
        )}
      </div>
    )
  }

  // 기본 또는 full 모드
  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '15px',
          borderRadius: '10px',
          fontFamily: 'sans-serif',
          maxWidth: '300px',
        }}
      >
        {activeWindows ? (
          <div>
            <div style={{ fontWeight: 'bold' }}>{activeWindows.title}</div>
            {activeWindows.owner && (
              <div style={{ fontSize: '13px', opacity: '0.9', marginTop: '5px' }}>
                {activeWindows.owner.name}
              </div>
            )}
          </div>
        ) : (
          <div>활성 윈도우 없음</div>
        )}
      </div>
    </div>
  )
}

export default OverlayPage
