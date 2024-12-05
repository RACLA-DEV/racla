import DjmaxHomeComponent from '@/components/Home/DjmaxHomeComponent'
import WjmaxHomeComponent from '@/components/Home/WjmaxHomeComponent'
import { useSelector } from 'react-redux'
import { RootState } from 'store'

const Home = () => {
  const selectedGame = useSelector((state: RootState) => state.app.selectedGame)
  return (
    <>
      {selectedGame === 'wjmax' && <WjmaxHomeComponent />}
      {selectedGame === 'djmax_respect_v' && <DjmaxHomeComponent />}
    </>
  )
}

export default Home
