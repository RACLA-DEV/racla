// renderGameButton.tsx
import { globalDictionary } from '@/libs/server/globalDictionary'
import Image from 'next/image'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'

export const renderGameButtons = (game, logoPath, gameName, selectedGame, handleGameSelection) => {
  return (
    <OverlayTrigger
      placement="bottom"
      overlay={
        <Tooltip id={`btn-select-game-${game}`} className="tw-text-xs">
          {game === 'djmax_respect_v' ? 'V-ARCHIVE에 저장된 성과 기록을 바탕으로 제공되는 서비스' : 'RACLA 자체 제공 서비스'}
        </Tooltip>
      }
    >
      <button
        onClick={() => handleGameSelection(game)}
        type="button"
        className={
          'tw-flex tw-justify-center tw-items-center btn-select-game tw-gap-1 tw-rounded-sm tw-text-xs tw-bg-gray-800 ' +
          (selectedGame === game ? 'active' : '')
        }
      >
        <Image
          loading="lazy" // "lazy" | "eager"
          blurDataURL={globalDictionary.blurDataURL}
          src={logoPath}
          height={16}
          width={16}
          alt={gameName}
        />
        <span className="tw-text-xs">{gameName}</span>
      </button>
    </OverlayTrigger>
  )
}
