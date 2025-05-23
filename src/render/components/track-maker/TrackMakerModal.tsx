import { RootState } from '@render/store'
import { setIsTrackMaker } from '@render/store/slices/appSlice'
import type { Note } from '@src/types/track-maker/TrackMaker'
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import TrackMaker from './TrackMaker'
import styles from './TrackMakerModal.module.css'
import TrackPlayer from './TrackPlayer'

const TrackMakerModal: React.FC = () => {
  const { isTrackMaker, settingData } = useSelector((state: RootState) => state.app)
  const [selectedTab, setSelectedTab] = useState<string>('editor')
  const [pattern, setPattern] = useState<Note[]>([])
  const [bpm, setBpm] = useState<number>(120)
  const [keyMode, setKeyMode] = useState<'4B' | '5B' | '6B' | '8B'>('4B')
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleTabSelect = (tab: string) => {
    setSelectedTab(tab)
  }

  const handlePatternChange = (newPattern: Note[]) => {
    setPattern(newPattern)
  }

  const handleBpmChange = (newBpm: number) => {
    setBpm(newBpm)
  }

  const handleKeyModeChange = (newKeyMode: '4B' | '5B' | '6B' | '8B') => {
    setKeyMode(newKeyMode)
  }

  const handleCloseModal = () => {
    dispatch(setIsTrackMaker(false))
    navigate('/track-maker')
  }

  return (
    <div
      className={`tw:fixed ${settingData.font != 'default' ? 'tw:font-medium' : ''} tw:flex tw:flex-col tw:h-[calc(100vh-72px)] tw:top-[40px] tw:dark:bg-slate-800 tw:bg-white tw:max-h-screen tw:w-full tw:inset-0 tw:z-50 tw:transition-opacity tw:duration-300 ${
        isTrackMaker ? 'tw:opacity-100' : 'tw:opacity-0 tw:pointer-events-none'
      }`}
    >
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

      <div
        className={`tw:pt-2 tw:w-full tw:border-t tw:flex tw:dark:border-slate-700 tw:border-gray-200`}
      >
        <button
          className={`tw:px-4 tw:pb-2 tw:font-medium tw:text-sm tw:focus:outline-none ${
            selectedTab === 'editor'
              ? `tw:border-b-2 tw:border-indigo-500 tw:dark:text-gray-200 tw:text-gray-700`
              : 'tw:text-gray-400 tw:hover:text-gray-700'
          }`}
          onClick={() => {
            handleTabSelect('editor')
          }}
        >
          에디터
        </button>
        <button
          className={`tw:px-4 tw:pb-2 tw:me-auto tw:font-medium tw:text-sm tw:focus:outline-none ${
            selectedTab === 'player'
              ? `tw:border-b-2 tw:border-indigo-500 tw:dark:text-gray-200 tw:text-gray-700`
              : 'tw:text-gray-400 tw:hover:text-gray-700'
          }`}
          onClick={() => {
            handleTabSelect('player')
          }}
        >
          플레이
        </button>

        <button
          className={`tw:px-4 tw:pb-2 tw:font-medium tw:text-sm tw:focus:outline-none ${
            selectedTab === 'racla'
              ? `tw:border-b-2 tw:border-indigo-500 tw:dark:text-gray-200 tw:text-gray-700`
              : 'tw:text-gray-400 tw:hover:text-gray-700'
          }`}
          onClick={handleCloseModal}
        >
          허브로 돌아가기
        </button>
      </div>
    </div>
  )
}

export default TrackMakerModal
