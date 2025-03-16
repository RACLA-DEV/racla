import {
  setBackupData,
  setProjectRaData,
  setUserData,
  setVArchiveData,
  setVArchiveUserData,
} from 'store/slices/appSlice'

import { useNotificationSystem } from '@hooks/useNotifications'
import Link from 'next/link'
import { useDispatch } from 'react-redux'

export const renderUserDropdown = (
  user,
  vArchiveUserData,
  ipcRenderer,
  router,
  callback,
  refreshKeyHandle,
) => {
  const { showNotification } = useNotificationSystem()
  const dispatch = useDispatch()

  const logoutCallback = () => {
    dispatch(setUserData({ userToken: '', userName: '', userNo: '' }))
    dispatch(setVArchiveUserData({ userToken: '', userName: '', userNo: '' }))
    dispatch(setVArchiveData(null))
    dispatch(setProjectRaData(null))
    callback()
  }

  return (
    <ul
      className='dropdown-menu tw-text-xs tw-bg-gray-800 tw-bg-opacity-100 tw-p-0'
      aria-labelledby='btn-nav-user'
    >
      <li>
        <button
          className='dropdown-item tw-py-2 tw-rounded-t-md'
          onClick={() => {
            ipcRenderer.send('openBrowser', 'https://racla.app/')
          }}
        >
          RACLA 바로가기
        </button>
      </li>
      <li>
        <hr className='dropdown-divider tw-m-0' />
      </li>

      {vArchiveUserData.userNo !== '' &&
      vArchiveUserData.userToken !== '' &&
      vArchiveUserData.userName !== '' ? (
        <li>
          <button
            className='dropdown-item tw-py-2'
            onClick={() => {
              ipcRenderer.send(
                'openBrowser',
                `https://v-archive.net/archive/${vArchiveUserData.userName}/board`,
              )
            }}
          >
            V-ARCHIVE 바로가기
          </button>
        </li>
      ) : (
        <li>
          <button
            className='dropdown-item tw-py-2 tw-rounded-t-md'
            onClick={() => {
              ipcRenderer.send('openBrowser', 'https://v-archive.net/')
            }}
          >
            V-ARCHIVE 바로가기
          </button>
        </li>
      )}
      <li>
        <hr className='dropdown-divider tw-m-0' />
      </li>
      <li>
        <button
          className='dropdown-item tw-py-2'
          onClick={() => {
            ipcRenderer.send('openBrowser', 'https://hard-archive.com')
          }}
        >
          전일 아카이브 바로가기
        </button>
      </li>
      <li>
        <hr className='dropdown-divider tw-m-0' />
      </li>
      {user.userNo !== '' && user.userToken !== '' && user.userName !== '' ? (
        <li>
          <button
            className='dropdown-item tw-py-2 tw-rounded-b-md tw-text-red-600'
            onClick={() => {
              logoutCallback()
              ipcRenderer.logout()
              ipcRenderer.setAuthorization({ userNo: '', userToken: '' })
              showNotification('정상적으로 로그아웃 되었습니다.', 'tw-bg-lime-600')
              refreshKeyHandle((prev) => prev + 1)
              dispatch(setVArchiveData(null))
              dispatch(setProjectRaData(null))
              dispatch(setBackupData(null))
            }}
          >
            로그아웃
          </button>
        </li>
      ) : (
        <li>
          <Link
            href={`/login?url=${router.asPath}`}
            className='dropdown-item tw-py-2 tw-rounded-b-md'
          >
            로그인
          </Link>
        </li>
      )}
    </ul>
  )
}
