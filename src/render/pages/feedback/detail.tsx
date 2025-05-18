import React, { useEffect, useState } from 'react'

import { createLog } from '@render/libs/logger'
import { RootState } from '@render/store'
import { FeedbackCommentResponse, FeedbackResponse } from '@src/types/dto/feedback/FeedbackResponse'
import dayjs from 'dayjs'
import DOMPurify from 'dompurify'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { PuffLoader, SyncLoader } from 'react-spinners'
import apiClient from '../../../libs/apiClient'

// 전역 스타일 추가
const richTextStyles = `
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

export default function FeedbackDetailPage() {
  const navigate = useNavigate()
  const { feedbackId } = useParams()
  const [bug, setBug] = useState<FeedbackResponse | null>(null)
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const { userData } = useSelector((state: RootState) => state.app)
  const { t } = useTranslation(['feedback'])

  const fetchBugDetail = async () => {
    try {
      const response = await apiClient.get<FeedbackResponse>(`/v3/racla/feedback/${feedbackId}`, {
        headers: { Authorization: `${userData.playerId}|${userData.playerToken}` },
        withCredentials: true,
      })
      const data = await response.data.data
      setBug(data)
    } catch (error) {
      createLog('error', 'Error in fetchBugDetail', error)
    }
  }

  useEffect(() => {
    if (feedbackId) {
      void fetchBugDetail()
    }
  }, [feedbackId])

  const handleAddComment = async () => {
    try {
      setLoading(true)
      const response = await apiClient.post<FeedbackCommentResponse>(
        `/v3/racla/feedback/${feedbackId}/comments`,
        {
          content: newComment,
        },
        {
          headers: { Authorization: `${userData.playerId}|${userData.playerToken}` },
          withCredentials: true,
        },
      )

      if (response.status === 201) {
        setNewComment('')
        void fetchBugDetail()
      }
    } catch (error) {
      createLog('error', 'Error in handleAddComment', error)
    } finally {
      setLoading(false)
    }
  }

  if (!bug) {
    return (
      <div className='tw:min-h-screen tw:bg-white tw:dark:bg-slate-800 tw:flex tw:justify-center tw:items-center'>
        <PuffLoader color='#6366f1' size={32} />
      </div>
    )
  }

  return (
    <React.Fragment>
      <style>{richTextStyles}</style>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className='tw:space-y-6 tw:p-2'
      >
        <div className='tw:bg-white tw:dark:bg-slate-800 tw:rounded-lg tw:text-sm'>
          <div className='tw:flex tw:items-center tw:justify-between tw:mb-4'>
            <h1 className='tw:text-2xl tw:font-bold tw:text-gray-900 tw:dark:text-white'>
              {bug.title}
            </h1>
            <button
              type='button'
              className='tw:px-4 tw:py-1.5 tw:text-sm tw:bg-indigo-600 tw:text-white tw:rounded hover:tw:bg-indigo-700 tw:transition-colors'
              onClick={() => {
                navigate('/feedback')
              }}
            >
              {t('detail.backToList')}
            </button>
          </div>

          <div className='tw:space-y-2 tw:mb-4'>
            <p className='tw:text-gray-500 tw:dark:text-gray-400'>
              <span className='tw:font-semibold'>{t('detail.status')}:</span> {bug.status}
            </p>
            <p className='tw:text-gray-500 tw:dark:text-gray-400'>
              <span className='tw:font-semibold'>{t('detail.author')}:</span> {bug.reporterName}
            </p>
            <p className='tw:text-gray-500 tw:dark:text-gray-400'>
              <span className='tw:font-semibold'>{t('detail.createdAt')}:</span>{' '}
              {dayjs(bug.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </p>
            <div
              className='rich-text-content tw:bg-white tw:dark:bg-slate-700/50 tw:border tw:border-gray-200 tw:dark:border-slate-600 tw:p-6 tw:rounded-lg tw:space-y-4 tw:text-gray-700 tw:dark:text-gray-200'
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(bug.description) }}
            />
          </div>

          <div className='tw:space-y-4'>
            <h2 className='tw:text-lg tw:font-semibold tw:text-gray-900 tw:dark:text-white'>
              {t('detail.comments')}
            </h2>

            {userData.playerName !== '' ? (
              bug.status !== 'CLOSED' ? (
                <div className='tw:mb-4'>
                  <div className='tw:flex tw:gap-2'>
                    <textarea
                      value={newComment}
                      onChange={(e) => {
                        setNewComment(e.target.value)
                      }}
                      className='tw:flex-1 tw:bg-white tw:dark:bg-slate-700 tw:border tw:border-gray-300 tw:dark:border-slate-600 tw:rounded tw:px-3 tw:py-2 tw:text-gray-700 tw:dark:text-white focus:tw:outline-none focus:tw:ring-2 focus:tw:ring-indigo-500'
                      placeholder={t('detail.commentPlaceholder')}
                      rows={3}
                    />
                    <button
                      onClick={() => {
                        void handleAddComment()
                      }}
                      disabled={loading || !newComment.trim()}
                      className='tw:px-4 tw:py-2 tw:bg-indigo-600 tw:text-white tw:rounded hover:tw:bg-indigo-700 tw:transition-colors disabled:tw:opacity-50'
                    >
                      {loading ? <SyncLoader size={8} color='#ffffff' /> : t('detail.submit')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className='tw:bg-gray-50 tw:dark:bg-slate-700/50 tw:border tw:border-gray-200 tw:dark:border-slate-600 tw:p-6 tw:rounded-lg tw:space-y-4 tw:text-center tw:text-gray-700 tw:dark:text-gray-300'>
                  <p className='tw:whitespace-pre-wrap'>{t('detail.closedExplanation')}</p>
                </div>
              )
            ) : (
              <div className='tw:bg-gray-50 tw:dark:bg-slate-700/50 tw:border tw:border-gray-200 tw:dark:border-slate-600 tw:p-6 tw:rounded-lg tw:space-y-4 tw:text-center tw:text-gray-700 tw:dark:text-gray-300'>
                <p className='tw:whitespace-pre-wrap'>{t('detail.loginRequired')}</p>
              </div>
            )}

            <div className='tw:space-y-4'>
              {bug.comments.map((comment) => (
                <div
                  key={comment.id}
                  className='tw:bg-gray-50 tw:dark:bg-slate-700/50 tw:border tw:border-gray-200 tw:dark:border-slate-600 tw:rounded tw:p-4'
                >
                  <div className='tw:flex tw:justify-between tw:items-center tw:mb-2'>
                    <span className='tw:font-medium tw:text-gray-900 tw:dark:text-white'>
                      {comment.commenterName}
                    </span>
                    <span className='tw:text-sm tw:text-gray-500 tw:dark:text-gray-400'>
                      {dayjs(comment.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                    </span>
                  </div>
                  <p className='tw:whitespace-pre-wrap tw:text-gray-700 tw:dark:text-gray-300'>
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </React.Fragment>
  )
}
