import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { SyncLoader } from 'react-spinners'
import { BsList, BsGrid } from 'react-icons/bs'
import { motion, AnimatePresence } from 'framer-motion'
import { useSelector } from 'react-redux'
import { RootState } from 'store'
import axios from 'axios'
import { useNotificationSystem } from '@/libs/client/useNotifications'
import Modal from '@/components/common/Modal'

interface Bug {
  id: number
  title: string
  description: string
  status: string
  reporterId: number
  reporterName: string
  comments: any[]
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
  const [newBug, setNewBug] = useState({ title: '', description: '' })
  const [loading, setLoading] = useState(false)
  const { userData } = useSelector((state: RootState) => state.app)

  const { showNotification } = useNotificationSystem()

  const fetchBugs = async (page = 0) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/v1/bug?page=${page}`, {
        headers: { Authorization: `${userData.userNo}|${userData.userToken}'` },
        withCredentials: true,
      })
      const data: BugListResponse = await response.data
      setBugs(data.content)
      setPagination({
        ...pagination,
        current: data.pageNo + 1,
        total: data.totalElements,
      })
    } catch (error) {
      showNotification('피드백 리스트를 가져오는 중에 오류가 발생했습니다.', 'tw-bg-red-600')
    }
  }

  const fetchNotices = async () => {
    try {
      const [notice6, notice1] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/v1/bug/6`, {
          headers: { Authorization: `${userData.userNo}|${userData.userToken}'` },
          withCredentials: true,
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/v1/bug/1`, {
          headers: { Authorization: `${userData.userNo}|${userData.userToken}'` },
          withCredentials: true,
        }),
      ])
      setNotices([notice6.data, notice1.data])
    } catch (error) {
      console.error('Failed to fetch notices:', error)
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
        headers: { Authorization: `${userData.userNo}|${userData.userToken}'` },
        withCredentials: true,
      })
      const data = await response.data
      setIsModalVisible(false)
      setNewBug({ title: '', description: '' })
      router.push(`/bug/${data.id}`)
    } catch (error) {
      showNotification('피드백 생성 중 오류가 발생했습니다.', 'tw-bg-red-600')
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page: number, pageSize?: number) => {
    fetchBugs(page - 1)
  }

  const fontFamily = useSelector((state: RootState) => state.ui.fontFamily)

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="tw-flex tw-flex-col tw-gap-4">
      <div className="tw-flex tw-flex-col tw-gap-4 tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg tw-shadow-lg p-4">
        <div className="tw-flex tw-justify-between tw-items-center">
          <h1 className="tw-text-2xl tw-font-bold">피드백 센터</h1>
          {userData.userName !== '' ? (
            <button
              type="button"
              onClick={() => setIsModalVisible(true)}
              className="tw-px-4 tw-py-1.5 tw-text-sm tw-bg-blue-600 tw-rounded hover:tw-bg-blue-700"
            >
              피드백 생성
            </button>
          ) : (
            <span>피드백 생성은 로그인이 필요합니다.</span>
          )}
        </div>

        <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded tw-space-y-2 tw-mb-auto">
          <p className="tw-leading-relaxed">
            버그 신고, 의견 제공 등의 피드백을 작성 및 확인 할 수 있는 공간입니다. 부적절한 언어 사용과 문제 발생 시 피드백 센터의 이용 제한 조치가 이루어질 수
            있습니다.
          </p>
          <p className="tw-leading-relaxed">OPEN 상태는 아직 개발자가 확인하지 않은 단계를 의미하며 해당 내용이 확인된 경우 IN_PROGRESS 상태로 전환됩니다. </p>
          <p className="tw-leading-relaxed">
            CLOSED 상태인 경우 해당 피드백에 대한 조치가 완료 되었다는 것을 의미하며 원본 내용을 유지하기 위해 추가 의견을 작성할 수 없습니다.
          </p>
        </div>

        {notices.length > 0 && (
          <div className="tw-flex tw-flex-col tw-gap-2">
            <h2 className="tw-text-xl tw-font-bold">고정됨</h2>

            <div className="tw-flex tw-flex-col tw-bg-gray-600 tw-bg-opacity-10 tw-rounded-md tw-px-4 tw-py-2">
              <div className="tw-flex tw-items-center tw-gap-4 tw-p-2 tw-border-b tw-border-gray-600 tw-text-gray-400 tw-font-bold tw-text-sm">
                <div className="tw-w-32">#</div>
                <div className="tw-flex-1">제목</div>
                <div className="tw-w-32">상태</div>
                <div className="tw-w-32">작성자</div>
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
                  <div className="tw-w-32 tw-text-gray-400">#{notice.id}</div>
                  <div className="tw-flex-1 tw-text-white">{notice.title}</div>
                  <div className="tw-w-32 tw-text-gray-400">{notice.status}</div>
                  <div className="tw-w-32 tw-text-gray-400">{notice.reporterName}</div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="tw-flex tw-justify-center tw-items-center tw-h-64">
            <SyncLoader color="#ffffff" size={8} />
          </div>
        ) : (
          <>
            <h2 className="tw-text-xl tw-font-bold">목록</h2>
            <div className="tw-flex tw-flex-col tw-bg-gray-600 tw-bg-opacity-10 tw-rounded-md tw-px-4 tw-py-2">
              <div className="tw-flex tw-items-center tw-gap-4 tw-p-2 tw-border-b tw-border-gray-600 tw-text-gray-400 tw-font-bold tw-text-sm">
                <div className="tw-w-32">#</div>
                <div className="tw-flex-1">제목</div>
                <div className="tw-w-32">상태</div>
                <div className="tw-w-32">작성자</div>
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
                  <div className="tw-w-32 tw-text-gray-400">#{bug.id}</div>
                  <div className="tw-flex-1 tw-text-white">{bug.title}</div>
                  <div className="tw-w-32 tw-text-gray-400">{bug.status}</div>
                  <div className="tw-w-32 tw-text-gray-400">{bug.reporterName}</div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        <div className="tw-mt-6 tw-flex tw-justify-center">
          <div className="tw-flex tw-gap-2">
            {Array.from({ length: Math.ceil(pagination.total / pagination.pageSize) }).map((_, i) => (
              <button
                key={i}
                onClick={() => fetchBugs(i)}
                className={`tw-px-3 tw-py-1 tw-rounded ${
                  pagination.current === i + 1 ? 'tw-bg-blue-600' : 'tw-bg-gray-700 hover:tw-bg-gray-600'
                } tw-transition-colors`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        <Modal isOpen={isModalVisible} onClose={() => setIsModalVisible(false)} title="피드백 작성하기">
          <div className="tw-space-y-4">
            <div>
              <label className="tw-block tw-mb-2">제목</label>
              <input
                type="text"
                value={newBug.title}
                onChange={(e) => setNewBug({ ...newBug, title: e.target.value })}
                className="tw-w-full tw-bg-gray-700 tw-rounded tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500"
                placeholder="제목을 입력하세요"
              />
            </div>
            <div>
              <label className="tw-block tw-mb-2">내용</label>
              <textarea
                value={newBug.description}
                onChange={(e) => setNewBug({ ...newBug, description: e.target.value })}
                className="tw-w-full tw-bg-gray-700 tw-rounded tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500 tw-min-h-[100px]"
                placeholder="내용을 입력하세요"
              />
            </div>
            <div className="tw-flex tw-justify-end tw-gap-2">
              <button onClick={() => setIsModalVisible(false)} className="tw-px-4 tw-py-2 tw-bg-gray-700 tw-rounded hover:tw-bg-gray-600 tw-transition-colors">
                취소
              </button>
              <button
                onClick={handleCreateBug}
                disabled={loading}
                className="tw-px-4 tw-py-2 tw-bg-blue-600 tw-rounded hover:tw-bg-blue-700 tw-transition-colors disabled:tw-opacity-50"
              >
                {loading ? <SyncLoader size={8} color="#ffffff" /> : '작성하기'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </motion.div>
  )
}
