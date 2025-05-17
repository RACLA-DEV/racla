import { useEffect } from 'react'

interface ScoreEditModalProps {
  gameCode?: string
  show: boolean
  onHide: () => void
  patternMaxCombo: boolean
  setPatternMaxCombo: (value: boolean) => void
  updateScore: number
  setUpdateScore: (value: number) => void
  updateMax?: number
  setUpdateMax?: (value: number) => void
  onSave: () => void
}

export default function ScoreEditComponent({
  gameCode,
  show,
  onHide,
  patternMaxCombo,
  setPatternMaxCombo,
  updateScore,
  setUpdateScore,
  updateMax,
  setUpdateMax,
  onSave,
}: ScoreEditModalProps) {
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && show) {
        onHide()
      }
    }

    window.addEventListener('keydown', handleEscKey)
    return () => {
      window.removeEventListener('keydown', handleEscKey)
    }
  }, [show, onHide])

  return (
    <div
      className={`tw:fixed tw:inset-0 tw:z-[9999] tw:transition-opacity tw:duration-300 ${
        show ? 'tw:opacity-100 tw:pointer-events-auto' : 'tw:opacity-0 tw:pointer-events-none'
      }`}
    >
      <div className='tw:fixed tw:inset-0 tw:bg-black/60' onClick={onHide} />
      <div className='tw:fixed tw:inset-0 tw:flex tw:items-center tw:justify-center'>
        <div
          className={`tw:bg-white tw:dark:bg-slate-800 tw:border tw:border-gray-200 tw:dark:border-slate-700 tw:rounded-md tw:p-5 tw:transition-all tw:duration-300 tw:w-96 ${show ? 'tw:opacity-100 tw:translate-y-0' : 'tw:opacity-0 tw:translate-y-4'}`}
        >
          <div className='tw:flex tw:items-center tw:text-center tw:mb-6'>
            <span className='tw:text-lg tw:font-bold tw:w-full tw:text-gray-900 tw:dark:text-white'>
              점수 수정
            </span>
          </div>

          <div className='tw:flex tw:flex-col tw:gap-4'>
            <div className='tw:flex tw:flex-col tw:gap-1'>
              <div className='tw:flex tw:justify-center tw:items-center tw:gap-2'>
                <span className='tw:text-sm tw:font-bold tw:mb-0.5 tw:text-gray-900 tw:dark:text-white'>
                  MAX COMBO
                </span>
                <button
                  className={`tw:relative tw:inline-flex tw:items-center tw:h-4 tw:w-8 tw:rounded-full tw:transition-colors tw:duration-300 ${
                    patternMaxCombo ? 'tw:bg-indigo-600' : 'tw:bg-gray-300 tw:dark:bg-gray-600'
                  }`}
                  onClick={() => {
                    setPatternMaxCombo(!patternMaxCombo)
                  }}
                >
                  <span
                    className={`tw:inline-block tw:h-3 tw:w-3 tw:bg-white tw:rounded-full tw:absolute tw:shadow tw:transform tw:transition-all tw:duration-300 ${
                      patternMaxCombo ? 'tw:right-0.5' : 'tw:left-0.5'
                    }`}
                  />
                </button>
              </div>
              <span className='tw:text-sm tw:font-light tw:text-gray-500 tw:dark:text-gray-400 tw:text-center'>
                패턴 MAX COMBO 달성 여부를 설정합니다
              </span>
            </div>

            <div className='tw:flex tw:flex-col tw:gap-1'>
              <input
                className='form-control tw:py-1.5 tw:text-sm tw:bg-white tw:dark:bg-slate-700 tw:text-center tw:font-extrabold tw:rounded-md tw:border tw:border-gray-300 tw:dark:border-slate-600 tw:text-gray-900 tw:dark:text-white'
                type='number'
                min='0'
                max='100'
                step='0.0001'
                value={updateScore !== undefined && updateScore !== null ? Number(updateScore) : 0}
                onChange={(e) => {
                  setUpdateScore(Number(e.currentTarget.value))
                }}
              />
              <span className='tw:text-sm tw:font-light tw:text-gray-500 tw:dark:text-gray-400 tw:text-center'>
                점수를 입력해주세요 (0-100)
              </span>
            </div>

            {gameCode == 'platina_lab' && (
              <div className='tw:flex tw:flex-col tw:gap-1'>
                <input
                  className='form-control tw:py-1.5 tw:text-sm tw:bg-white tw:dark:bg-slate-700 tw:text-center tw:font-extrabold tw:rounded-md tw:border tw:border-gray-300 tw:dark:border-slate-600 tw:text-gray-900 tw:dark:text-white'
                  type='number'
                  min='0'
                  max='3000'
                  step='1'
                  value={updateMax !== undefined && updateMax !== null ? Number(updateMax) : 0}
                  onChange={(e) => {
                    setUpdateMax(Number(e.currentTarget.value))
                  }}
                />
                <span className='tw:text-sm tw:font-light tw:text-gray-500 tw:dark:text-gray-400 tw:text-center'>
                  PERFECT를 달성한 경우 MAX-값을 입력해주세요.(0-3000)
                </span>
              </div>
            )}

            <div className='tw:flex tw:justify-end tw:gap-2'>
              <button
                className='tw:bg-white tw:dark:bg-slate-700 tw:border tw:border-gray-300 tw:dark:border-slate-600 hover:tw:bg-gray-100 hover:tw:dark:bg-slate-600 tw:text-gray-700 tw:dark:text-gray-200 tw:px-4 tw:py-1.5 tw:rounded-md tw:text-sm tw:transition-colors'
                onClick={onHide}
              >
                취소
              </button>
              <button
                className='tw:bg-indigo-600 hover:tw:bg-indigo-700 tw:text-white tw:px-4 tw:py-1.5 tw:rounded-md tw:text-sm tw:transition-colors'
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
