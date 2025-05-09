export interface ApiResponse<T> {
  success: boolean
  status: number
  code: string
  message?: string
  timestamp: number
  timestampISO: string
  path?: string
  errors?: FieldError[]
  data?: T
}

export interface FieldError {
  field: string
  value: string
  reason: string
}
