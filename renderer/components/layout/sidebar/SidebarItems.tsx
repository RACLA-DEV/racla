import * as R from 'ramda'

import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'

import Link from 'next/link'
import React from 'react'
import type { RootState } from 'store'
import { globalDictionary } from '@constants/globalDictionary'

export const renderNavigation = (selectedGame: string, router: any) => {
  const dispatch = useDispatch()
  const isMiniMode = useSelector((state: RootState) => state.app.isMiniMode)

  if (selectedGame && selectedGame !== '') {
    return R.keys(globalDictionary.navDictionary[selectedGame]).map((value, index) => {
      const navItem = globalDictionary.navDictionary[selectedGame][value]
      if (navItem.isDisplay && (!isMiniMode || navItem.id !== 'utilityNavTitle')) {
        return (
          <div key={navItem.id + 'Main'} className='tw-flex tw-flex-col'>
            {!isMiniMode ? (
              <span key={navItem.id + 'Head'} className='tw-font-semibold tw-text-xs tw-mb-2'>
                {navItem.name}
              </span>
            ) : null}
            <div key={navItem.id + 'Body'} className='tw-flex tw-flex-col tw-gap-0.5 tw-mb-3'>
              {navItem.pages.map((page) =>
                page.isDisplay && ['stable', 'beta'].includes(page.status) ? (
                  !page.isOpenBrowser ? (
                    <OverlayTrigger
                      key={page.id + 'isNotOpenBrowser'}
                      placement='right'
                      overlay={
                        <Tooltip id={`tooltip-${page.id}`} className='tw-text-xs'>
                          {page.description}
                        </Tooltip>
                      }
                    >
                      <Link
                        key={page.id}
                        href={navItem.link + page.link}
                        className={`tw-text-sm tw-text-gray-400 tw-font-light tw-flex tw-items-center tw-gap-2 btn-sidebar group relative ${
                          (router.asPath.includes(navItem.link + page.link) &&
                            navItem.link + page.link !== '/') ||
                          router.pathname === navItem.link + page.link
                            ? 'active'
                            : ''
                        } tw-rounded ${isMiniMode ? 'tw-my-1.5 tw-mr-2' : 'tw-py-1.5 tw-px-1 hover:tw-bg-gray-700 hover:tw-bg-opacity-30'} ${selectedGame === 'projectRa' ? 'tw-mr-2' : ''} `}
                      >
                        <div
                          className={`${isMiniMode ? 'tw-bg-gray-700 tw-bg-opacity-30 tw-p-2 tw-rounded-md' : ''}`}
                        >
                          {React.createElement(page.icon, { size: isMiniMode ? 16 : 14 })}
                        </div>
                        {!isMiniMode ? (
                          <span className='tw-flex tw-items-center flex-equal'>
                            {page.name.startWithSup ? (
                              <sup className='tw-text-[10px]'>{page.name.startWithSup}</sup>
                            ) : null}
                            <span className='tw-me-auto'>{page.name.base}</span>
                            {page.status === 'beta' ? (
                              <span className='tw-text-[10px] tw-bg-blue-600 tw-rounded-full tw-px-2'>
                                베타
                              </span>
                            ) : null}
                          </span>
                        ) : (
                          <div className='tw-invisible group-hover:tw-visible tw-absolute tw-left-12 tw-bg-gray-800 tw-text-white tw-px-2 tw-py-1 tw-rounded tw-whitespace-nowrap tw-text-sm tw-z-50'>
                            {page.name.base}
                            {page.status === 'beta' && (
                              <span className='tw-ml-1 tw-text-[10px] tw-bg-blue-600 tw-rounded-full tw-px-2'>
                                베타
                              </span>
                            )}
                          </div>
                        )}
                      </Link>
                    </OverlayTrigger>
                  ) : (
                    <OverlayTrigger
                      key={page.id + 'isOpenBrowser'}
                      placement='right'
                      overlay={
                        <Tooltip id={`tooltip-${page.id}`} className='tw-text-xs'>
                          {page.description}
                        </Tooltip>
                      }
                    >
                      <button
                        key={page.id}
                        onClick={() => window.ipc.send('openBrowser', page.link)}
                        className={`tw-text-sm tw-text-gray-400 tw-font-light tw-flex tw-items-center tw-gap-2 btn-sidebar tw-rounded group relative ${
                          isMiniMode
                            ? 'tw-my-1.5'
                            : 'tw-py-1.5 tw-px-1 hover:tw-bg-gray-700 hover:tw-bg-opacity-30'
                        } ${selectedGame === 'projectRa' ? 'tw-mr-2' : ''} `}
                      >
                        <div
                          className={`${isMiniMode ? 'tw-bg-gray-700 tw-bg-opacity-30 tw-p-2 tw-rounded-md' : ''}`}
                        >
                          {React.createElement(page.icon, { size: isMiniMode ? 16 : 14 })}
                        </div>
                        {!isMiniMode ? (
                          <span className='tw-flex tw-items-center flex-equal'>
                            {page.name.startWithSup ? (
                              <sup className='tw-text-[10px]'>{page.name.startWithSup}</sup>
                            ) : null}
                            <span className='tw-me-auto'>{page.name.base}</span>
                            {page.status === 'beta' ? (
                              <span className='tw-text-[10px] tw-bg-blue-600 tw-rounded-full tw-px-2'>
                                베타
                              </span>
                            ) : null}
                          </span>
                        ) : (
                          <div className='tw-invisible group-hover:tw-visible tw-absolute tw-left-12 tw-bg-gray-800 tw-text-white tw-px-2 tw-py-1 tw-rounded tw-whitespace-nowrap tw-text-sm tw-z-50'>
                            {page.name.base}
                            {page.status === 'beta' && (
                              <span className='tw-ml-1 tw-text-[10px] tw-bg-blue-600 tw-rounded-full tw-px-2'>
                                베타
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    </OverlayTrigger>
                  )
                ) : page.isDisplay && page.status === 'dev' ? (
                  <OverlayTrigger
                    placement='right'
                    overlay={
                      <Tooltip id={`tooltip-${page.id}`} className='tw-text-xs'>
                        {page.description}
                      </Tooltip>
                    }
                  >
                    <button
                      key={page.id}
                      className={`tw-text-sm tw-overflow-hidden tw-text-gray-400 tw-font-light tw-flex tw-items-center tw-gap-2 btn-sidebar tw-rounded group relative ${
                        isMiniMode
                          ? 'tw-my-1.5'
                          : 'tw-py-1.5 tw-px-1 hover:tw-bg-gray-700 hover:tw-bg-opacity-30'
                      } `}
                    >
                      <div
                        className={`${isMiniMode ? 'tw-bg-gray-700 tw-bg-opacity-30 tw-p-2 tw-rounded-md' : ''}`}
                      >
                        {React.createElement(page.icon, { size: isMiniMode ? 16 : 14 })}
                      </div>
                      {!isMiniMode && (
                        <span className='tw-flex tw-items-center flex-equal'>
                          {page.name.startWithSup ? (
                            <sup className='tw-text-[10px]'>{page.name.startWithSup}</sup>
                          ) : null}
                          <span className='tw-me-auto'>{page.name.base}</span>
                          <span className='tw-text-sm tw-bg-gray-600 tw-rounded-full tw-px-2'>
                            공사중
                          </span>
                        </span>
                      )}
                    </button>
                  </OverlayTrigger>
                ) : null,
              )}
            </div>
          </div>
        )
      }
      return null
    })
  }
  return null
}
