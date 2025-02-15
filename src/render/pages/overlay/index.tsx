import type { ProcessDescriptor } from 'ps-list'

import { useEffect, useState } from 'react'

function OverlayPage() {
  const [processes, setProcesses] = useState<ProcessDescriptor[]>([])
  const [messages, setMessages] = useState<string[]>([])

  useEffect(() => {
    // 프로세스 리스트 초기 로드
    window.electron.getProcessList().then(setProcesses)

    // 오버레이 메시지 수신
    window.electron.onOverlayMessage((message) => {
      try {
        const data = JSON.parse(message)
        if (data.type === 'process-list') {
          setProcesses(data.data)
        }
        setMessages((prev) => [...prev, JSON.stringify(data)])
      } catch (error) {
        console.error('Failed to parse message:', error)
      }
    })
  }, [])

  return (
    <div
      style={{
        background: 'rgba(0, 0, 0, 0.0)',
        color: 'white',
        padding: '1rem',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <h2>Overlay Window</h2>
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

export default OverlayPage
