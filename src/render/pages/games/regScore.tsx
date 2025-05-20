import { Icon } from '@iconify/react'
import ScorePopupComponent from '@render/components/score/ScorePopup'
import { useNotificationSystem } from '@render/hooks/useNotifications'
import { createLog } from '@render/libs/logger'
import { RootState } from '@render/store'
import {
  addOcrResult,
  clearOcrResults,
  completeOcrProcess,
  removeOcrResult,
  startOcrProcess,
} from '@render/store/slices/appSlice'
import { GameType } from '@src/types/games/GameType'
import { ResultCardProps } from '@src/types/render/ResultCardProps'
import { ResultDisplayProps } from '@src/types/render/ResultDisplayProps'
import { AnimatePresence, motion } from 'framer-motion'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { PuffLoader } from 'react-spinners'

export default function RegScorePage() {
  const { gameCode } = useParams<{ gameCode: GameType }>() as { gameCode: GameType }
  const { t } = useTranslation(['regScore'])
  const { showNotification } = useNotificationSystem()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { gameOcrStates, userData } = useSelector((state: RootState) => state.app)
  const [isDragging, setIsDragging] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const dropAreaRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const resultsContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (userData.playerName === '') {
      navigate('/')
      showNotification(
        {
          mode: 'i18n',
          ns: 'regScore',
          value: 'needLogin',
        },
        'error',
      )
    }
  }, [])

  // OCR 결과 가져오기 - 게임별 상태
  const ocrState = gameOcrStates[gameCode]
  const ocrResults = ocrState.results
  const isProcessing = ocrState.isProcessing
  const totalFiles = ocrState.totalImages
  const processedFiles = ocrState.processedImages

  // 결과가 추가되면 스크롤 조정
  useEffect(() => {
    if (resultsContainerRef.current && ocrResults.length > 0) {
      setTimeout(() => {
        resultsContainerRef.current?.scrollTo({
          top: 0, // 항상 최상단으로 스크롤 (최신 결과가 상단에 표시됨)
          behavior: 'smooth',
        })
      }, 100)
    }
  }, [ocrResults.length])

  // 드래그 앤 드롭 이벤트 핸들러
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  // 이미지 처리 함수 (백엔드 배치 처리 방식으로 변경)
  const processImages = useCallback(
    async (files: File[]) => {
      try {
        if (files.length === 0) return

        // 이미지 파일만 필터링
        const imageFiles = files.filter((file) => file.type.startsWith('image/'))
        if (imageFiles.length === 0) {
          createLog('error', 'No image files to process')
          showNotification(
            {
              mode: 'i18n',
              ns: 'regScore',
              value: 'noImageFiles',
            },
            'error',
          )
          return
        }

        // Redux에 처리 시작 상태 설정
        dispatch(startOcrProcess({ totalImages: imageFiles.length, gameCode }))

        // 각 이미지 파일을 ArrayBuffer로 변환
        const imageBuffers: Buffer[] = []
        for (const file of imageFiles) {
          try {
            const arrayBuffer = await file.arrayBuffer()
            imageBuffers.push(new Uint8Array(arrayBuffer) as unknown as Buffer)
          } catch (error) {
            createLog('error', `Error converting image: ${error.message}`)
            showNotification(
              {
                mode: 'i18n',
                ns: 'regScore',
                value: 'convertImageError',
              },
              'error',
            )
            continue
          }
        }

        // 백엔드에 일괄 처리 요청
        if (imageBuffers.length === 1) {
          // 단일 이미지인 경우 기존 API 사용
          try {
            const result = await window.electron?.getOcrResultServer({
              image: imageBuffers[0],
              gameCode,
            })

            if (result) {
              dispatch(addOcrResult(result))
            }
          } catch (error) {
            createLog('error', `Single image OCR processing error: ${error.message}`)
            showNotification(
              {
                mode: 'i18n',
                ns: 'regScore',
                value: 'ocrError',
              },
              'error',
            )
          }
        } else if (imageBuffers.length > 0) {
          // 다중 이미지인 경우 배치 처리 API 사용
          try {
            const results = await window.electron?.processImagesBatch({
              images: imageBuffers,
              gameCode,
            })

            if (results && Array.isArray(results)) {
              // 결과가 이미 Redux에 실시간으로 추가되었으므로 별도로 추가하지 않음
              // 여기서 추가하면 중복 발생 가능성 있음
              createLog('debug', `Batch processing complete: ${results.length} results`)
            }
          } catch (error) {
            createLog('error', `Batch image OCR processing error: ${error.message}`)
            showNotification(
              {
                mode: 'i18n',
                ns: 'regScore',
                value: 'ocrErrorMultiple',
              },
              'warning',
            )
          }
        }

        // 처리 완료 상태 설정
        dispatch(completeOcrProcess(gameCode))
      } catch (error) {
        createLog('error', 'OCR processing error:', error)
        // 오류 발생 시에도 처리 완료 상태로 변경
        dispatch(completeOcrProcess(gameCode))
      }
    },
    [dispatch],
  )

  // 파일 드롭 처리
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processImages(Array.from(e.dataTransfer.files))
      }
    },
    [processImages],
  )

  // 파일 선택 처리
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processImages(Array.from(e.target.files))
      }
    },
    [processImages],
  )

  // 파일 선택 버튼 클릭 시 처리
  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // 결과 삭제 처리
  const handleRemoveResult = useCallback(
    (index: number) => {
      // 직접 removeOcrResult 액션 사용
      dispatch(removeOcrResult({ index, gameCode }))
    },
    [dispatch],
  )

  // 모든 결과 삭제
  const handleClearAllResults = useCallback(() => {
    dispatch(clearOcrResults(gameCode))
  }, [dispatch])

  return (
    <div className='tw:flex tw:flex-col tw:h-[calc(100vh-106px)] tw:relative'>
      {/* 상단 영역 */}
      <div className='tw:p-2 tw:pb-4 tw:bg-white tw:dark:bg-slate-800 tw:border-b tw:border-slate-200 tw:dark:border-slate-700'>
        <div className='tw:flex tw:items-center tw:justify-between'>
          <div>
            <h2 className='tw:text-xl tw:font-bold tw:text-slate-800 tw:dark:text-white'>
              {t('scoreRegistration')}
            </h2>
          </div>
          <div className='tw:flex tw:gap-2'>
            {/* 보기 모드 전환 */}
            <div className='tw:flex tw:bg-slate-100 tw:dark:bg-slate-700 tw:rounded-md'>
              <button
                onClick={() => setViewMode('grid')}
                className={`tw:p-2 tw:rounded-md tw:transition-colors ${
                  viewMode === 'grid'
                    ? 'tw:bg-indigo-500 tw:text-white'
                    : 'tw:text-slate-700 tw:dark:text-slate-200 hover:tw:bg-slate-200 hover:tw:dark:bg-slate-600'
                }`}
              >
                <Icon icon='lucide:grid' className='tw:w-5 tw:h-5' />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`tw:p-2 tw:rounded-md tw:transition-colors ${
                  viewMode === 'list'
                    ? 'tw:bg-indigo-500 tw:text-white'
                    : 'tw:text-slate-700 tw:dark:text-slate-200 hover:tw:bg-slate-200 hover:tw:dark:bg-slate-600'
                }`}
              >
                <Icon icon='lucide:list' className='tw:w-5 tw:h-5' />
              </button>
            </div>

            {/* 모두 지우기 버튼 */}
            {ocrResults.length > 0 && (
              <button
                onClick={handleClearAllResults}
                className='tw:px-3 tw:py-2 tw:rounded-md tw:bg-red-100 tw:dark:bg-red-900/30 tw:text-red-700 tw:dark:text-red-400 hover:tw:bg-red-200 hover:tw:dark:bg-red-800/30 tw:transition-colors tw:text-sm'
              >
                <div className='tw:flex tw:items-center tw:gap-1'>
                  <Icon icon='lucide:trash-2' className='tw:w-4 tw:h-4' />
                  <span>{t('clearAll')}</span>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className='tw:flex tw:flex-1 tw:overflow-hidden'>
        {/* 왼쪽: 드래그 앤 드롭 영역 - 화면이 좁아지면 작게 표시 */}
        <div className='tw:w-1/3 tw:min-w-[300px] tw:pt-4 tw:pr-4 tw:border-r tw:border-slate-200 tw:dark:border-slate-700'>
          <div
            ref={dropAreaRef}
            className={`tw:h-full tw:border-2 tw:border-dashed tw:rounded-lg tw:flex tw:flex-col tw:items-center tw:justify-center tw:transition-all tw:cursor-pointer ${
              isDragging
                ? 'tw:border-indigo-500 tw:bg-indigo-50 tw:dark:bg-indigo-900/20'
                : 'tw:border-slate-300 tw:dark:border-slate-700 tw:bg-slate-50 tw:dark:bg-slate-800/50'
            } ${isProcessing ? 'tw:pointer-events-none tw:opacity-70' : ''} `}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleClick}
          >
            <input
              ref={fileInputRef}
              type='file'
              className='tw:hidden'
              accept='image/*'
              onChange={handleFileChange}
              multiple
            />

            {isProcessing ? (
              <div className='tw:flex tw:flex-col tw:items-center tw:gap-4 tw:p-8'>
                <PuffLoader color='#6366f1' size={32} />
                {totalFiles > 1 && (
                  <p className='tw:text-sm tw:text-slate-500 tw:dark:text-slate-400'>
                    {t('processing')} ({processedFiles}/{totalFiles})
                  </p>
                )}
              </div>
            ) : (
              <div className='tw:flex tw:flex-col tw:items-center tw:gap-4 tw:p-8'>
                <Icon
                  icon='lucide:image-plus'
                  className='tw:w-16 tw:h-16 tw:text-slate-400 tw:dark:text-slate-500'
                />
                <p className='tw:text-lg tw:font-semibold tw:text-slate-700 tw:text-center tw:dark:text-slate-300'>
                  {t('dragAndDropImage')}
                </p>
                <p className='tw:text-sm tw:text-slate-500 tw:dark:text-slate-400'>
                  {t('orClickToSelect')}
                </p>
                <button
                  className='tw:mt-4 tw:px-4 tw:py-2 tw:bg-indigo-500 tw:text-white tw:rounded-md hover:tw:bg-indigo-600 tw:transition-colors'
                  onClick={(e) => {
                    e.stopPropagation()
                    fileInputRef.current?.click()
                  }}
                >
                  {t('selectImage')}
                </button>
                <p className='tw:text-xs tw:text-slate-500 tw:dark:text-slate-400 tw:mt-2 tw:text-center'>
                  {t('djmaxRespectV')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽: 결과 표시 영역 */}
        <div
          ref={resultsContainerRef}
          className='tw:flex-1 tw:overflow-y-scroll tw:custom-scrollbar tw:p-4 tw:bg-slate-50 tw:dark:bg-slate-800/30'
        >
          {ocrResults.length === 0 ? (
            <div className='tw:h-full tw:flex tw:flex-col tw:items-center tw:justify-center tw:p-4'>
              <Icon
                icon='lucide:inbox'
                className='tw:w-16 tw:h-16 tw:text-slate-300 tw:dark:text-slate-600'
              />
              <p className='tw:mt-4 tw:text-lg tw:font-semibold tw:text-slate-500 tw:dark:text-slate-400'>
                {t('noResults')}
              </p>
              <p className='tw:text-sm tw:text-slate-400 tw:dark:text-slate-500'>
                {t('uploadImage')}
              </p>
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'tw:grid tw:grid-cols-1 md:tw:grid-cols-2 lg:tw:grid-cols-3 tw:gap-4'
                  : 'tw:flex tw:flex-col tw:gap-4'
              }
            >
              <AnimatePresence>
                {/* 최신 결과가 이미 배열의 앞부분에 있으므로 항상 순서대로 표시 */}
                {ocrResults.map((result, index) => (
                  <motion.div
                    key={`result-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className='tw:relative'
                  >
                    <button
                      className='tw:absolute tw:top-2 tw:right-2 tw:z-10 tw:p-1 tw:rounded-md tw:bg-white/80 tw:dark:bg-slate-800/80 tw:text-slate-500 hover:tw:text-red-500 tw:transition-colors'
                      onClick={() => handleRemoveResult(index)}
                    >
                      <Icon icon='lucide:x' className='tw:w-5 tw:h-5' />
                    </button>
                    <ResultDisplay result={result} viewMode={viewMode} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ResultDisplay({ result, viewMode }: ResultDisplayProps) {
  const hasVersusData = result.versusData && result.versusData.length > 0

  return (
    <div className={`tw:w-full ${viewMode === 'list' ? 'tw:flex tw:flex-col' : ''}`}>
      {/* 메인 결과 */}
      <ResultCard data={result} isMain={true} viewMode={viewMode} />

      {/* versus 데이터 */}
      {hasVersusData && (
        <div
          className={`tw:mt-2 ${viewMode === 'list' ? 'tw:pl-8' : 'tw:grid tw:grid-cols-3 tw:gap-2'}`}
        >
          {result.versusData.map((versusItem, index) => (
            <ResultCard
              key={`versus-${index}`}
              data={versusItem}
              isMain={false}
              viewMode={viewMode}
              className={viewMode === 'list' ? 'tw:mt-2' : ''}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ResultCard({ data, isMain, viewMode, className = '' }: ResultCardProps) {
  return (
    <div
      className={`tw:bg-white tw:dark:bg-slate-800 tw:rounded-lg tw:overflow-hidden tw:shadow-md tw:border ${
        isMain
          ? 'tw:border-indigo-500 tw:dark:border-indigo-400'
          : 'tw:border-slate-200 tw:dark:border-slate-700'
      } ${className}`}
    >
      <div className={`tw:flex ${viewMode === 'list' ? 'tw:flex-row' : 'tw:flex-col'}`}>
        {/* 왼쪽/상단 이미지 영역 */}
        <div
          className={`${
            viewMode === 'list'
              ? 'tw:self-stretch tw:p-6 tw:min-w-[80px] tw:flex tw:items-center tw:justify-center'
              : 'tw:w-full tw:p-3 tw:flex tw:justify-center'
          } tw:bg-gradient-to-br tw:from-slate-100 tw:to-slate-200 tw:dark:from-slate-800 tw:dark:to-slate-900`}
        >
          {/* 패턴 이미지 */}
          <div className='tw:w-20 tw:h-20 tw:rounded-full tw:bg-gradient-to-br tw:from-purple-500 tw:to-blue-600 tw:flex tw:items-center tw:justify-center'>
            <ScorePopupComponent songTitle={data.songData.title} keyMode={String(data.button)} />
          </div>
        </div>

        {/* 오른쪽/하단 정보 영역 */}
        <div
          className={`${viewMode === 'list' ? 'tw:w-full' : 'tw:w-full'} tw:p-3 tw:flex tw:gap-1 tw:flex-col tw:justify-between`}
        >
          {/* 상단 곡 정보 */}
          <div>
            {/* 메인 결과 표시 */}
            {/* {isMain && (
              <div className='tw:mb-1'>
                <span className='tw:text-xs tw:py-0.5 tw:px-1.5 tw:bg-indigo-500 tw:text-white tw:rounded'>
                  MAIN
                </span>
              </div>
            )} */}

            {/* 제목 */}
            <h3 className='tw:text-lg tw:font-bold tw:text-slate-800 tw:dark:text-white tw:line-clamp-1'>
              {data.songData.name}
            </h3>

            {/* 아티스트 */}
            <p className='tw:text-sm tw:text-slate-600 tw:dark:text-gray-300 tw:line-clamp-1'>
              {data.songData.composer}
            </p>

            {/* 점수 */}
            <div className='tw:flex tw:justify-between tw:items-center tw:mt-1'>
              <span className='tw:text-lg tw:font-bold tw:text-slate-800 tw:dark:text-white'>
                {data.score}%{' '}
                {data?.lastScore ? (
                  data.score.toFixed(2) >= data.lastScore.toFixed(2) ? (
                    data.score.toFixed(2) == data.lastScore.toFixed(2) ? (
                      <></>
                    ) : (
                      <span className='tw:text-blue-500 tw:rounded'>
                        (+
                        {(
                          Number(data.score.toFixed(2)) - Number(data.lastScore.toFixed(2))
                        ).toFixed(2)}
                        %)
                      </span>
                    )
                  ) : (
                    <span className='tw:text-red-500 tw:rounded'>
                      (-
                      {(Number(data.lastScore.toFixed(2)) - Number(data.score.toFixed(2))).toFixed(
                        2,
                      )}
                      %)
                    </span>
                  )
                ) : (
                  ''
                )}
              </span>
              <div className='tw:flex tw:space-x-1'>
                {/* 퍼펙트 타입 */}
                {data.score === 100.0 && (
                  <span className='tw:text-xs tw:py-0.5 tw:px-1.5 tw:bg-purple-600 tw:text-white tw:rounded'>
                    PERFECT
                  </span>
                )}
                {data.maxCombo && (
                  <span className='tw:text-xs tw:py-0.5 tw:px-1.5 tw:bg-lime-500 tw:text-white tw:rounded'>
                    MAX COMBO
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 하단 부가 정보 */}
          <div className='tw:mt-2'>
            {/* 난이도 정보 */}
            <div className='tw:flex tw:flex-wrap tw:gap-1.5'>
              <div className='tw:rounded tw:px-1.5 tw:py-0.5 tw:text-xs tw:text-slate-800 tw:dark:text-slate-200 tw:bg-slate-200 tw:dark:bg-slate-700'>
                {data.button}B
              </div>
              <div className='tw:rounded tw:px-1.5 tw:py-0.5 tw:text-xs tw:text-slate-800 tw:dark:text-slate-200 tw:bg-slate-200 tw:dark:bg-slate-700'>
                {data.pattern}
              </div>
              {(data.songData.patterns?.[`${data.button}B`]?.[data.pattern] || data?.level) && (
                <div className='tw:rounded tw:px-1.5 tw:py-0.5 tw:text-xs tw:text-slate-800 tw:dark:text-slate-200 tw:bg-slate-200 tw:dark:bg-slate-700'>
                  {data?.level
                    ? `Lv.${data.level}`
                    : `Lv.${data.songData.patterns?.[`${data.button}B`]?.[data.pattern].level}`}
                </div>
              )}
              {data.max && data.score === 100.0 ? (
                <div className='tw:rounded tw:px-1.5 tw:py-0.5 tw:text-xs tw:text-slate-800 tw:dark:text-slate-200 tw:bg-slate-200 tw:dark:bg-slate-700'>
                  MAX-{data.max}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
