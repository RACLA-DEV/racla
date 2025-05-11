import { RootState } from '@render/store'
import {
  clearAlertModalCallback,
  hideAlertModal,
  showAlertModal,
} from '@render/store/slices/uiSlice'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { v4 as uuidv4 } from 'uuid'

// 콜백 함수를 저장할 맵
const callbackMap = new Map<string, () => void>()

export function useAlert() {
  const dispatch = useDispatch()
  const alertModal = useSelector((state: RootState) => state.ui.alertModal)

  // 알림 모달 표시
  const showAlert = useCallback(
    (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
      dispatch(
        showAlertModal({
          title,
          message,
          type,
        }),
      )
    },
    [dispatch],
  )

  // 확인/취소 모달 표시
  const showConfirm = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      type: 'success' | 'error' | 'warning' | 'info' = 'warning',
      confirmText?: string,
      cancelText?: string,
    ) => {
      // 콜백 함수를 저장할 고유 ID 생성
      const callbackId = uuidv4()

      // 맵에 콜백 함수 저장
      callbackMap.set(callbackId, onConfirm)

      dispatch(
        showAlertModal({
          title,
          message,
          type,
          confirmMode: true,
          onConfirmId: callbackId,
          confirmText,
          cancelText,
        }),
      )
    },
    [dispatch],
  )

  // 알림 모달 닫기
  const hideAlert = useCallback(() => {
    dispatch(hideAlertModal())
  }, [dispatch])

  // 확인 버튼 처리
  const handleConfirm = useCallback(() => {
    if (alertModal.onConfirm) {
      const callback = callbackMap.get(alertModal.onConfirm)
      if (callback) {
        callback()
        callbackMap.delete(alertModal.onConfirm)
      }
      dispatch(clearAlertModalCallback())
    }
    dispatch(hideAlertModal())
  }, [alertModal.onConfirm, dispatch])

  return {
    alertModal,
    showAlert,
    showConfirm,
    hideAlert,
    handleConfirm,
  }
}
