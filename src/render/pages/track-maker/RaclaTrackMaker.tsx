import React, { useState } from 'react'
import TrackMaker from '../../components/track-maker/TrackMaker'
import TrackPlayer from '../../components/track-maker/TrackPlayer'
import styles from './RaclaTrackMaker.module.css'

const RaclaTrackMaker: React.FC = () => {
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
    <div className={styles.container}>
      <div className={styles.tabContainer}>
        <div className='tw:flex tw:border-b tw:border-gray-200'>
          <button
            className={`tw:px-4 tw:py-2 tw:font-medium tw:text-sm tw:focus:outline-none ${
              selectedTab === 'editor'
                ? 'tw:border-b-2 tw:border-blue-500 tw:text-blue-600'
                : 'tw:text-gray-500 tw:hover:text-gray-700'
            }`}
            onClick={() => handleTabSelect('editor')}
          >
            패턴 에디터
          </button>
          <button
            className={`tw:px-4 tw:py-2 tw:font-medium tw:text-sm tw:focus:outline-none ${
              selectedTab === 'player'
                ? 'tw:border-b-2 tw:border-blue-500 tw:text-blue-600'
                : 'tw:text-gray-500 tw:hover:text-gray-700'
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

export default RaclaTrackMaker
