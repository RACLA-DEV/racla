import { RootState } from '@render/store'
import { setIsOpenExternalLink, setOpenExternalLink } from '@render/store/slices/uiSlice'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

export default function ExternalLinkModal({ theme }: { theme: string }) {
  // 모달 외부 클릭 처리
  const { openExternalLink, isOpenExternalLink } = useSelector((state: RootState) => state.ui)
  const dispatch = useDispatch()

  // ESC 키 누름 감지
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpenExternalLink) {
        dispatch(setIsOpenExternalLink(false))
        dispatch(setOpenExternalLink(''))
      }
    }

    window.addEventListener('keydown', handleEscKey)
    return () => window.removeEventListener('keydown', handleEscKey)
  }, [isOpenExternalLink])

  return (
    <div
      className={`tw:font-medium tw:fixed tw:inset-0 tw:z-[9999] tw:transition-opacity tw:duration-300 ${
        isOpenExternalLink
          ? 'tw:opacity-100 tw:pointer-events-auto'
          : 'tw:opacity-0 tw:pointer-events-none'
      }`}
    >
      <div
        className={`tw:fixed tw:inset-0 ${theme === 'dark' ? 'tw:bg-slate-950/90' : 'tw:bg-indigo-50/90'}`}
        onClick={() => {
          dispatch(setIsOpenExternalLink(false))
          dispatch(setOpenExternalLink(''))
        }}
      />
      <div className='tw:fixed tw:inset-0 tw:flex tw:items-center tw:justify-center'>
        <div
          className={`tw:p-6 tw:rounded-lg tw:shadow-lg tw:max-w-md tw:w-full tw:mx-4 tw:transition-all tw:duration-300 ${
            isOpenExternalLink ? 'tw:opacity-100 tw:translate-y-0' : 'tw:opacity-0 tw:translate-y-4'
          } ${
            theme === 'dark'
              ? 'tw:bg-slate-800 tw:text-slate-200'
              : 'tw:bg-white tw:text-indigo-950'
          }`}
        >
          <h3 className='tw:text-lg tw:font-bold tw:mb-4 tw:text-center'>외부 링크 열기</h3>
          <p className='tw:mb-6 tw:text-center tw:text-sm'>
            이 링크는 사용자의 브라우저에서 열립니다.
            <br />
            신뢰할 수 있는 링크인지 확인 후 이동해주세요.
          </p>
          <div
            className={`tw:mb-6 tw:h-20 tw:overflow-y-auto tw:rounded tw:p-2 ${
              theme === 'dark' ? 'tw:bg-slate-700' : 'tw:bg-indigo-50'
            }`}
          >
            <p
              className={`tw:break-all tw:text-sm ${
                theme === 'dark' ? 'tw:text-blue-400' : 'tw:text-blue-600'
              }`}
            >
              {openExternalLink}
            </p>
          </div>
          <div className='tw:flex tw:justify-end tw:gap-2'>
            <button
              className={`tw:px-4 tw:py-1.5 tw:text-sm tw:rounded tw:cursor-pointer ${
                theme === 'dark'
                  ? 'tw:bg-slate-700 hover:tw:bg-slate-600'
                  : 'tw:bg-indigo-100 hover:tw:bg-indigo-200'
              }`}
              onClick={() => {
                dispatch(setIsOpenExternalLink(false))
                dispatch(setOpenExternalLink(''))
              }}
            >
              취소
            </button>
            <button
              className={`tw:px-4 tw:py-1.5 tw:text-sm tw:rounded tw:cursor-pointer tw:text-white ${
                theme === 'dark'
                  ? 'tw:bg-blue-600 hover:tw:bg-blue-700'
                  : 'tw:bg-indigo-600 hover:tw:bg-indigo-700'
              }`}
              onClick={() => {
                window.electron.openBrowser(openExternalLink)
                dispatch(setIsOpenExternalLink(false))
                dispatch(setOpenExternalLink(''))
              }}
            >
              열기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
