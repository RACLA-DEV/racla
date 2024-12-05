import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Input, Button, List } from 'antd'
import { SyncLoader } from 'react-spinners'
import { motion } from 'framer-motion'
import { FaCircleCheck } from 'react-icons/fa6'
import moment from 'moment'
import 'moment/locale/ko'
import { useSelector } from 'react-redux'
import { RootState } from 'store'
import axios from 'axios'

interface Comment {
  id: number
  content: string
  createdAt: string
  commenterId: number
  commenterName: string
}

interface Bug {
  id: number
  title: string
  description: string
  status: string
  reporterId: number
  reporterName: string
  comments: Comment[]
}

export default function BugDetail() {
  const router = useRouter()
  const { bugId } = router.query
  const [bug, setBug] = useState<Bug | null>(null)
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const { fontFamily } = useSelector((state: RootState) => state.ui)
  const { userData } = useSelector((state: RootState) => state.app)

  const fetchBugDetail = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/v1/bug/${bugId}`, {
        headers: { Authorization: `${userData.userNo}|${userData.userToken}'` },
        withCredentials: true,
      })
      const data = await response.data
      setBug(data)
    } catch (error) {}
  }

  useEffect(() => {
    if (bugId) {
      fetchBugDetail()
    }
  }, [bugId])

  const handleAddComment = async () => {
    try {
      setLoading(true)
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/bug/${bugId}/comments`,
        { content: newComment },
        {
          headers: { Authorization: `${userData.userNo}|${userData.userToken}'` },
          withCredentials: true,
        },
      )

      if (response.status === 201) {
        setNewComment('')
        fetchBugDetail()
      }
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  if (!bug) {
    return (
      <div className="tw-min-h-screen tw-bg-gray-800 tw-bg-opacity-50 tw-flex tw-justify-center tw-items-center">
        <SyncLoader color="#3B82F6" />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="tw-space-y-6">
      <div className="tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg tw-p-6">
        <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
          <h1 className="tw-text-2xl tw-font-bold">{bug.title}</h1>
          <button type="button" className="tw-px-4 tw-py-1.5 tw-text-sm tw-bg-blue-600 tw-rounded hover:tw-bg-blue-700" onClick={() => router.push('/bug')}>
            피드백 센터로 돌아가기
          </button>
        </div>

        <div className="tw-space-y-2 tw-mb-4">
          <p className="tw-text-gray-400">
            <span className="tw-font-semibold">상태:</span> {bug.status}
          </p>
          <p className="tw-text-gray-400">
            <span className="tw-font-semibold">작성자:</span> {bug.reporterName}
          </p>
        </div>
        <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-p-4 tw-rounded tw-space-y-2 tw-mb-auto">
          <p className=" tw-whitespace-pre-wrap tw-text-base">{bug.description}</p>
        </div>
      </div>

      <div className="tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg tw-p-6">
        <h2 className="tw-text-xl tw-font-bold tw-mb-4">추가 의견</h2>
        {userData.userName !== '' ? (
          bug.status == 'OPEN' || bug.status == 'IN_PROGRESS' ? (
            <div className="tw-flex tw-gap-2 tw-mb-4">
              <Input.TextArea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="추가 의견을 작성해주세요. 부적절한 언어 사용과 문제 발생 시 피드백 센터의 이용 제한 조치가 이루어질 수 있습니다."
                className={'tw-bg-gray-900 tw-border-gray-700 tw-text-white' + ' ' + fontFamily}
                rows={2}
              />
              <button
                onClick={handleAddComment}
                className="tw-px-4 tw-py-1.5 tw-min-w-20 tw-text-sm tw-bg-blue-600 tw-text-white tw-rounded hover:tw-bg-blue-700 tw-border-none"
              >
                작성
              </button>
            </div>
          ) : (
            <div className="tw-w-full tw-p-4 tw-bg-gray-800 tw-rounded tw-mb-4">
              <p className="tw-whitespace-pre-wrap tw-text-gray-300">관리자가 해당 피드백의 상태를 CLOSED로 변경하였습니다.</p>
            </div>
          )
        ) : (
          <span className="tw-flex tw-w-full tw-justify-center">추가 의견 작성은 로그인이 필요합니다.</span>
        )}

        <div className={'tw-text-white tw-flex tw-flex-col tw-gap-4 tw-rounded-md ' + ' ' + fontFamily}>
          {bug.comments.map((comment) => (
            <div className="tw-w-full tw-p-4 tw-bg-gray-800 tw-rounded" key={'comment_' + comment.id}>
              <div className="tw-flex tw-justify-between tw-items-center tw-mb-2">
                <span className="tw-font-semibold">{comment.commenterName}</span>
                <span className="tw-text-gray-400 tw-text-sm">{moment(comment.createdAt).utcOffset(9).format('YYYY년 MM월 DD일 HH시 mm분 ss초')}</span>
              </div>
              <p className="tw-whitespace-pre-wrap tw-text-gray-300">{comment.content}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
