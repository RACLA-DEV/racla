import { RootState } from '@/store'
import { FaBell } from 'react-icons/fa'
import { useDispatch, useSelector } from 'react-redux'
import { setHomePanelOpen } from 'store/slices/uiSlice'

export default function HomePanelButton() {
  const dispatch = useDispatch()
  const settingData = useSelector((state: RootState) => state.app.settingData)

  return (
    <button
      onClick={() => dispatch(setHomePanelOpen(true))}
      className={
        'tw-flex tw-justify-center tw-items-center btn btn-secondary btn-select-game active tw-gap-1 tw-rounded-sm tw-border-0 tw-text-sm tw-relative tw-h-8 tw-w-8' +
        (settingData.platform !== 'darwin' ? ' tw-mr-2' : ' tw-mr-2')
      }
    >
      <FaBell />
      {/* <div className="tw-absolute tw-top-[-4px] tw-right-[-4px] tw-w-[6px] tw-h-[6px] tw-bg-orange-500 tw-rounded-full tw-animate-ping" /> */}
    </button>
  )
}
