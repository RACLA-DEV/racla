import React, { useEffect, useRef, useState } from 'react'

import Modal from '@/components/common/Modal'
import { logRendererError } from '@/libs/client/rendererLogger'
import { useNotificationSystem } from '@/libs/client/useNotifications'
import axios from 'axios'
import { motion } from 'framer-motion'
import moment from 'moment'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import { SyncLoader } from 'react-spinners'
import { RootState } from 'store'

interface Bug {
  id: number
  title: string
  description: string
  status: string
  reporterId: number
  reporterName: string
  comments: any[]
  createdAt: string
  category: string
}

interface BugListResponse {
  content: Bug[]
  pageNo: number
  pageSize: number
  totalElements: number
  totalPages: number
  last: boolean
}

export default function BugList() {
  const router = useRouter()
  const [bugs, setBugs] = useState<Bug[]>([])
  const [notices, setNotices] = useState<Bug[]>([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [newBug, setNewBug] = useState({ title: '', description: '', category: 'OTHER' })
  const [loading, setLoading] = useState(false)
  const { userData } = useSelector((state: RootState) => state.app)

  const { showNotification } = useNotificationSystem()

  const editorRef = useRef<any>({})
  const [editorLoaded, setEditorLoaded] = useState(false)
  const { CKEditor, ClassicEditor } = editorRef.current || {}

  useEffect(() => {
    editorRef.current = {
      CKEditor: require('@ckeditor/ckeditor5-react').CKEditor,
      ClassicEditor: require('@ckeditor/ckeditor5-build-classic'),
    }
    setEditorLoaded(true)
  }, [])

  const fetchBugs = async (page = 0) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/v1/bug?page=${page}`, {
        headers: { Authorization: `${userData.userNo}|${userData.userToken}` },
        withCredentials: true,
      })
      const data: BugListResponse = await response.data
      console.log(data)
      setBugs(data.content)
      setPagination({
        ...pagination,
        current: data.pageNo + 1,
        total: data.totalElements,
        pageSize: data.pageSize,
      })
    } catch (error) {
      logRendererError(error, { message: 'Error in fetchBugs', ...userData })
      showNotification('피드백 리스트를 가져오는 중에 오류가 발생했습니다.', 'tw-bg-red-600')
    }
  }

  const fetchNotices = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/v1/bug/pinned`, {
        headers: { Authorization: `${userData.userNo}|${userData.userToken}` },
        withCredentials: true,
      })
      setNotices((response.data as Bug[]).reverse())
    } catch (error) {
      logRendererError(error, { message: 'Error in fetchNotices', ...userData })
      console.error('Failed to fetch pinned notices:', error)
    }
  }

  useEffect(() => {
    fetchBugs()
    fetchNotices()
  }, [])

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isModalVisible) {
        setIsModalVisible(false)
      }
    }

    window.addEventListener('keydown', handleEscKey)
    return () => {
      window.removeEventListener('keydown', handleEscKey)
    }
  }, [isModalVisible])

  const handleCreateBug = async () => {
    try {
      setLoading(true)
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/v1/bug`, newBug, {
        headers: { Authorization: `${userData.userNo}|${userData.userToken}` },
        withCredentials: true,
      })
      const data = await response.data
      setIsModalVisible(false)
      setNewBug({ title: '', description: '', category: 'OTHER' })
      router.push(`/bug/${data.id}`)
    } catch (error) {
      logRendererError(error, { message: 'Error in handleCreateBug', ...userData })
      showNotification('피드백 생성 중 오류가 발생했습니다.', 'tw-bg-red-600')
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page: number, pageSize?: number) => {
    fetchBugs(page - 1)
  }

  const fontFamily = useSelector((state: RootState) => state.ui.fontFamily)

  const customUploadAdapter = (loader) => {
    return {
      upload() {
        return new Promise((resolve, reject) => {
          const formData = new FormData()

          loader.file.then((file) => {
            formData.append('file', file)

            axios
              .post(`${process.env.NEXT_PUBLIC_API_URL}/v1/upload`, formData, {
                headers: {
                  Authorization: `${userData.userNo}|${userData.userToken}`,
                  'Content-Type': 'multipart/form-data',
                },
                withCredentials: true,
              })
              .then((response) => {
                resolve({
                  default: response.data.url,
                })
              })
              .catch((error) => {
                logRendererError(error, { message: 'Error in customUploadAdapter', ...userData })
                reject(error)
              })
          })
        })
      },
    }
  }

  function uploadPlugin(editor) {
    editor.plugins.get('FileRepository').createUploadAdapter = (loader) =>
      customUploadAdapter(loader)
  }

  const editorConfiguration = {
    licenseKey: 'GPL',
    height: '600px',
    toolbar: [
      'bold',
      'italic',
      'link',
      'bulletedList',
      'numberedList',
      '|',
      'uploadImage',
      '|',
      'undo',
      'redo',
    ],
    extraPlugins: [uploadPlugin],
    placeholder: '내용을 입력하세요',
    image: {
      upload: {
        types: ['jpeg', 'png', 'gif', 'jpg'],
      },
    },
  }

  const categoryCodeToName = (category: string) => {
    switch (category) {
      case 'NOTICE':
        return '공지사항'
      case 'BUG':
        return '버그 제보'
      case 'FEATURE_REQUEST':
        return '기능 요청'
      case 'QUESTION':
        return '질문'
      case 'OTHER':
        return '기타'
      default:
        return category
    }
  }

  const statusCodeToName = (status: string) => {
    switch (status) {
      case 'OPEN':
        return '신규'
      case 'IN_PROGRESS':
        return '처리중'
      case 'CLOSED':
        return '완료'
    }
  }

  return (
    <React.Fragment>
      <Head>
        <title>피드백 센터 - RACLA</title>
      </Head>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className='tw-flex tw-flex-col tw-gap-4'
      >
        <div className='tw-flex tw-flex-col tw-gap-4 tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg tw-shadow-lg p-4'>
          <div className='tw-flex tw-justify-between tw-items-center'>
            <h1 className='tw-text-2xl tw-font-bold'>피드백 센터</h1>
            {userData.userName !== '' ? (
              <button
                type='button'
                onClick={() => setIsModalVisible(true)}
                className='tw-px-4 tw-py-1.5 tw-text-sm tw-bg-blue-600 tw-rounded hover:tw-bg-blue-700'
              >
                피드백 생성
              </button>
            ) : (
              <span>피드백 생성은 로그인이 필요합니다.</span>
            )}
          </div>

          <div className='tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded tw-space-y-2 tw-mb-auto'>
            <p className='tw-leading-relaxed'>
              버그 신고, 의견 제공 등의 피드백을 작성 및 확인 할 수 있는 공간입니다. 부적절한 언어
              사용과 문제 발생 시 피드백 센터의 이용 제한 조치가 이루어질 수 있습니다.
            </p>
            {/* <p className='tw-leading-relaxed'>
              OPEN 상태는 아직 개발자가 확인하지 않은 단계를 의미하며 해당 내용이 확인된 경우
              IN_PROGRESS 상태로 전환됩니다.{' '}
            </p>
            <p className='tw-leading-relaxed'>
              CLOSED 상태인 경우 해당 피드백에 대한 조치가 완료 되었다는 것을 의미하며 원본 내용을
              유지하기 위해 추가 의견을 작성할 수 없습니다.
            </p> */}
          </div>

          {notices.length > 0 && (
            <div className='tw-flex tw-flex-col tw-gap-2'>
              <h2 className='tw-text-xl tw-font-bold'>고정됨</h2>

              <div className='tw-flex tw-flex-col tw-bg-gray-600 tw-bg-opacity-10 tw-rounded-md tw-px-4 tw-py-2'>
                <div className='tw-flex tw-items-center tw-gap-4 tw-p-2 tw-border-b tw-border-gray-600 tw-text-gray-400 tw-font-bold tw-text-sm'>
                  <div className='tw-w-20'>카테고리</div>
                  <div className='tw-flex-1'>제목</div>
                  <div className='tw-w-16'>상태</div>
                  <div className='tw-w-32'>작성자</div>
                  {/* <div className='tw-w-32'>수정자</div> */}
                  <div className='tw-w-24'>작성일</div>
                </div>
                {notices.map((notice, index) => (
                  <motion.div
                    key={notice.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={
                      'tw-flex tw-items-center tw-gap-4 tw-px-2 tw-py-4 tw-text-sm tw-cursor-pointer tw-border-gray-600 tw-border-opacity-50 hover:tw-bg-gray-700 tw-transition-all ' +
                      (notices.length - 1 != index ? 'tw-border-b' : '')
                    }
                    onClick={() => router.push(`/bug/${notice.id}`)}
                  >
                    <div className='tw-w-20 tw-text-gray-400'>
                      {categoryCodeToName(notice.category)}
                    </div>
                    <div className='tw-flex-1 tw-text-white'>{notice.title}</div>
                    <div
                      className={`tw-w-16 ${
                        notice.status === 'OPEN'
                          ? 'tw-text-green-500'
                          : notice.status === 'IN_PROGRESS'
                            ? 'tw-text-blue-500'
                            : 'tw-text-red-500'
                      }`}
                    >
                      {statusCodeToName(notice.status)}
                    </div>
                    <div className='tw-w-32 tw-text-gray-400'>{notice.reporterName}</div>
                    {/* <div className='tw-w-32 tw-text-gray-400'>
                      {notice.comments &&
                      notice.comments.filter((data) => data.commenterName != notice.reporterName)
                        .length > 0
                        ? notice.comments.filter(
                            (data) => data.commenterName != notice.reporterName,
                          )[
                            notice.comments.filter(
                              (data) => data.commenterName != notice.reporterName,
                            ).length - 1
                          ]?.commenterName
                        : '없음'}
                    </div> */}
                    <div className='tw-w-24 tw-text-gray-400'>
                      {moment(notice.createdAt).format('YYYY-MM-DD')}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className='tw-flex tw-justify-center tw-items-center tw-h-64'>
              <SyncLoader color='#ffffff' size={8} />
            </div>
          ) : (
            <>
              <h2 className='tw-text-xl tw-font-bold'>목록</h2>
              <div className='tw-flex tw-flex-col tw-bg-gray-600 tw-bg-opacity-10 tw-rounded-md tw-px-4 tw-py-2'>
                <div className='tw-flex tw-items-center tw-gap-4 tw-p-2 tw-border-b tw-border-gray-600 tw-text-gray-400 tw-font-bold tw-text-sm'>
                  <div className='tw-w-20'>카테고리</div>
                  <div className='tw-flex-1'>제목</div>
                  <div className='tw-w-16'>상태</div>
                  <div className='tw-w-32'>작성자</div>
                  {/* <div className='tw-w-32'>수정자</div> */}
                  <div className='tw-w-24'>작성일</div>
                </div>
                {bugs.map((bug, index) => (
                  <motion.div
                    key={bug.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={
                      'tw-flex tw-items-center tw-gap-4 tw-px-2 tw-py-4 tw-text-sm hover:tw-bg-gray-700 tw-cursor-pointer tw-transition-all tw-border-opacity-50 tw-border-gray-600 ' +
                      (bugs.length - 1 != index ? 'tw-border-b' : '')
                    }
                    onClick={() => router.push(`/bug/${bug.id}`)}
                  >
                    <div className='tw-w-20 tw-text-gray-400'>
                      {categoryCodeToName(bug.category)}
                    </div>
                    <div className='tw-flex-1 tw-text-white'>{bug.title}</div>
                    <div
                      className={`tw-w-16 ${bug.status === 'OPEN' ? 'tw-text-green-500' : bug.status === 'IN_PROGRESS' ? 'tw-text-blue-500' : 'tw-text-red-500'}`}
                    >
                      {statusCodeToName(bug.status)}
                    </div>
                    <div className='tw-w-32 tw-text-gray-400'>{bug.reporterName}</div>
                    {/* <div className='tw-w-32 tw-text-gray-400'>
                      {bug.comments &&
                      bug.comments.filter((data) => data.commenterName != bug.reporterName).length >
                        0
                        ? bug.comments.filter((data) => data.commenterName != bug.reporterName)[
                            bug.comments.filter((data) => data.commenterName != bug.reporterName)
                              .length - 1
                          ]?.commenterName
                        : '없음'}
                    </div> */}
                    <div className='tw-w-24 tw-text-gray-400'>
                      {moment(bug.createdAt).format('YYYY-MM-DD')}
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}

          <div className='tw-mt-6 tw-flex tw-justify-center'>
            <div className='tw-flex tw-gap-2'>
              {Array.from({
                length: Math.max(1, Math.ceil(pagination.total / pagination.pageSize)),
              }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => fetchBugs(i)}
                  className={`tw-px-3 tw-py-1 tw-rounded ${
                    pagination.current === i + 1
                      ? 'tw-bg-blue-600'
                      : 'tw-bg-gray-700 hover:tw-bg-gray-600'
                  } tw-transition-colors`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          <Modal
            isOpen={isModalVisible}
            onClose={() => setIsModalVisible(false)}
            title='피드백 작성하기'
          >
            <div className='tw-flex tw-flex-col tw-h-full'>
              <div className='tw-shrink-0 tw-mb-4 tw-flex tw-gap-4'>
                <div className='tw-flex-1'>
                  <label className='tw-block tw-mb-2'>제목</label>
                  <input
                    type='text'
                    value={newBug.title}
                    onChange={(e) => setNewBug({ ...newBug, title: e.target.value })}
                    className='tw-w-full tw-bg-gray-700 tw-rounded-sm tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500'
                    placeholder='제목을 입력하세요'
                  />
                </div>
                <div className='tw-flex-1'>
                  <label className='tw-block tw-mb-2'>카테고리</label>
                  <select
                    value={newBug.category}
                    onChange={(e) => setNewBug({ ...newBug, category: e.target.value })}
                    className='tw-w-full tw-bg-gray-700 tw-rounded-sm tw-h-9 tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500'
                  >
                    <option value='BUG'>버그 제보</option>
                    <option value='FEATURE_REQUEST'>기능 요청</option>
                    <option value='QUESTION'>질문</option>
                    <option value='OTHER'>기타</option>
                  </select>
                </div>
              </div>

              <div className='tw-flex-1 tw-min-h-0 tw-text-gray-950 tw-rounded'>
                <label className='tw-block tw-mb-2 tw-text-gray-200'>내용</label>
                {editorLoaded ? (
                  <CKEditor
                    editor={ClassicEditor}
                    data={newBug.description}
                    config={editorConfiguration}
                    onChange={(event: any, editor: any) => {
                      const data = editor.getData()
                      setNewBug({ ...newBug, description: data })
                    }}
                  />
                ) : (
                  <div>Editor loading...</div>
                )}
              </div>

              <div className='tw-shrink-0 tw-mt-4 tw-flex tw-justify-end tw-gap-2'>
                <button
                  onClick={() => setIsModalVisible(false)}
                  className='tw-px-4 tw-py-2 tw-bg-gray-700 tw-rounded hover:tw-bg-gray-600 tw-transition-colors'
                >
                  취소
                </button>
                <button
                  onClick={handleCreateBug}
                  disabled={loading}
                  className='tw-px-4 tw-py-2 tw-bg-blue-600 tw-rounded hover:tw-bg-blue-700 tw-transition-colors disabled:tw-opacity-50'
                >
                  {loading ? <SyncLoader size={8} color='#ffffff' /> : '작성하기'}
                </button>
              </div>
            </div>
          </Modal>
        </div>
      </motion.div>
    </React.Fragment>
  )
}
