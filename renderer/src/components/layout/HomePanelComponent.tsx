import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'store'
import { setHomePanelOpen, setHomePanelCategory, setUpdateIndex, setSlideDirection } from 'store/slices/uiSlice'

interface HomePanelProps {
  noticeSection: React.ReactNode
  updateSections: {
    title: string
    content: React.ReactNode
  }[]
  serviceSection: React.ReactNode
}

export default function HomePanelComponent({ noticeSection, updateSections, serviceSection }: HomePanelProps) {
  const dispatch = useDispatch()
  const { isHomePanelOpen, homePanelCategory, updateIndex, slideDirection } = useSelector((state: RootState) => state.ui)

  const handleClose = () => {
    dispatch(setHomePanelOpen(false))
  }

  const handlePrevUpdate = () => {
    if (updateIndex > 0) {
      dispatch(setSlideDirection(-1))
      dispatch(setUpdateIndex(updateIndex - 1))
    }
  }

  const handleNextUpdate = () => {
    if (updateIndex < updateSections.length - 1) {
      dispatch(setSlideDirection(1))
      dispatch(setUpdateIndex(updateIndex + 1))
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  return (
    <AnimatePresence>
      {isHomePanelOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="tw-fixed tw-inset-0 tw-z-[9998] tw-bg-gray-950 tw-bg-opacity-90"
            onClick={handleOverlayClick}
          />
          <motion.div
            initial={{ opacity: 0, y: '5%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '5%' }}
            transition={{ duration: 0.3 }}
            className="tw-fixed tw-inset-0 tw-z-[9999] tw-flex tw-items-center tw-justify-center"
            onClick={handleOverlayClick}
          >
            <div
              className="tw-flex tw-gap-3 tw-flex-col tw-h-5/6 tw-w-3/6 tw-bg-gray-900 tw-rounded-md tw-p-4 
                tw-overflow-hidden tw-transition-all tw-duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 패널 헤더 */}
              <nav className="tw-flex-shrink-0">
                <div className="tw-flex tw-justify-between tw-items-center">
                  <div className="tw-flex tw-border-b tw-border-gray-700 tw-flex-1">
                    <button
                      className={`tw-px-4 tw-py-2 tw-text-sm ${
                        homePanelCategory === 'notice' ? 'tw-border-b-2 tw-border-blue-500 tw-font-semibold' : 'tw-text-gray-400 hover:tw-text-gray-300'
                      }`}
                      onClick={() => dispatch(setHomePanelCategory('notice'))}
                    >
                      공지사항
                    </button>
                    <button
                      className={`tw-px-4 tw-py-2 tw-text-sm ${
                        homePanelCategory === 'update' ? 'tw-border-b-2 tw-border-blue-500 tw-font-semibold' : 'tw-text-gray-400 hover:tw-text-gray-300'
                      }`}
                      onClick={() => dispatch(setHomePanelCategory('update'))}
                    >
                      업데이트
                    </button>
                    <button
                      className={`tw-px-4 tw-py-2 tw-text-sm ${
                        homePanelCategory === 'service' ? 'tw-border-b-2 tw-border-blue-500 tw-font-semibold' : 'tw-text-gray-400 hover:tw-text-gray-300'
                      }`}
                      onClick={() => dispatch(setHomePanelCategory('service'))}
                    >
                      서비스 상태
                    </button>
                  </div>
                </div>
              </nav>

              {/* 패널 콘텐츠 */}
              <div className="tw-flex tw-flex-col tw-flex-1 tw-overflow-y-auto tw-scroll-smooth">
                {homePanelCategory === 'notice' ? (
                  noticeSection
                ) : homePanelCategory === 'update' ? (
                  <div className="tw-flex tw-flex-col tw-h-full">
                    <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
                      <h2 className="tw-text-lg tw-font-extrabold tw-px-1 tw-pt-1">{updateSections[updateIndex].title}</h2>
                      <div className="tw-flex tw-gap-2">
                        <button
                          onClick={handlePrevUpdate}
                          disabled={updateIndex === 0}
                          className={`tw-p-2 tw-rounded hover:tw-bg-gray-700 ${updateIndex === 0 ? 'tw-opacity-50 tw-cursor-not-allowed' : 'tw-bg-gray-700'}`}
                        >
                          <FaChevronLeft className="tw-w-4 tw-h-4" />
                        </button>
                        <button
                          onClick={handleNextUpdate}
                          disabled={updateIndex === updateSections.length - 1}
                          className={`tw-p-2 tw-rounded hover:tw-bg-gray-700 ${
                            updateIndex === updateSections.length - 1 ? 'tw-opacity-50 tw-cursor-not-allowed' : 'tw-bg-gray-700'
                          }`}
                        >
                          <FaChevronRight className="tw-w-4 tw-h-4" />
                        </button>
                      </div>
                    </div>

                    <AnimatePresence mode="wait" custom={slideDirection}>
                      <motion.div
                        key={updateIndex}
                        custom={slideDirection}
                        initial={{ opacity: 0, x: 100 * slideDirection }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 * slideDirection }}
                        transition={{ duration: 0.3 }}
                      >
                        {updateSections[updateIndex].content}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                ) : homePanelCategory === 'service' ? (
                  <div className="tw-flex-1 tw-overflow-hidden">{serviceSection}</div>
                ) : null}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
