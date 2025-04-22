import { RootState } from '@render/store'
import { useSelector } from 'react-redux'

export default function ComponentLoading() {
  const { theme } = useSelector((state: RootState) => state.ui)
  return (
    <div
      className={`tw:w-full tw:flex tw:items-center tw:justify-center tw:h-screen ${theme === 'dark' ? 'tw:bg-slate-800' : 'tw:bg-white'}`}
    />
  )
}
