export interface FeedbackResponse {
  id: number
  title: string
  description: string
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED'
  reporterId: number
  reporterName: string
  createdAt: string
  category: 'NOTICE' | 'BUG' | 'FEATURE_REQUEST' | 'QUESTION' | 'OTHER'
  isPinned: boolean
  isPrivate: boolean
  comments: FeedbackCommentResponse[]
}

export interface FeedbackCommentResponse {
  id: number
  content: string
  createdAt: number
  createdAtISO: string
  commenterId: number
  commenterName: string
}

export interface FeedbackPageResponse {
  content: FeedbackResponse[]
  pageNo: number
  pageSize: number
  totalElements: number
  totalPages: number
  last: boolean
}
