import React from 'react'
import { useDispatch } from 'react-redux'
import { setHomePanelOpen } from 'store/slices/uiSlice'
import { FaBell } from 'react-icons/fa'

export default function HomePanelButton() {
  const dispatch = useDispatch()

  return (
    <button
      onClick={() => dispatch(setHomePanelOpen(true))}
      className="tw-flex tw-justify-center tw-items-center btn-select-game tw-gap-1 tw-rounded-sm tw-text-sm tw-bg-gray-800 tw-relative tw-h-8 tw-mr-2 tw-w-8"
    >
      <FaBell />
      {/* <div className="tw-absolute tw-top-[-4px] tw-right-[-4px] tw-w-[6px] tw-h-[6px] tw-bg-orange-500 tw-rounded-full tw-animate-ping" /> */}
    </button>
  )
}
