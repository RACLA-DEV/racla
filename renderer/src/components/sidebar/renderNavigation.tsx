// renderNavigation.tsx
import Link from 'next/link'
import { useRouter } from 'next/router'
import React from 'react'
import * as R from 'ramda'
import { globalDictionary } from '@/libs/server/globalDictionary'

export const renderNavigation = (selectedGame: string, router: any) => {
  if (selectedGame && selectedGame !== '') {
    return R.keys(globalDictionary.navDictionary[selectedGame]).map((value) => {
      const navItem = globalDictionary.navDictionary[selectedGame][value]
      if (navItem.isDisplay) {
        return (
          <div key={navItem.id + 'Main'} className="tw-flex tw-flex-col tw-animate-fadeInLeft">
            <span key={navItem.id + 'Head'} className="tw-font-semibold tw-text-xs tw-mb-4">
              {navItem.name}
            </span>
            <div key={navItem.id + 'Body'} className="tw-flex tw-flex-col tw-gap-1 tw-mb-4">
              {navItem.pages.map((page) =>
                page.isDisplay && ['stable', 'beta'].includes(page.status) ? (
                  !page.isOpenBrowser ? (
                    // 클라이언트 내 이동
                    <Link
                      key={page.id}
                      href={navItem.link + page.link}
                      className={`tw-text-sm tw-text-gray-400 tw-font-light tw-flex tw-items-center tw-gap-2 btn-sidebar ${
                        router.pathname.includes(navItem.link + '/' + String(String(page.link).split('/')[1])) ? 'active' : ''
                      }`}
                    >
                      {React.createElement(page.icon)}
                      <span className="tw-flex tw-items-center flex-equal">
                        {page.name.startWithSup ? <sup>{page.name.startWithSup}</sup> : null}
                        <span className="tw-me-auto">{page.name.base}</span>
                        {page.status === 'beta' ? (
                          <span className="tw-text-xs tw-bg-blue-600 tw-rounded-full tw-px-2" style={{ padding: '2px 8px' }}>
                            베타
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  ) : (
                    // 외부 브라우저 오픈
                    <button
                      key={page.id}
                      onClick={() => window.ipc.send('openBrowser', page.link)}
                      className={`tw-text-sm tw-text-gray-400 tw-font-light tw-flex tw-items-center tw-gap-2 btn-sidebar`}
                    >
                      {React.createElement(page.icon)}
                      <span>
                        {page.name.startWithSup ? <sup>{page.name.startWithSup}</sup> : null}
                        {page.name.base}
                      </span>
                    </button>
                  )
                ) : page.isDisplay && page.status === 'dev' ? (
                  <button key={page.id} className={`tw-text-sm tw-text-gray-400 tw-font-light tw-flex tw-items-center tw-gap-2 btn-sidebar`}>
                    {React.createElement(page.icon)}
                    <span className="tw-flex tw-items-center flex-equal">
                      {page.name.startWithSup ? <sup>{page.name.startWithSup}</sup> : null}
                      <span className="tw-me-auto">{page.name.base}</span>
                      <span className="tw-text-xs tw-bg-gray-600 tw-rounded-full tw-px-2" style={{ padding: '2px 8px' }}>
                        공사중
                      </span>
                    </span>
                  </button>
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
