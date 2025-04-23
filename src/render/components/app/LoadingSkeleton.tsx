import { RootState } from '@render/store'
import { useSelector } from 'react-redux'
import { SyncLoader } from 'react-spinners'

export default function LoadingSkeleton() {
  const { font } = useSelector((state: RootState) => state.app.settingData)
  const { theme } = useSelector((state: RootState) => state.ui)
  const { isLoading } = useSelector((state: RootState) => state.app)
  return (
    <div
      className={`${font != 'default' ? 'tw:font-medium' : ''} tw:fixed tw:inset-0 tw:flex tw:flex-col tw:items-center tw:justify-center tw:z-[1000000] tw:transition-all tw:duration-1000 ${
        isLoading ? 'tw:opacity-100' : 'tw:opacity-0 tw:pointer-events-none'
      } ${theme === 'dark' ? 'tw:bg-slate-900/95' : 'tw:bg-indigo-50/95'}`}
    >
      <div className='tw:flex tw:flex-col tw:gap-8 tw:items-center'>
        <div className='tw:flex tw:items-center tw:justify-center'>
          <div className='tw:animate-pulse tw:flex tw:space-x-4'>
            <div
              className={`tw:h-12 tw:w-12 tw:rounded-full ${theme === 'dark' ? 'tw:bg-slate-700' : 'tw:bg-indigo-200'}`}
            ></div>
            <div className='tw:flex-1 tw:space-y-4 tw:py-1'>
              <div
                className={`tw:h-4 tw:w-36 tw:rounded ${theme === 'dark' ? 'tw:bg-slate-700' : 'tw:bg-indigo-200'}`}
              ></div>
              <div className='tw:space-y-2'>
                <div
                  className={`tw:h-4 tw:w-40 tw:rounded ${theme === 'dark' ? 'tw:bg-slate-700' : 'tw:bg-indigo-200'}`}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className='tw:flex tw:flex-col tw:gap-2 tw:items-center'>
          <div
            className={`tw:h-2 tw:w-48 tw:rounded tw:animate-pulse ${theme === 'dark' ? 'tw:bg-slate-700' : 'tw:bg-indigo-200'}`}
          ></div>
          <div
            className={`tw:h-2 tw:w-32 tw:rounded tw:animate-pulse ${theme === 'dark' ? 'tw:bg-slate-700' : 'tw:bg-indigo-200'}`}
          ></div>
        </div>

        <div className='tw:flex tw:items-center tw:mt-4'>
          <SyncLoader size={8} color={theme === 'dark' ? '#c3dafe' : '#667eea'} />
        </div>
      </div>

      <div className='tw:absolute tw:bottom-6 tw:left-0 tw:right-0 tw:flex tw:flex-col tw:gap-2 tw:justify-center tw:items-center'>
        <span
          className={`tw:text-xs ${theme === 'dark' ? 'tw:text-slate-400' : 'tw:text-indigo-500'}`}
        >
          Developed by RACLA from 공감대로0번길(GGDRN0 STUDIO)
        </span>
      </div>
    </div>
  )
}
