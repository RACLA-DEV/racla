import { globalDictionary } from '@/libs/server/globalDictionary'
import Image from 'next/image'
import Link from 'next/link'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { useSelector } from 'react-redux'
import { RootState } from 'store'

interface ScorePopupComponentProps {
  songItem: any
  keyMode: string
  userData: any
  songDataPackIndex?: number
  isScored?: any
  setBackgroundBgaName: any
}

const ScorePopupComponent = ({ songItem, keyMode, userData, songDataPackIndex, isScored, setBackgroundBgaName }: ScorePopupComponentProps) => {
  const fontFamily = useSelector((state: RootState) => state.ui.fontFamily)

  return (
    <OverlayTrigger
      key={'songDataPack' + songDataPackIndex + '_item' + songItem.title}
      placement="auto"
      overlay={
        <Tooltip id="btn-nav-home" className={`tw-text-xs tw-min-h-48 ${fontFamily}`}>
          {songItem !== null ? (
            <div className="tw-flex tw-flex-col">
              <div
                className="tw-flex tw-flex-col tw-w-80 tw-h-32 tw-relative tw-mb-2 tw-mt-1 tw-bg-gray-900 tw-overflow-hidden tw-rounded-md "
                style={{ opacity: 1 }}
              >
                <Image
                  src={`/images/djmax_respect_v/jackets/${songItem.title}.jpg`}
                  className="tw-absolute tw-animate-fadeInLeft tw-rounded-md tw-blur tw-brightness-50 tw-bg-opacity-90"
                  fill
                  alt=""
                  style={{ objectFit: 'cover' }}
                />
                <span className="tw-absolute tw-left-0 tw-bottom-0 tw-px-2 tw-font-bold tw-text-left tw-break-keep">
                  <span className="tw-font-medium tw-text-md">{songItem.composer}</span>
                  <br />
                  <span className=" tw-text-xl">{songItem.name}</span>
                </span>
                <span className="tw-absolute tw-top-1 tw-right-1 respect_dlc_code_wrap tw-animate-fadeInLeft tw-rounded-md p-1 tw-bg-gray-950">
                  <span className={`respect_dlc_code respect_dlc_code_${songItem.dlcCode}`}>{songItem.dlc}</span>
                </span>
              </div>
              <div className="tw-flex tw-flex-col tw-gap-2 tw-w-80 tw-p-2 tw-rounded-md tw-mb-1 tw-bg-gray-900 tw-bg-opacity-100">
                {['NM', 'HD', 'MX', 'SC'].map((value, difficultyIndex) =>
                  songItem.patterns[`${keyMode}B`][value] !== undefined && songItem.patterns[`${keyMode}B`][value] !== null ? (
                    <div
                      className="tw-flex tw-flex-col tw-gap-2"
                      key={'songDataPack' + (songDataPackIndex ? String(songDataPackIndex) : '0') + '_item' + songItem.title + '_hover' + value}
                    >
                      <div className="tw-flex tw-items-center tw-gap-1">
                        <span
                          className={
                            `tw-text-base tw-font-extrabold tw-text-left tw-z-50 text-stroke-100 tw-me-auto ` +
                            (value === 'NM'
                              ? 'tw-text-respect-nm-5'
                              : value === 'HD'
                              ? 'tw-text-respect-nm-10'
                              : value === 'MX'
                              ? 'tw-text-respect-nm-15'
                              : 'tw-text-respect-sc-15')
                          }
                        >
                          {globalDictionary.respect.difficulty[value].fullName}
                        </span>
                        <Image
                          src={
                            songItem.patterns[`${keyMode}B`][value].level <= 5
                              ? `/images/djmax_respect_v/${value === 'SC' ? 'sc' : 'nm'}_5_star.png`
                              : songItem.patterns[`${keyMode}B`][value].level <= 10
                              ? `/images/djmax_respect_v/${value === 'SC' ? 'sc' : 'nm'}_10_star.png`
                              : `/images/djmax_respect_v/${value === 'SC' ? 'sc' : 'nm'}_15_star.png`
                          }
                          height={14}
                          width={14}
                          alt=""
                        />
                        <span
                          className={
                            songItem.patterns[`${keyMode}B`][value].level <= 5
                              ? `tw-text-base text-stroke-100 tw-text-respect-${value === 'SC' ? 'sc' : 'nm'}-5`
                              : songItem.patterns[`${keyMode}B`][value].level <= 10
                              ? `tw-text-base text-stroke-100 tw-text-respect-${value === 'SC' ? 'sc' : 'nm'}-10`
                              : `tw-text-base text-stroke-100 tw-text-respect-${value === 'SC' ? 'sc' : 'nm'}-15`
                          }
                        >
                          {songItem.patterns[`${keyMode}B`][value].level}{' '}
                          <sup className="tw-text-xs">
                            {songItem.patterns[`${keyMode}B`][value].floor !== undefined && songItem.patterns[`${keyMode}B`][value].floor !== null
                              ? `(${songItem.patterns[`${keyMode}B`][value].floor}F)`
                              : null}
                          </sup>
                        </span>
                      </div>
                      {userData.userName !== '' ? (
                        <div className="tw-relative tw-w-full tw-bg-gray-950 tw-rounded-sm tw-overflow-hidden tw-animate-fadeInDown">
                          <div
                            className={
                              `tw-h-6 tw-transition-all tw-duration-500 tw-ease-in-out ` +
                              (value === 'NM'
                                ? 'tw-bg-respect-nm-5'
                                : value === 'HD'
                                ? 'tw-bg-respect-nm-10'
                                : value === 'MX'
                                ? 'tw-bg-respect-nm-15'
                                : 'tw-bg-respect-sc-15')
                            }
                            style={{
                              width: `${
                                songItem.patterns[`${keyMode}B`][value].score !== undefined && songItem.patterns[`${keyMode}B`][value].score !== null
                                  ? String(Math.floor(Number(songItem.patterns[`${keyMode}B`][value].score)))
                                  : '0'
                              }%`,
                            }}
                          />
                          <div className={'tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-font-extrabold tw-text-white'}>
                            {songItem.patterns[`${keyMode}B`][value].score !== undefined && songItem.patterns[`${keyMode}B`][value].score !== null
                              ? songItem.patterns[`${keyMode}B`][value].score === '100.00'
                                ? `PERFECT`
                                : `${songItem.patterns[`${keyMode}B`][value].score}%${songItem.patterns[`${keyMode}B`][value].maxCombo ? `(MAX COMBO)` : ''}`
                              : '0%(기록 미존재)'}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null,
                )}
              </div>
            </div>
          ) : null}
        </Tooltip>
      }
    >
      <div className="tw-inline-flex tw-flex-col tw-h-26 tw-w-20 tw-transition-all tw-me-3 tw-mb-3">
        <Link
          href={`/vArchive/db/title/${songItem.title}`}
          className="tw-relative tw-h-20 tw-w-20 tw-rounded-md hover-scale-110 respect_record tw-shadow-lg tw-cursor-pointer"
          onMouseEnter={() => setBackgroundBgaName(String(songItem.title))}
          onMouseLeave={() => setBackgroundBgaName('')}
        >
          <Image
            src={`/images/djmax_respect_v/jackets/${songItem.title}.jpg`}
            className="tw-absolute tw-animate-fadeInLeft tw-rounded-md"
            height={80}
            width={80}
            alt=""
          />
          <span className="tw-absolute tw-top-0 tw-left-0 respect_dlc_code_wrap tw-animate-fadeInLeft tw-rounded-tl-md">
            <span className={`respect_dlc_code respect_dlc_code_${songItem.dlcCode}`}>{songItem.dlcCode}</span>
          </span>
          <span
            className={`tw-absolute tw-right-0 tw-bottom-0 pattern tw-animate-fadeInLeft tw-rounded-br-md ${
              String(songItem.patterns[`${keyMode}B`].SC.level).includes('.5') ? 'MX' : 'SC'
            }`}
          >
            <span className={`tw-text-white`}>{String(songItem.patterns[`${keyMode}B`].SC.level).includes('.5') ? 'MX' : 'SC'}</span>
          </span>
        </Link>
        {userData.userName !== '' && isScored ? (
          <span className={'mt-2 tw-w-full tw-bg-gray-950 tw-text-center tw-rounded-md tw-text-sm tw-font-bold tw-animate-fadeInDown'}>
            {String(songItem.patterns[`${keyMode}B`].SC.level).includes('.5')
              ? songItem.patterns[`${keyMode}B`].MX.score
                ? songItem.patterns[`${keyMode}B`].MX.score === '100.00'
                  ? 'PERFECT'
                  : songItem.patterns[`${keyMode}B`].MX.score
                : '0.00'
              : songItem.patterns[`${keyMode}B`].SC.score
              ? songItem.patterns[`${keyMode}B`].SC.score === '100.00'
                ? 'PERFECT'
                : songItem.patterns[`${keyMode}B`].SC.score
              : '0.00'}
          </span>
        ) : null}
      </div>
    </OverlayTrigger>
  )
}

export default ScorePopupComponent
