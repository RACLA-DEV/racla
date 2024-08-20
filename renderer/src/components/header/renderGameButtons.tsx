// renderGameButton.tsx
import Image from 'next/image'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'

export const renderGameButtons = (game, logoPath, gameName, selectedGame, handleGameSelection) => {
  return (
    <OverlayTrigger
      placement="bottom"
      overlay={
        <Tooltip id={`btn-select-game-${game}`} className="tw-text-xs">
          {game === 'DJMAX_RESPECT_V' ? 'V-ARCHIVE에 기록된 정보를 바탕으로 제공되는 서비스' : '프로젝트 RA 제공 서비스'}
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
        <Image src={logoPath} height={16} width={16} alt={gameName} />
        <span className="tw-text-xs">{gameName}</span>
      </button>
    </OverlayTrigger>
  )
}
