import React, { useEffect, useState } from 'react'

import ClassicEditor from '@ckeditor/ckeditor5-build-classic'
import { CKEditor } from '@ckeditor/ckeditor5-react'
import FeedbackCreateModal from '@render/components/app/FeedbackCreateModal'
import { useNotificationSystem } from '@render/hooks/useNotifications'
import { createLog } from '@render/libs/logger'
import { RootState } from '@render/store'
import { FeedbackPageResponse, FeedbackResponse } from '@src/types/dto/feedback/FeedbackResponse'
import { FileUploadResponse } from '@src/types/dto/file/FileUploadResponse'
import dayjs from 'dayjs'
import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { PuffLoader } from 'react-spinners'
import apiClient from '../../../libs/apiClient'

// 리치 텍스트 에디터 스타일
const richTextStyles = `
  /* 커스텀 스크롤바 스타일링 */
  .ck-editor__editable::-webkit-scrollbar {
    margin-right: 5px;
    width: 10px;
    height: 10px;
  }

  .ck-editor__editable::-webkit-scrollbar-track {
    margin: 8px 0;
    border-radius: 8px;
    background: transparent;
  }

  .ck-editor__editable::-webkit-scrollbar-thumb {
    transition: background-color 0.3s;
    border: 2px solid transparent;
    border-radius: 8px;
    background-clip: padding-box;
    background-color: rgba(148, 163, 184, 0.3);
  }

  .ck-editor__editable::-webkit-scrollbar-thumb:hover {
    background-color: rgba(148, 163, 184, 0.6);
  }

  /* 다크 테마용 스크롤바 */
  .dark .ck-editor__editable::-webkit-scrollbar-thumb {
    background-color: rgba(148, 163, 184, 0.4);
  }

  .dark .ck-editor__editable::-webkit-scrollbar-thumb:hover {
    background-color: rgba(148, 163, 184, 0.6);
  }

  /* 라이트 테마용 스크롤바 */
  .light-theme .ck-editor__editable::-webkit-scrollbar-thumb {
    background-color: rgba(79, 70, 229, 0.3);
  }

  .light-theme .ck-editor__editable::-webkit-scrollbar-thumb:hover {
    background-color: rgba(79, 70, 229, 0.5);
  }

  /* 스크롤바 버튼(화살표) 제거 */
  .ck-editor__editable::-webkit-scrollbar-button {
    display: none;
  }

  .ck-editor__editable {
    height: calc(100vh - 354px);
    overflow-y: auto !important;
    color: #1f2937;
    background-color: white;
    border-bottom-left-radius: 0.25rem;
    border-bottom-right-radius: 0.25rem;
  }

  .editor-wrapper {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .dark .ck-editor__editable {
    color: #e5e7eb !important;
    background-color: #1e293b !important;
  }

  .ck-toolbar__items, .ck.ck-sticky-panel__content {
    border-color: #d1d5db !important;
  }

  .dark .ck-toolbar__items, .dark .ck.ck-sticky-panel__content {
    border-color: #475569 !important;
  }

  .ck.ck-editor__main>.ck-editor__editable {
    border-color: #d1d5db;
  }
  
  .dark .ck.ck-editor__main>.ck-editor__editable {
    border-color: #475569;
  }
  
  .ck-editor__main {
    min-height: 100%;
    height: 100%;
    max-height: 100%;
    overflow: hidden !important;
  }
  
  .ck.ck-editor {
    display: flex;
    flex-direction: column;
    overflow: hidden !important;
  }
  
  .ck.ck-toolbar {
    background-color: #f3f4f6;
    border-color: #d1d5db;
  }
  
  .dark .ck.ck-toolbar {
    background-color: #334155;
    border-color: #475569;
  }
  
  .dark .ck.ck-button {
    color: #e5e7eb;
  }
  
  .dark .ck.ck-button.ck-on {
    color: #60a5fa;
    background-color: #1e293b;
  }
  
  .dark .ck.ck-button:hover:not(.ck-disabled) {
    background-color: #1e293b;
  }
  
  /* 리치 텍스트 콘텐츠 스타일 (에디터 내부 및 표시되는 콘텐츠) */
  .rich-text-content ul {
    list-style-type: disc !important;
    padding-left: 2rem !important;
    margin: 1rem 0 !important;
  }
  
  .rich-text-content ol {
    list-style-type: decimal !important;
    padding-left: 2rem !important;
    margin: 1rem 0 !important;
  }
  
  .rich-text-content ul li {
    display: list-item !important;
    list-style-type: disc !important;
    margin-bottom: 0.5rem !important;
  }
  
  .rich-text-content ol li {
    display: list-item !important;
    list-style-type: decimal !important;
    margin-bottom: 0.5rem !important;
  }
  
  .rich-text-content ul ul li {
    list-style-type: circle !important;
  }
  
  .rich-text-content ol ol li {
    list-style-type: lower-alpha !important;
  }

  .rich-text-content p {
    margin-bottom: 1rem !important;
    line-height: 1.6 !important;
  }
  
  .rich-text-content a {
    color: #3b82f6 !important;
  }
  
  .rich-text-content a:hover {
    text-decoration: underline !important;
  }
  
  .rich-text-content img {
    max-width: 100% !important;
    height: auto !important;
    margin: 1rem 0 !important;
    border-radius: 0.375rem !important;
  }
  
  .rich-text-content table {
    width: 100% !important;
    border-collapse: collapse !important;
    margin: 1rem 0 !important;
  }
  
  .rich-text-content th,
  .rich-text-content td {
    border: 1px solid #e5e7eb !important;
    padding: 0.5rem !important;
  }
  
  .rich-text-content th {
    background-color: #f9fafb !important;
    text-align: left !important;
  }
  
  .rich-text-content blockquote {
    padding-left: 1rem !important;
    border-left: 4px solid #d1d5db !important;
    font-style: italic !important;
    margin: 1rem 0 !important;
  }
  
  .rich-text-content code {
    background-color: #f1f5f9 !important;
    padding: 0.125rem 0.25rem !important;
    border-radius: 0.25rem !important;
  }
  
  .rich-text-content strong {
    font-weight: bold !important;
  }
  
  .rich-text-content h1, 
  .rich-text-content h2, 
  .rich-text-content h3, 
  .rich-text-content h4, 
  .rich-text-content h5, 
  .rich-text-content h6 {
    font-weight: bold !important;
    margin: 1.5rem 0 1rem 0 !important;
  }
  
  .rich-text-content h1 { font-size: 1.875rem !important; }
  .rich-text-content h2 { font-size: 1.5rem !important; }
  .rich-text-content h3 { font-size: 1.25rem !important; }
  .rich-text-content h4 { font-size: 1.125rem !important; }
  .rich-text-content h5 { font-size: 1rem !important; }
  .rich-text-content h6 { font-size: 0.875rem !important; }
  
  /* 다크 모드 스타일 */
  .dark .rich-text-content a {
    color: #60a5fa !important;
  }
  
  .dark .rich-text-content th,
  .dark .rich-text-content td {
    border-color: #334155 !important;
  }
  
  .dark .rich-text-content th {
    background-color: #1e293b !important;
  }
  
  .dark .rich-text-content blockquote {
    border-color: #475569 !important;
  }
  
  .dark .rich-text-content code {
    background-color: #1e293b !important;
  }
`

