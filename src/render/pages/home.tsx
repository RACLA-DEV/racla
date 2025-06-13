import DjmaxHomeComponent from '@render/components/home/DjmaxSection'
import PlatinaLabHomeComponent from '@render/components/home/PlatinaLabSection'
import { RootState } from '@render/store'
import { AnimatePresence, motion } from 'framer-motion'
import { useSelector } from 'react-redux'

// 애니메이션 변수
const pageTransition = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: 'easeInOut' as const,
    },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.3,
      ease: 'easeInOut' as const,
    },
  },
} as const

const HomePage = () => {
  const { selectedGame } = useSelector((state: RootState) => state.app)

  return (
    <div className='tw:relative tw:w-full tw:h-full'>
      <AnimatePresence mode='wait'>
        {selectedGame == 'djmax_respect_v' && (
          <motion.div
            key='djmax'
            initial='hidden'
            animate='visible'
            exit='exit'
            variants={pageTransition}
            className='tw:absolute tw:w-full'
          >
            <DjmaxHomeComponent />
          </motion.div>
        )}
        {selectedGame == 'platina_lab' && (
          <motion.div
            key='platina_lab'
            initial='hidden'
            animate='visible'
            exit='exit'
            variants={pageTransition}
            className='tw:absolute tw:w-full'
          >
            <PlatinaLabHomeComponent />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default HomePage
