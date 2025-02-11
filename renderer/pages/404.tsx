import { useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

export default function NotFoundPage({ userData }) {
  const router = useRouter()

  useEffect(() => {
    router.push('/')
  }, [])

  return (
    <>
      <Head>
        <title>404 Not Found - RACLA</title>
      </Head>
    </>
  )
}