export default function FeedbackListPage() {
  const navigate = useNavigate()
  const [bugs, setBugs] = useState<FeedbackResponse[]>([])
  const [notices, setNotices] = useState<FeedbackResponse[]>([])
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

  const [editorLoaded, setEditorLoaded] = useState(false)

  useEffect(() => {
    setEditorLoaded(true)
  }, [])

  const fetchBugs = async (page = 0) => {
    try {
      const response = await apiClient.get<FeedbackPageResponse>(
        `/v3/racla/feedback?page=${page}`,
        {
          headers: { Authorization: `${userData.playerId}|${userData.playerToken}` },
          withCredentials: true,
        },
      )
      const data: FeedbackPageResponse = await response.data.data
      console.log(data)
      setBugs(data.content)
      setPagination({
        ...pagination,
        current: data.pageNo + 1,
        total: data.totalElements,
        pageSize: data.pageSize,
      })
    } catch (error) {
      createLog('error', 'Error in fetchBugs', error)
      showNotification(
        {
          mode: 'i18n',
          ns: 'feedback',
          value: 'fecthFeedbackPageFailed',
        },
        'error',
      )
    }
  }

  const fetchNotices = async () => {
    try {
      const response = await apiClient.get<FeedbackResponse[]>(`/v3/racla/feedback/pinned`, {
        headers: { Authorization: `${userData.playerId}|${userData.playerToken}` },
        withCredentials: true,
      })
      setNotices((response.data.data as FeedbackResponse[]).reverse())
    } catch (error) {
      createLog('error', 'Error in fetchNotices', error)
    }
  }

  useEffect(() => {
    void fetchBugs()
    void fetchNotices()
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
      const response = await apiClient.post<FeedbackResponse>(`/v3/racla/feedback`, newBug, {
        headers: { Authorization: `${userData.playerId}|${userData.playerToken}` },
        withCredentials: true,
      })
      const data = await response.data.data
      setIsModalVisible(false)
      setNewBug({ title: '', description: '', category: 'OTHER' })
      navigate(`/feedback/${data.id}`)
    } catch (error) {
      createLog('error', 'Error in handleCreateBug', error)
      showNotification(
        {
          mode: 'i18n',
          ns: 'feedback',
          value: 'createBugFailed',
        },
        'error',
      )
    } finally {
      setLoading(false)
    }
  }

  const customUploadAdapter = (loader) => {
    return {
      upload() {
        return new Promise((resolve, reject) => {
          const formData = new FormData()

          loader.file.then((file) => {
            formData.append('file', file)

            apiClient
              .post<FileUploadResponse>(`/v3/racla/upload`, formData, {
                headers: {
                  Authorization: `${userData.playerId}|${userData.playerToken}`,
                  'Content-Type': 'multipart/form-data',
                },
                withCredentials: true,
              })
              .then((response) => {
                resolve({
                  default: response.data.data.url,
                })
              })
              .catch((error: unknown) => {
                createLog('error', 'Error in customUploadAdapter', error)
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
      <style>{richTextStyles}</style>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className='tw:flex tw:flex-col tw:gap-4'
      >
        <div className='tw:flex tw:flex-col tw:gap-4 tw:bg-white tw:dark:bg-slate-800 tw:rounded-lg tw:text-sm'>
          <div className='tw:flex tw:justify-between tw:items-center'>
            <h1 className='tw:text-2xl tw:font-bold tw:text-gray-900 tw:dark:text-white'>
              피드백 센터
            </h1>
            {userData.playerName !== '' ? (
              <button
                type='button'
                onClick={() => setIsModalVisible(true)}
                className='tw:px-4 tw:py-1.5 tw:text-sm tw:bg-indigo-600 tw:rounded hover:tw:bg-indigo-700 tw:text-white'
              >
                피드백 생성
              </button>
            ) : (
              <span className='tw:text-gray-700 tw:dark:text-gray-300'>
                피드백 생성은 로그인이 필요합니다.
              </span>
            )}
          </div>

          <div className='tw:bg-gray-50 tw:dark:bg-slate-700/50 tw:p-4 tw:rounded tw:space-y-2 tw:mb-auto tw:border tw:border-gray-200 tw:dark:border-slate-600'>
            <p className='tw:leading-relaxed tw:text-gray-700 tw:dark:text-gray-300'>
              버그 신고, 의견 제공 등의 피드백을 작성 및 확인 할 수 있는 공간입니다. 부적절한 언어
              사용과 문제 발생 시 피드백 센터의 이용 제한 조치가 이루어질 수 있습니다.
            </p>
            {/* <p className='tw:leading-relaxed'>
              OPEN 상태는 아직 개발자가 확인하지 않은 단계를 의미하며 해당 내용이 확인된 경우
              IN_PROGRESS 상태로 전환됩니다.{' '}
            </p>
            <p className='tw:leading-relaxed'>
              CLOSED 상태인 경우 해당 피드백에 대한 조치가 완료 되었다는 것을 의미하며 원본 내용을
              유지하기 위해 추가 의견을 작성할 수 없습니다.
            </p> */}
          </div>

          {notices.length > 0 && (
            <div className='tw:flex tw:flex-col tw:gap-2'>
              <h2 className='tw:text-xl tw:font-bold tw:text-gray-900 tw:dark:text-white'>
                고정됨
              </h2>

              <div className='tw:flex tw:flex-col tw:bg-white tw:dark:bg-slate-800 tw:border tw:border-gray-200 tw:dark:border-slate-700 tw:rounded-md tw:px-4 tw:py-2'>
                <div className='tw:flex tw:items-center tw:gap-4 tw:p-2 tw:border-b tw:border-gray-200 tw:dark:border-slate-700 tw:text-gray-500 tw:dark:text-gray-400 tw:font-bold tw:text-sm'>
                  <div className='tw:w-20'>카테고리</div>
                  <div className='tw:flex-1'>제목</div>
                  <div className='tw:w-16'>상태</div>
                  <div className='tw:w-32'>작성자</div>
                  {/* <div className='tw:w-32'>수정자</div> */}
                  <div className='tw:w-24'>작성일</div>
                </div>
                {notices.map((notice, index) => (
                  <motion.div
                    key={notice.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={
                      'tw:flex tw:items-center tw:gap-4 tw:px-2 tw:py-4 tw:text-sm tw:cursor-pointer tw:border-gray-200 tw:dark:border-slate-700 tw:border-opacity-50 hover:tw:bg-gray-100 hover:tw:dark:bg-slate-700/50 tw:transition-all ' +
                      (notices.length - 1 != index ? 'tw:border-b' : '')
                    }
                    onClick={() => navigate(`/feedback/${notice.id}`)}
                  >
                    <div className='tw:w-20 tw:text-gray-500 tw:dark:text-gray-400'>
                      {categoryCodeToName(notice.category)}
                    </div>
                    <div className='tw:flex-1 tw:text-gray-900 tw:dark:text-white'>
                      {notice.title}
                    </div>
                    <div
                      className={`tw:w-16 ${
                        notice.status === 'OPEN'
                          ? 'tw:text-green-500'
                          : notice.status === 'IN_PROGRESS'
                            ? 'tw:text-indigo-500'
                            : 'tw:text-red-500'
                      }`}
                    >
                      {statusCodeToName(notice.status)}
                    </div>
                    <div className='tw:w-32 tw:text-gray-500 tw:dark:text-gray-400'>
                      {notice.reporterName}
                    </div>
                    {/* <div className='tw:w-32 tw:text-gray-400'>
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
                    <div className='tw:w-24 tw:text-gray-500 tw:dark:text-gray-400'>
                      {dayjs(notice.createdAt).format('YYYY-MM-DD')}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className='tw:flex tw:justify-center tw:items-center tw:h-64'>
              <PuffLoader color='#6366f1' size={32} />
            </div>
          ) : (
            <>
              <h2 className='tw:text-xl tw:font-bold tw:text-gray-900 tw:dark:text-white'>목록</h2>
              <div className='tw:flex tw:flex-col tw:bg-white tw:dark:bg-slate-800 tw:border tw:border-gray-200 tw:dark:border-slate-700 tw:rounded-md tw:px-4 tw:py-2'>
                <div className='tw:flex tw:items-center tw:gap-4 tw:p-2 tw:border-b tw:border-gray-200 tw:dark:border-slate-700 tw:text-gray-500 tw:dark:text-gray-400 tw:font-bold tw:text-sm'>
                  <div className='tw:w-20'>카테고리</div>
                  <div className='tw:flex-1'>제목</div>
                  <div className='tw:w-16'>상태</div>
                  <div className='tw:w-32'>작성자</div>
                  {/* <div className='tw:w-32'>수정자</div> */}
                  <div className='tw:w-24'>작성일</div>
                </div>
                {bugs.map((bug, index) => (
                  <motion.div
                    key={bug.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={
                      'tw:flex tw:items-center tw:gap-4 tw:px-2 tw:py-4 tw:text-sm hover:tw:bg-gray-100 hover:tw:dark:bg-slate-700/50 tw:cursor-pointer tw:transition-all tw:border-opacity-50 tw:border-gray-200 tw:dark:border-slate-700 ' +
                      (bugs.length - 1 != index ? 'tw:border-b' : '')
                    }
                    onClick={() => navigate(`/feedback/${bug.id}`)}
                  >
                    <div className='tw:w-20 tw:text-gray-500 tw:dark:text-gray-400'>
                      {categoryCodeToName(bug.category)}
                    </div>
                    <div className='tw:flex-1 tw:text-gray-900 tw:dark:text-white'>{bug.title}</div>
                    <div
                      className={`tw:w-16 ${bug.status === 'OPEN' ? 'tw:text-green-500' : bug.status === 'IN_PROGRESS' ? 'tw:text-indigo-500' : 'tw:text-red-500'}`}
                    >
                      {statusCodeToName(bug.status)}
                    </div>
                    <div className='tw:w-32 tw:text-gray-500 tw:dark:text-gray-400'>
                      {bug.reporterName}
                    </div>
                    {/* <div className='tw:w-32 tw:text-gray-400'>
                      {bug.comments &&
                      bug.comments.filter((data) => data.commenterName != bug.reporterName).length >
                        0
                        ? bug.comments.filter((data) => data.commenterName != bug.reporterName)[
                            bug.comments.filter((data) => data.commenterName != bug.reporterName)
                              .length - 1
                          ]?.commenterName
                        : '없음'}
                    </div> */}
                    <div className='tw:w-24 tw:text-gray-500 tw:dark:text-gray-400'>
                      {dayjs(bug.createdAt).format('YYYY-MM-DD')}
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}

          <div className='tw:mt-6 tw:flex tw:justify-center'>
            <div className='tw:flex tw:gap-2'>
              {Array.from({
                length: Math.max(1, Math.ceil(pagination.total / pagination.pageSize)),
              }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    void fetchBugs(i)
                  }}
                  className={`tw:px-3 tw:py-1 tw:rounded ${
                    pagination.current === i + 1
                      ? 'tw:bg-indigo-600 tw:text-white'
                      : 'tw:bg-white tw:dark:bg-slate-700 tw:text-gray-700 tw:dark:text-gray-200 tw:border tw:border-gray-200 tw:dark:border-slate-600 hover:tw:bg-gray-100 hover:tw:dark:bg-slate-600'
                  } tw:transition-colors`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          <FeedbackCreateModal
            isOpen={isModalVisible}
            onClose={() => {
              setIsModalVisible(false)
            }}
            title='피드백 작성하기'
          >
            <div className='tw:flex tw:flex-col tw:h-full'>
              <div className='tw:shrink-0 tw:mb-4 tw:flex tw:gap-4'>
                <div className='tw:flex-1'>
                  <label className='tw:block tw:mb-2 tw:text-gray-700 tw:dark:text-gray-300'>
                    제목
                  </label>
                  <input
                    type='text'
                    value={newBug.title}
                    onChange={(e) => {
                      setNewBug({ ...newBug, title: e.target.value })
                    }}
                    className='tw:w-full tw:bg-white tw:dark:bg-slate-700 tw:border tw:border-gray-300 tw:dark:border-slate-600 tw:rounded-sm tw:px-3 tw:py-2 tw:text-gray-700 tw:dark:text-white focus:tw:outline-none focus:tw:ring-2 focus:tw:ring-indigo-500'
                    placeholder='제목을 입력하세요'
                  />
                </div>
                <div className='tw:flex-1'>
                  <label className='tw:block tw:mb-2 tw:text-gray-700 tw:dark:text-gray-300'>
                    카테고리
                  </label>
                  <select
                    value={newBug.category}
                    onChange={(e) => {
                      setNewBug({ ...newBug, category: e.target.value })
                    }}
                    className='tw:w-full tw:bg-white tw:dark:bg-slate-700 tw:border tw:border-gray-300 tw:dark:border-slate-600 tw:text-gray-700 tw:dark:text-white tw:rounded-sm tw:h-9 tw:px-3 tw:py-2 focus:tw:outline-none focus:tw:ring-2 focus:tw:ring-indigo-500'
                  >
                    <option value='BUG'>버그 제보</option>
                    <option value='FEATURE_REQUEST'>기능 요청</option>
                    <option value='QUESTION'>질문</option>
                    <option value='OTHER'>기타</option>
                  </select>
                </div>
              </div>

              <div className='tw:flex-1 tw:flex tw:flex-col tw:min-h-0 tw:rounded rich-text-content'>
                <label className='tw:block tw:mb-2 tw:text-gray-700 tw:dark:text-gray-300'>
                  내용
                </label>
                {editorLoaded ? (
                  <div className='editor-wrapper tw:flex-1 tw:h-full'>
                    <CKEditor
                      editor={ClassicEditor}
                      data={newBug.description}
                      config={editorConfiguration}
                      onChange={(event: unknown, editor: ClassicEditor) => {
                        const data = editor.getData()
                        setNewBug({ ...newBug, description: data })
                      }}
                    />
                  </div>
                ) : (
                  <PuffLoader size={32} color='#6366f1' />
                )}
              </div>

              <div className='tw:shrink-0 tw:mt-4 tw:flex tw:justify-end tw:gap-2'>
                <button
                  onClick={() => setIsModalVisible(false)}
                  className='tw:px-4 tw:py-2 tw:bg-white tw:dark:bg-slate-700 tw:text-gray-700 tw:dark:text-gray-200 tw:border tw:border-gray-300 tw:dark:border-slate-600 tw:rounded hover:tw:bg-gray-100 hover:tw:dark:bg-slate-600 tw:transition-colors'
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    handleCreateBug()
                  }}
                  disabled={loading}
                  className='tw:px-4 tw:py-2 tw:bg-indigo-600 tw:text-white tw:rounded hover:tw:bg-indigo-700 tw:transition-colors disabled:tw:opacity-50'
                >
                  {loading ? <PuffLoader size={8} color='#ffffff' /> : '작성하기'}
                </button>
              </div>
            </div>
          </FeedbackCreateModal>
        </div>
      </motion.div>
    </React.Fragment>
  )
}
