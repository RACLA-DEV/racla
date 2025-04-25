import { useParams } from 'react-router-dom'

function UserDetailPage() {
  // URL 파라미터에서 id 값 가져오기
  const { id } = useParams()

  return (
    <div className='tw:p-8'>
      <h1 className='tw:text-2xl tw:font-bold tw:mb-4'>사용자 상세 정보</h1>
      <div className='tw:bg-gray-100 tw:p-4 tw:rounded-lg tw:shadow'>
        <p className='tw:mb-2'>
          <span className='tw:font-medium'>사용자 ID:</span> {id}
        </p>
        <p className='tw:text-gray-600'>
          이 페이지는 동적 라우팅을 테스트하기 위한 페이지입니다. URL 파라미터에서 id 값을 가져와
          표시합니다.
        </p>
      </div>

      <div className='tw:mt-6'>
        <p className='tw:text-sm tw:text-gray-500'>
          다음과 같은 URL로 접근할 수 있습니다: <code>/users/123</code>, <code>/users/abc</code> 등
        </p>
      </div>
    </div>
  )
}

export default UserDetailPage
