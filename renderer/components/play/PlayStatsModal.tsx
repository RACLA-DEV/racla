import { Dialog, Transition } from '@headlessui/react'
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js'

import { Fragment } from 'react'
import { Doughnut } from 'react-chartjs-2'
import { FaXmark } from 'react-icons/fa6'

ChartJS.register(ArcElement, Tooltip, Legend)

interface StatsModalProps {
  isOpen: boolean
  onClose: () => void
  stats: {
    maxCombo: number
    perfect: number
    over999: number
    over995: number
    over99: number
    over97: number
    clear: number
    total: number
  }
}

export default function StatsModal({ isOpen, onClose, stats }: StatsModalProps) {
  const data = {
    labels: ['MAX COMBO', 'PERFECT', '99.9%+', '99.5%+', '99.0%+', '97.0%+', 'CLEAR'],
    datasets: [
      {
        data: [
          stats.maxCombo,
          stats.perfect,
          stats.over999,
          stats.over995,
          stats.over99,
          stats.over97,
          stats.clear,
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)', // green-500
          'rgba(239, 68, 68, 0.8)', // red-500
          'rgba(234, 179, 8, 0.8)', // yellow-500
          'rgba(234, 179, 8, 0.6)', // yellow-500 (lighter)
          'rgba(234, 179, 8, 0.4)', // yellow-500 (lighter)
          'rgba(234, 179, 8, 0.2)', // yellow-500 (lighter)
          'rgba(59, 130, 246, 0.8)', // blue-500
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(234, 179, 8, 1)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(234, 179, 8, 0.6)',
          'rgba(234, 179, 8, 0.4)',
          'rgba(59, 130, 246, 1)',
        ],
        borderWidth: 1,
      },
    ],
  }

  const options = {
    responsive: true,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: 'white',
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || ''
            const value = context.raw || 0
            const percentage = ((value / stats.total) * 100).toFixed(1)
            return `${label}: ${value} (${percentage}%)`
          },
        },
      },
    },
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as='div' className='tw-relative tw-z-50' onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter='tw-ease-out tw-duration-300'
          enterFrom='tw-opacity-0'
          enterTo='tw-opacity-100'
          leave='tw-ease-in tw-duration-200'
          leaveFrom='tw-opacity-100'
          leaveTo='tw-opacity-0'
        >
          <div className='tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-70' />
        </Transition.Child>

        <div className='tw-fixed tw-inset-0 tw-overflow-y-auto'>
          <div className='tw-flex tw-min-h-full tw-items-center tw-justify-center tw-p-4'>
            <Transition.Child
              as={Fragment}
              enter='tw-ease-out tw-duration-300'
              enterFrom='tw-opacity-0 tw-scale-95'
              enterTo='tw-opacity-100 tw-scale-100'
              leave='tw-ease-in tw-duration-200'
              leaveFrom='tw-opacity-100 tw-scale-100'
              leaveTo='tw-opacity-0 tw-scale-95'
            >
              <Dialog.Panel className='tw-w-full tw-max-w-3xl tw-transform tw-overflow-hidden tw-rounded-2xl tw-bg-gray-800 tw-p-6 tw-text-left tw-align-middle tw-shadow-xl tw-transition-all'>
                <Dialog.Title
                  as='div'
                  className='tw-flex tw-justify-between tw-items-center tw-mb-4'
                >
                  <h3 className='tw-text-lg tw-font-bold tw-text-white'>플레이 통계</h3>
                  <button
                    onClick={onClose}
                    className='tw-text-gray-400 hover:tw-text-white tw-transition-colors'
                  >
                    <FaXmark size={20} />
                  </button>
                </Dialog.Title>

                <div className='tw-relative tw-w-full tw-aspect-[16/9]'>
                  <Doughnut data={data} options={options} />
                  <div className='tw-absolute tw-top-1/2 tw-left-1/2 tw-transform -tw-translate-x-1/2 -tw-translate-y-1/2 tw-text-center'>
                    <div className='tw-text-2xl tw-font-bold'>{stats.total}</div>
                    <div className='tw-text-sm tw-text-gray-400'>전체 곡</div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
