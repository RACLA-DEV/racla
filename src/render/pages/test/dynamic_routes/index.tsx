import { Link } from 'react-router-dom'

function UsersListPage() {
  // 테스트용 사용자 목록
  const users = [
    { id: '1', name: '김철수' },
    { id: '2', name: '이영희' },
    { id: '3', name: '박지민' },
    { id: '4', name: '최재우' },
    { id: '5', name: '정소민' },
  ]

  return (
    <div className='tw:p-8'>
      <h1 className='tw:text-2xl tw:font-bold tw:mb-4'>사용자 목록</h1>
      <p className='tw:text-gray-600 tw:mb-6'>
        아래 사용자를 클릭하면 동적 라우팅을 통해 상세 페이지로 이동합니다.
      </p>

      <ul className='tw:bg-white tw:rounded-lg tw:shadow tw:divide-y tw:divide-gray-200'>
        {users.map((user) => (
          <li key={user.id} className='tw:p-4 tw:hover:bg-gray-50'>
            <Link
              to={`/players/${user.id}`}
              className='tw:flex tw:items-center tw:justify-between tw:text-blue-600 tw:hover:text-blue-800'
            >
              <span>{user.name}</span>
              <span className='tw:text-gray-400 tw:text-sm'>ID: {user.id}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className='tw:mt-8 tw:p-4 tw:bg-gray-100 tw:rounded-lg'>
        <h2 className='tw:text-lg tw:font-medium tw:mb-2'>파일 기반 라우팅 설명</h2>
        <p className='tw:text-sm tw:text-gray-600'>
          이 페이지는 <code>src/render/pages/players/index.tsx</code>에 위치하며,
          <code>/players</code> 경로로 접근됩니다.
        </p>
        <p className='tw:text-sm tw:text-gray-600 tw:mt-2'>
          사용자 상세 페이지는 <code>src/render/pages/players/$id.tsx</code>에 위치하며,
          <code>/players/:id</code> 경로로 자동 매핑됩니다.
        </p>
      </div>
    </div>
  )
}

export default UsersListPage
