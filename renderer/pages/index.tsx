import DjmaxHomeComponent from '@/components/home/DjmaxSection'
import PlatinaLabHomeComponent from '@/components/home/PlatinaLabSection'
import WjmaxHomeComponent from '@/components/home/WjmaxSection'
import Head from 'next/head'
import { useSelector } from 'react-redux'
import { RootState } from 'store'

const Home = () => {
  const selectedGame = useSelector((state: RootState) => state.app.selectedGame)
  return (
    <>
      <Head>
        <title>RACLA</title>
      </Head>
      {selectedGame === 'wjmax' && <WjmaxHomeComponent />}
      {selectedGame === 'djmax_respect_v' && <DjmaxHomeComponent />}
      {selectedGame === 'platina_lab' && <PlatinaLabHomeComponent />}
    </>
  )
}

export default Home
