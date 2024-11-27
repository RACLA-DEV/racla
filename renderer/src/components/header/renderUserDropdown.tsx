// renderUserDropdown.tsx
import { useNotificationSystem } from '@/libs/client/useNotifications'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useDispatch } from 'react-redux'
import { setUploadedData, setUserData } from 'store/slices/appSlice'

export const renderUserDropdown = (user, ipcRenderer, router, callback, refreshKeyHandle) => {
  const { showNotification } = useNotificationSystem()
  const dispatch = useDispatch()

  const logoutCallback = () => {
    dispatch(setUserData({ userToken: '', userName: '', userNo: '' }))
    dispatch(setUploadedData(null))
    callback()
  }

  return (
    <ul className="dropdown-menu tw-text-xs tw-bg-gray-900 tw-bg-opacity-90 tw-p-0" aria-labelledby="btn-nav-user">
      <li>
        <button
          className="dropdown-item tw-py-2 tw-rounded-t-md"
          onClick={() => {
            ipcRenderer.send('openBrowser', 'https://v-archive.net/')
          }}
        >
          V-ARCHIVE 바로가기
        </button>
      </li>
      {user.userNo !== '' && user.userToken !== '' && user.userName !== '' ? (
        <li>
          <button
            className="dropdown-item tw-py-2"
            onClick={() => {
              ipcRenderer.send('openBrowser', `https://v-archive.net/archive/${user.userName}/board`)
            }}
          >
            성과표(V-ARCHIVE) 바로가기
          </button>
        </li>
      ) : null}
      <li>
        <hr className="dropdown-divider tw-m-0" />
      </li>
      {user.userNo !== '' && user.userToken !== '' && user.userName !== '' ? (
        <li>
          <button
            className="dropdown-item tw-py-2 tw-rounded-b-md tw-text-red-600"
            onClick={() => {
              logoutCallback()
              ipcRenderer.logout()
              ipcRenderer.setAuthorization({ userNo: '', userToken: '' })
              showNotification('정상적으로 로그아웃 되었습니다.', 'tw-bg-lime-600')
              refreshKeyHandle((prev) => prev + 1)
            }}
          >
            로그아웃
          </button>
        </li>
      ) : (
        <li>
          <Link href={`/login?url=${router.asPath}`} className="dropdown-item tw-py-2 tw-rounded-b-md">
            로그인
          </Link>
        </li>
      )}
    </ul>
  )
}
