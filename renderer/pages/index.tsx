import DjmaxHomeComponent from '@/components/home/DjmaxSection'
import Head from 'next/head'
import { RootState } from 'store'
import WjmaxHomeComponent from '@/components/home/WjmaxSection'
import { useSelector } from 'react-redux'

const Home = () => {
  const selectedGame = useSelector((state: RootState) => state.app.selectedGame)
  return (
    <>
      <Head>
        <title>RACLA</title>
      </Head>
      {selectedGame === 'wjmax' && <WjmaxHomeComponent />}
      {selectedGame === 'djmax_respect_v' && <DjmaxHomeComponent />}
    </>
  )
}

export default Home
