import TrackMakerModal from '@render/components/track-maker/TrackMakerModal'
import { createLog } from '@render/libs/logger'
import { RootState } from '@render/store'
import { setIsTrackMaker } from '@render/store/slices/appSlice'
import type {
  DifficultyType,
  PatternDTO,
  PatternPageResponse,
} from '@src/types/track-maker/TrackMaker'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

// 컴포넌트 스타일
const styles = {
  container: 'tw:p-6 tw:h-full tw:bg-white tw:dark:bg-slate-800',
  header: 'tw:mb-6 tw:flex tw:justify-between tw:items-center',
  title: 'tw:text-2xl tw:font-bold tw:dark:text-white',
  buttonGroup: 'tw:flex tw:gap-3',
  button:
    'tw:px-4 tw:py-2 tw:bg-indigo-600 tw:text-white tw:rounded-md tw:hover:bg-indigo-700 tw:transition-colors',
  secondaryButton:
    'tw:px-4 tw:py-2 tw:bg-gray-200 tw:dark:bg-slate-700 tw:text-gray-800 tw:dark:text-white tw:rounded-md tw:hover:bg-gray-300 tw:dark:hover:bg-slate-600 tw:transition-colors',
  grid: 'tw:grid tw:grid-cols-1 md:tw:grid-cols-2 lg:tw:grid-cols-3 tw:gap-6 tw:mt-8',
  card: 'tw:bg-gray-50 tw:dark:bg-slate-700 tw:rounded-lg tw:shadow-md tw:overflow-hidden tw:transition-transform tw:duration-200 tw:hover:scale-105',
  cardHeader:
    'tw:p-4 tw:bg-gray-100 tw:dark:bg-slate-600 tw:border-b tw:border-gray-200 tw:dark:border-slate-500',
  cardTitle:
    'tw:font-bold tw:text-lg tw:dark:text-white tw:flex tw:justify-between tw:items-center',
  cardBody: 'tw:p-4',
  cardInfo: 'tw:flex tw:flex-col tw:gap-2 tw:text-sm tw:text-gray-600 tw:dark:text-gray-300',
  cardFooter:
    'tw:p-4 tw:bg-gray-100 tw:dark:bg-slate-600 tw:border-t tw:border-gray-200 tw:dark:border-slate-500 tw:flex tw:justify-between tw:items-center',
  paginationContainer: 'tw:flex tw:justify-center tw:mt-8 tw:gap-2',
  paginationButton:
    'tw:px-3 tw:py-1 tw:bg-gray-200 tw:dark:bg-slate-700 tw:rounded tw:text-gray-700 tw:dark:text-gray-300 tw:hover:bg-gray-300 tw:dark:hover:bg-slate-600 tw:transition-colors',
  activePaginationButton:
    'tw:px-3 tw:py-1 tw:bg-indigo-600 tw:text-white tw:rounded tw:hover:bg-indigo-700 tw:transition-colors',
  disabledPaginationButton:
    'tw:px-3 tw:py-1 tw:bg-gray-100 tw:dark:bg-slate-800 tw:rounded tw:text-gray-400 tw:dark:text-gray-600 tw:cursor-not-allowed',
  tagContainer: 'tw:flex tw:gap-2 tw:mb-2',
  difficultyTag: (difficulty: DifficultyType) => {
    switch (difficulty) {
      case 'EASY':
        return 'tw:px-2 tw:py-1 tw:text-xs tw:bg-green-100 tw:text-green-800 tw:dark:bg-green-900 tw:dark:text-green-200 tw:rounded'
      case 'NORMAL':
        return 'tw:px-2 tw:py-1 tw:text-xs tw:bg-blue-100 tw:text-blue-800 tw:dark:bg-blue-900 tw:dark:text-blue-200 tw:rounded'
      case 'HARD':
        return 'tw:px-2 tw:py-1 tw:text-xs tw:bg-yellow-100 tw:text-yellow-800 tw:dark:bg-yellow-900 tw:dark:text-yellow-200 tw:rounded'
      case 'MAXIMUM':
        return 'tw:px-2 tw:py-1 tw:text-xs tw:bg-red-100 tw:text-red-800 tw:dark:bg-red-900 tw:dark:text-red-200 tw:rounded'
      default:
        return 'tw:px-2 tw:py-1 tw:text-xs tw:bg-gray-100 tw:text-gray-800 tw:dark:bg-gray-900 tw:dark:text-gray-200 tw:rounded'
    }
  },
  keyModeTag:
    'tw:px-2 tw:py-1 tw:text-xs tw:bg-purple-100 tw:text-purple-800 tw:dark:bg-purple-900 tw:dark:text-purple-200 tw:rounded',
  loadingContainer: 'tw:flex tw:justify-center tw:items-center tw:h-48',
  loading: 'tw:animate-spin tw:h-8 tw:w-8 tw:text-indigo-500',
  likeCount: 'tw:flex tw:items-center tw:gap-1 tw:text-sm',
  emptyState: 'tw:text-center tw:text-gray-500 tw:dark:text-gray-400 tw:p-8',
}

