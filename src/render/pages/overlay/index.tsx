import { createOverlayLog } from '@render/libs/logging'
import { RootState } from '@render/store'
import type { ProcessDescriptor } from 'ps-list'

import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

// 오버레이 모드 타입 정의
type OverlayMode = 'debug' | 'transparent' | 'minimal' | 'full'

function OverlayPage() {
  const [processes, setProcesses] = useState<ProcessDescriptor[]>([])
  const [messages, setMessages] = useState<string[]>([])
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('debug')
  const { font } = useSelector((state: RootState) => state.app.settingData)

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

    // 오버레이 메시지 수신
    if (window.electron && window.electron.onOverlayMessage) {
      window.electron.onOverlayMessage((message) => {
        try {
          const data = JSON.parse(message)
          if (data.type === 'process-list') {
            setProcesses(data.data as ProcessDescriptor[])
          }
          setMessages((prev) => [...prev, JSON.stringify(data)])
        } catch (error) {
          createOverlayLog('error', 'Failed to parse message:', error)
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

  // 디버그 모드인 경우에만 내용 표시
  if (overlayMode === 'debug') {
    return (
      <div
        style={{
          background: 'rgba(0, 0, 0, 0)',
          color: 'white',
          padding: '1rem',
          height: '100vh',
          overflow: 'hidden',
          fontFamily: 'monospace',
          borderRadius: '8px',
        }}
        className={`${font != 'default' ? 'tw:font-medium' : ''}`}
      >
        <h2>Overlay Window (Debug Mode)</h2>
        <div style={{ display: 'flex', gap: '1rem', height: 'calc(100vh - 4rem)' }}>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <h3>Process List</h3>
            {processes.map((process) => (
              <div key={process.pid} style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                {process.name} (PID:
                {process.pid})
              </div>
            ))}
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            <h3>Messages</h3>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                {msg}
              </div>
            ))}
          </div>
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
          bottom: '20px',
          right: '20px',
          background: 'rgba(0, 0, 0, 0.5)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          fontFamily: 'monospace',
        }}
      >
        {/* 미니멀 모드 UI 내용 */}
        <div>RACLA Overlay Active</div>
      </div>
    )
  }

  // 기본 또는 full 모드
  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* 오버레이 UI 구현 */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '15px',
          borderRadius: '10px',
          fontFamily: 'sans-serif',
        }}
      >
        RACLA Overlay
      </div>
    </div>
  )
}

export default OverlayPage
