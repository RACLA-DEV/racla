import React, { useEffect, useState } from 'react'

import Head from 'next/head'
import { RootState } from 'store'
import { SyncLoader } from 'react-spinners'
import axios from 'axios'
import dayjs from 'dayjs'
import { logRendererError } from '@utils/rendererLoggerUtils'
import { motion } from 'framer-motion'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'

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
  createdAt: string
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
    } catch (error) {
      logRendererError(error, { message: 'Error in fetchBugDetail', ...userData })
    }
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
      logRendererError(error, { message: 'Error in handleAddComment', ...userData })
    } finally {
      setLoading(false)
    }
  }

  if (!bug) {
    return (
      <div className='tw-min-h-screen tw-bg-gray-600 tw-bg-opacity-20 tw-flex tw-justify-center tw-items-center'>
        <SyncLoader color='#ffffff' size={8} />
      </div>
    )
  }

  return (
    <React.Fragment>
      <Head>
        <title>피드백 센터 - RACLA</title>
      </Head>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className='tw-space-y-6'
      >
        <div className='tw-bg-gray-600 tw-bg-opacity-20 tw-rounded-lg tw-p-6'>
          <div className='tw-flex tw-items-center tw-justify-between tw-mb-4'>
            <h1 className='tw-text-2xl tw-font-bold'>{bug.title}</h1>
            <button
              type='button'
              className='tw-px-4 tw-py-1.5 tw-text-sm tw-bg-blue-600 tw-rounded hover:tw-bg-blue-700 tw-transition-colors'
              onClick={() => router.push('/bug')}
            >
              피드백 센터로 돌아가기
            </button>
          </div>

          <div className='tw-space-y-2 tw-mb-4'>
            <p className='tw-text-gray-400'>
              <span className='tw-font-semibold'>상태:</span> {bug.status}
            </p>
            <p className='tw-text-gray-400'>
              <span className='tw-font-semibold'>작성자:</span> {bug.reporterName}
            </p>
            <p className='tw-text-gray-400'>
              <span className='tw-font-semibold'>작성 시간:</span>{' '}
              {dayjs(bug.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </p>
            <div
              className='tw-bg-gray-800 tw-p-6 tw-rounded-lg tw-space-y-4 [&_ol]:tw-list-decimal [&_ol]:tw-ml-4 [&_ol]:tw-my-4 [&_ol>li]:tw-mb-4 [&_ol>li]:tw-leading-relaxed [&_ol_ol]:tw-list-disc [&_ol_ol]:tw-ml-8 [&_ol_ol]:tw-mt-2 [&_ol_ol>li]:tw-mb-2 [&_ol_ol>li]:tw-leading-relaxed [&_p]:tw-mb-6 [&_p]:tw-leading-relaxed [&_strong]:tw-block [&_strong]:tw-mb-4'
              dangerouslySetInnerHTML={{ __html: bug.description }}
            />
          </div>

          <div className='tw-space-y-4'>
            <h2 className='tw-text-lg tw-font-semibold'>추가 의견</h2>

            {userData.userName !== '' ? (
              bug.status !== 'CLOSED' ? (
                <div className='tw-mb-4'>
                  <div className='tw-flex tw-gap-2'>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className='tw-flex-1 tw-bg-gray-700 tw-rounded tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500'
                      placeholder='추가 의견을 작성해주세요. 부적절한 언어 사용과 문제 발생 시 피드백 센터의 이용 제한 조치가 이루어질 수 있습니다.'
                      rows={3}
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={loading || !newComment.trim()}
                      className='tw-px-4 tw-py-2 tw-bg-blue-600 tw-rounded hover:tw-bg-blue-700 tw-transition-colors disabled:tw-opacity-50'
                    >
                      {loading ? <SyncLoader size={8} color='#ffffff' /> : '작성하기'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className='tw-bg-gray-800 tw-p-6 tw-rounded-lg tw-space-y-4 tw-text-center'>
                  <p className='tw-whitespace-pre-wrap'>
                    관리자가 해당 피드백의 상태를 CLOSED로 변경하여 추가 의견을 더 이상 작성할 수
                    없습니다.
                  </p>
                </div>
              )
            ) : (
              <div className='tw-bg-gray-800 tw-p-6 tw-rounded-lg tw-space-y-4 tw-text-center'>
                <p className='tw-whitespace-pre-wrap'>추가 의견 작성은 로그인이 필요합니다.</p>
              </div>
            )}

            <div className='tw-space-y-4'>
              {bug.comments.map((comment) => (
                <div key={comment.id} className='tw-bg-gray-700 tw-bg-opacity-50 tw-rounded tw-p-4'>
                  <div className='tw-flex tw-justify-between tw-items-center tw-mb-2'>
                    <span className='tw-font-medium'>{comment.commenterName}</span>
                    <span className='tw-text-sm tw-text-gray-400'>
                      {dayjs(comment.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                    </span>
                  </div>
                  <p className='tw-whitespace-pre-wrap'>{comment.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </React.Fragment>
  )
}