const TrackMakerHub: React.FC = () => {
  const { t } = useTranslation(['common', 'track-maker'])
  const dispatch = useDispatch()
  const { settingData } = useSelector((state: RootState) => state.app)

  // 상태 관리
  const [patterns, setPatterns] = useState<PatternDTO[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [currentPage, setCurrentPage] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [pageSize] = useState<number>(9)

  // 패턴 데이터 조회
  const fetchPatterns = async (page = 0) => {
    try {
      setIsLoading(true)

      // API 호출
      const response = await fetch(
        `/api/v3/racla/trackMaker/explore/patterns?page=${page}&size=${pageSize}`,
      )

      if (!response.ok) {
        throw new Error('Failed to fetch patterns')
      }

      const data: PatternPageResponse = await response.json()

      // 데이터 설정
      setPatterns(data.content)
      setTotalPages(data.totalPages)
      setCurrentPage(data.page)
    } catch (error) {
      createLog('error', 'fetchPatterns', {
        error: error,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 패턴 생성하기 버튼 클릭 핸들러
  const handleCreatePattern = () => {
    dispatch(setIsTrackMaker(true))
  }

  // 초기 데이터 로드
  useEffect(() => {
    void fetchPatterns()
  }, [])

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    void fetchPatterns(page)
  }

  // 난이도 표시 함수
  const formatDifficulty = (difficulty: DifficultyType) => {
    switch (difficulty) {
      case 'EASY':
        return t('track-maker:difficulty.easy')
      case 'NORMAL':
        return t('track-maker:difficulty.normal')
      case 'HARD':
        return t('track-maker:difficulty.hard')
      case 'MAXIMUM':
        return t('track-maker:difficulty.maximum')
      default:
        return difficulty
    }
  }

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  // 페이지네이션 렌더링
  const renderPagination = () => {
    return (
      <div className={styles.paginationContainer}>
        <button
          className={currentPage === 0 ? styles.disabledPaginationButton : styles.paginationButton}
          onClick={() => {
            handlePageChange(currentPage - 1)
          }}
          disabled={currentPage === 0}
        >
          {t('common:pagination.prev')}
        </button>

        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          // 현재 페이지를 중심으로 5개의 페이지 번호 표시
          let pageNum
          if (totalPages <= 5) {
            pageNum = i
          } else if (currentPage < 2) {
            pageNum = i
          } else if (currentPage > totalPages - 3) {
            pageNum = totalPages - 5 + i
          } else {
            pageNum = currentPage - 2 + i
          }

          return (
            <button
              key={pageNum}
              className={
                currentPage === pageNum ? styles.activePaginationButton : styles.paginationButton
              }
              onClick={() => {
                handlePageChange(pageNum)
              }}
            >
              {pageNum + 1}
            </button>
          )
        })}

        <button
          className={
            currentPage === totalPages - 1
              ? styles.disabledPaginationButton
              : styles.paginationButton
          }
          onClick={() => {
            handlePageChange(currentPage + 1)
          }}
          disabled={currentPage === totalPages - 1}
        >
          {t('common:pagination.next')}
        </button>
      </div>
    )
  }

  return (
    <>
      <div
        className={`${styles.container} ${settingData.font !== 'default' ? 'tw:font-medium' : ''}`}
      >
        <div className={styles.header}>
          <h1 className={styles.title}>{t('track-maker:hub.title')}</h1>
          <div className={styles.buttonGroup}>
            <button className={styles.button} onClick={handleCreatePattern}>
              {t('track-maker:hub.createPattern')}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loading}>
              <svg
                className='tw:animate-spin tw:h-8 tw:w-8'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
              >
                <circle
                  className='tw:opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                ></circle>
                <path
                  className='tw:opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                ></path>
              </svg>
            </div>
          </div>
        ) : patterns.length === 0 ? (
          <div className={styles.emptyState}>
            <p>{t('track-maker:hub.noPatterns')}</p>
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {patterns.map((pattern) => (
                <div key={pattern.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitle}>
                      <span>{pattern.name}</span>
                    </div>
                    <div className={styles.tagContainer}>
                      <span className={styles.difficultyTag(pattern.difficultyType)}>
                        {formatDifficulty(pattern.difficultyType)}
                      </span>
                      <span className={styles.keyModeTag}>{pattern.keyMode}</span>
                    </div>
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.cardInfo}>
                      <div>
                        {t('track-maker:hub.song')}: {pattern.songName}
                      </div>
                      <div>
                        {t('track-maker:hub.creator')}: {pattern.playerName}
                      </div>
                      <div>
                        {t('track-maker:hub.bpm')}: {pattern.bpm}
                      </div>
                      <div>
                        {t('track-maker:hub.notes')}: {pattern.notes.length}
                      </div>
                    </div>
                  </div>
                  <div className={styles.cardFooter}>
                    <span>{formatDate(pattern.createdAt)}</span>
                    <div className={styles.likeCount}>
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        className='tw:h-5 tw:w-5'
                        fill={pattern.isLiked ? 'currentColor' : 'none'}
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
                        />
                      </svg>
                      {pattern.likeCount}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && renderPagination()}
          </>
        )}
      </div>

      {/* 트랙 메이커 모달 */}
      <TrackMakerModal />
    </>
  )
}

export default TrackMakerHub
