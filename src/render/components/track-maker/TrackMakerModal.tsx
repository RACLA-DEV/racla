import { RootState } from '@render/store'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import TrackMaker from './TrackMaker'
import styles from './TrackMakerModal.module.css'
import TrackPlayer from './TrackPlayer'

const TrackMakerModal: React.FC = () => {
  const { isTrackMaker, settingData } = useSelector((state: RootState) => state.app)
  const { theme } = useSelector((state: RootState) => state.ui)
  const [selectedTab, setSelectedTab] = useState<string>('editor')
  const [pattern, setPattern] = useState<any[]>([])
  const [bpm, setBpm] = useState<number>(120)
  const [keyMode, setKeyMode] = useState<'4B' | '5B' | '6B' | '8B'>('4B')

  const handleTabSelect = (tab: string) => {
    setSelectedTab(tab)
  }

  const handlePatternChange = (newPattern: any[]) => {
    setPattern(newPattern)
  }

  const handleBpmChange = (newBpm: number) => {
    setBpm(newBpm)
  }

  const handleKeyModeChange = (newKeyMode: '4B' | '5B' | '6B' | '8B') => {
    setKeyMode(newKeyMode)
  }

  return (
    <div
      className={`tw:fixed ${settingData.font != 'default' ? 'tw:font-medium' : ''} tw:flex tw:flex-col tw:h-[calc(100vh-72px)] tw:top-[40px] ${theme == 'dark' ? 'tw:bg-slate-800' : 'tw:bg-white'} tw:max-h-screen tw:w-full tw:inset-0 tw:z-50 tw:transition-opacity tw:duration-300 ${
        isTrackMaker ? 'tw:opacity-100' : 'tw:opacity-0 tw:pointer-events-none'
      }`}
    >
      <div
        className={`tw:pt-2 ${theme == 'dark' ? 'tw:border-b tw:border-slate-700' : 'tw:border-b tw:border-gray-200'}`}
      >
        <div className='tw:flex'>
          <button
            className={`tw:px-4 tw:pb-2 tw:font-medium tw:text-sm tw:focus:outline-none ${
              selectedTab === 'editor'
                ? `tw:border-b-2 tw:border-indigo-500 ${theme === 'dark' ? 'tw:text-gray-200' : 'tw:text-gray-700'}`
                : 'tw:text-gray-400 tw:hover:text-gray-700'
            }`}
            onClick={() => handleTabSelect('editor')}
          >
            에디터
          </button>
          <button
            className={`tw:px-4 tw:pb-2 tw:font-medium tw:text-sm tw:focus:outline-none ${
              selectedTab === 'player'
                ? `tw:border-b-2 tw:border-indigo-500 ${theme === 'dark' ? 'tw:text-gray-200' : 'tw:text-gray-700'}`
                : 'tw:text-gray-400 tw:hover:text-gray-700'
            }`}
            onClick={() => handleTabSelect('player')}
          >
            플레이
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {selectedTab === 'editor' ? (
          <TrackMaker
            pattern={pattern}
            onPatternChange={handlePatternChange}
            bpm={bpm}
            onBpmChange={handleBpmChange}
            keyMode={keyMode}
            onKeyModeChange={handleKeyModeChange}
          />
        ) : (
          <TrackPlayer pattern={pattern} bpm={bpm} keyMode={keyMode} />
        )}
      </div>
    </div>
  )
}

export default TrackMakerModal
