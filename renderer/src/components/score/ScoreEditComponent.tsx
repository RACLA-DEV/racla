import React, { useEffect } from 'react'
import Image from 'next/image'
import { FiX } from 'react-icons/fi'

interface ScoreEditModalProps {
  show: boolean
  onHide: () => void
  patternMaxCombo: boolean
  setPatternMaxCombo: (value: boolean) => void
  updateScore: number
  setUpdateScore: (value: number) => void
  onSave: () => void
}

export default function ScoreEditComponent({ show, onHide, patternMaxCombo, setPatternMaxCombo, updateScore, setUpdateScore, onSave }: ScoreEditModalProps) {
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && show) {
        onHide()
      }
    }

    window.addEventListener('keydown', handleEscKey)
    return () => window.removeEventListener('keydown', handleEscKey)
  }, [show, onHide])

  return (
    <div
      className={`tw-fixed tw-inset-0 tw-z-[9999] tw-transition-opacity tw-duration-300 ${
        show ? 'tw-opacity-100 tw-pointer-events-auto' : 'tw-opacity-0 tw-pointer-events-none'
      }`}
    >
      <div className="tw-fixed tw-inset-0 tw-bg-gray-950 tw-bg-opacity-90" onClick={onHide} />
      <div className="tw-fixed tw-inset-0 tw-flex tw-items-center tw-justify-center">
        <div
          className={`tw-bg-gray-900 tw-rounded-md tw-p-5  
            tw-transition-all tw-duration-300 tw-w-96 ${show ? 'tw-opacity-100 tw-translate-y-0' : 'tw-opacity-0 tw-translate-y-4'}`}
        >
          <div className="tw-flex tw-items-center tw-text-center tw-mb-6">
            <span className="tw-text-lg tw-font-bold tw-w-full">점수 수정</span>
          </div>

          <div className="tw-flex tw-flex-col tw-gap-4">
            <div className="tw-flex tw-flex-col tw-gap-1">
              <div className="tw-flex tw-justify-center tw-items-center tw-gap-2">
                <span className="tw-text-sm tw-font-bold tw-mb-0.5">MAX COMBO</span>
                <button
                  className={`tw-relative tw-inline-flex tw-items-center tw-h-4 tw-w-8 tw-rounded-full tw-transition-colors tw-duration-300 ${
                    patternMaxCombo ? 'tw-bg-blue-600' : 'tw-bg-gray-600'
                  }`}
                  onClick={() => setPatternMaxCombo(!patternMaxCombo)}
                >
                  <span
                    className={`tw-inline-block tw-h-3 tw-w-3 tw-bg-white tw-rounded-full tw-absolute tw-shadow tw-transform tw-transition-all tw-duration-300 ${
                      patternMaxCombo ? 'tw-right-0.5' : 'tw-left-0.5'
                    }`}
                  />
                </button>
              </div>
              <span className="tw-text-xs tw-font-light tw-text-gray-400 tw-text-center">패턴 MAX COMBO 달성 여부를 설정합니다</span>
            </div>

            <div className="tw-flex tw-flex-col tw-gap-1">
              <input
                className="form-control tw-text-sm tw-bg-gray-900 tw-bg-opacity-20 tw-text-center tw-font-extrabold tw-rounded-md tw-border tw-border-gray-700"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={updateScore !== undefined && updateScore !== null ? Number(updateScore) : 0}
                onChange={(e) => setUpdateScore(Number(e.currentTarget.value))}
              />
              <span className="tw-text-xs tw-font-light tw-text-gray-400 tw-text-center">점수를 입력해주세요 (0-100)</span>
            </div>

            <div className="tw-flex tw-justify-end tw-gap-2">
              <button
                className="tw-bg-gray-800 hover:tw-bg-gray-700 tw-text-white tw-px-4 tw-py-1.5 tw-rounded-md tw-text-sm tw-transition-colors"
                onClick={onHide}
              >
                취소
              </button>
              <button
                className="tw-bg-blue-600 hover:tw-bg-blue-700 tw-text-white tw-px-4 tw-py-1.5 tw-rounded-md tw-text-sm tw-transition-colors"
                onClick={onSave}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
