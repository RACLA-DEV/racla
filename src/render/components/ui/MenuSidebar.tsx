import { Icon } from '@iconify/react'
import { globalDictionary } from '@render/constants/globalDictionary'
import { RootState } from '@render/store'
import { toggleSidebar } from '@render/store/slices/uiSlice'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

const MenuSidebar: React.FC = () => {
  const { theme, sidebarCollapsed, selectedGame } = useSelector((state: RootState) => state.ui)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // 사이드바 토글 핸들러
  const handleToggleSidebar = () => {
    dispatch(toggleSidebar())
  }

  // 현재 선택된 게임에 따른 메뉴 구성 가져오기
  const getMenuItems = () => {
    const getIcon = (iconComponent: any) => {
      // React 아이콘 컴포넌트를 Iconify 포맷으로 변환
      if (iconComponent && iconComponent.name) {
        switch (iconComponent.name) {
          case 'FaHouse':
            return 'lucide:home'
          case 'FaWindowMaximize':
            return 'lucide:maximize-2'
          case 'FaUpload':
            return 'lucide:upload'
          case 'FaList':
            return 'lucide:list'
          case 'FaCompactDisc':
            return 'lucide:disc'
          case 'FaDatabase':
            return 'lucide:database'
          case 'FaRankingStar':
            return 'lucide:bar-chart-2'
          case 'FaTrophy':
            return 'lucide:trophy'
          case 'FaKeyboard':
            return 'lucide:keyboard'
          case 'FaDice':
            return 'lucide:dices'
          case 'FaRobot':
            return 'lucide:bot'
          case 'FaWandMagicSparkles':
            return 'lucide:wand'
          default:
            return 'lucide:circle'
        }
      }
      return 'lucide:circle'
    }

    // 선택된 게임에 따른 메뉴 네비게이션 가져오기
    let navItems = []
    switch (selectedGame) {
      case 'djmax_respect_v':
        if (globalDictionary.navDictionary.djmax_respect_v) {
          // DJMAX RESPECT V 네비게이션
          Object.values(globalDictionary.navDictionary.djmax_respect_v).forEach((category) => {
            if (category.isDisplay) {
              // 카테고리 내 각 페이지를 메뉴 아이템으로 변환
              const menuItems = category.pages
                .filter((page) => page.isDisplay)
                .map((page) => ({
                  id: page.id,
                  label: typeof page.name === 'object' ? page.name.base : page.name,
                  icon: getIcon(page.icon),
                  path: page.link,
                  isExternal: page.isOpenBrowser,
                }))

              // 카테고리가 있는 경우 추가
              if (menuItems.length > 0) {
                navItems.push({
                  id: category.id,
                  label: category.name,
                  icon: 'lucide:folder',
                  path: category.link || '/',
                  subItems: menuItems,
                })
              }
            }
          })
        }
        break

      case 'wjmax':
        if (globalDictionary.navDictionary.wjmax) {
          // WJMAX 네비게이션
          Object.values(globalDictionary.navDictionary.wjmax).forEach((category) => {
            if (category.isDisplay) {
              const menuItems = category.pages
                .filter((page) => page.isDisplay)
                .map((page) => ({
                  id: page.id,
                  label: typeof page.name === 'object' ? page.name.base : page.name,
                  icon: getIcon(page.icon),
                  path: page.link,
                  isExternal: page.isOpenBrowser,
                }))

              if (menuItems.length > 0) {
                navItems.push({
                  id: category.id,
                  label: category.name,
                  icon: 'lucide:folder',
                  path: category.link || '/',
                  subItems: menuItems,
                })
              }
            }
          })
        }
        break

      case 'platina_lab':
        if (globalDictionary.navDictionary.platina_lab) {
          // PLATINA :: LAB 네비게이션
          Object.values(globalDictionary.navDictionary.platina_lab).forEach((category) => {
            if (category.isDisplay) {
              const menuItems = category.pages
                .filter((page) => page.isDisplay)
                .map((page) => ({
                  id: page.id,
                  label: typeof page.name === 'object' ? page.name.base : page.name,
                  icon: getIcon(page.icon),
                  path: page.link,
                  isExternal: page.isOpenBrowser,
                }))

              if (menuItems.length > 0) {
                navItems.push({
                  id: category.id,
                  label: category.name,
                  icon: 'lucide:folder',
                  path: category.link || '/',
                  subItems: menuItems,
                })
              }
            }
          })
        }
        break

      default:
        // 기본적으로 RACLA 메뉴 표시
        if (globalDictionary.navDictionary.projectRa) {
          Object.values(globalDictionary.navDictionary.projectRa).forEach((category) => {
            if (category.isDisplay) {
              const menuItems = category.pages
                .filter((page) => page.isDisplay)
                .map((page) => ({
                  id: page.id,
                  label: typeof page.name === 'object' ? page.name.base : page.name,
                  icon: getIcon(page.icon),
                  path: page.link,
                  isExternal: page.isOpenBrowser,
                }))

              if (menuItems.length > 0) {
                navItems.push({
                  id: category.id,
                  label: category.name,
                  icon: 'lucide:folder',
                  path: category.link || '/',
                  subItems: menuItems,
                })
              }
            }
          })
        }
    }
    return navItems
  }

  const menuItems = getMenuItems()

  // 항목 클릭 핸들러
  const handleItemClick = (item: any) => {
    if (item.isExternal && item.path) {
      // 외부 링크는 requestOpenExternalLink 사용하여 모달 확인 과정 거치도록 변경
      if (globalDictionary.requestOpenExternalLink) {
        globalDictionary.requestOpenExternalLink(item.path)
      }
    } else if (item.path) {
      // 내부 경로는 라우터로 이동
      navigate(item.path)
    }
  }

  return (
    <div
      className={`tw:flex tw:flex-col tw:h-full tw:transition-all tw:duration-300 tw:ease-in-out tw:relative tw:overflow-x-hidden ${
        sidebarCollapsed ? 'tw:w-0 tw:opacity-0 tw:overflow-hidden' : 'tw:w-64'
      } ${
        theme === 'dark'
          ? 'tw:bg-transparent tw:text-slate-200'
          : 'tw:bg-transparent tw:text-gray-800'
      }`}
    >
      <div className='tw:flex-1 tw:overflow-y-auto tw:overflow-x-hidden tw:py-2 tw:text-sm tw:custom-scrollbar tw:pr-2'>
        <ul className='tw:px-4 tw:space-y-2 tw:relative tw:z-20'>
          {menuItems.map((item) => (
            <li key={item.id}>
              {item.subItems ? (
                // 서브메뉴가 있는 경우 (카테고리)
                <div className='tw:mb-3'>
                  <div className='tw:flex tw:items-center tw:p-2 tw:mb-2'>
                    <Icon icon={item.icon} className='tw:w-4 tw:h-4 tw:mr-2 tw:text-indigo-500' />
                    <span className='tw:font-semibold tw:text-sm tw:uppercase tw:tracking-wider'>
                      {item.label}
                    </span>
                  </div>
                  <ul className='tw:pl-3 tw:space-y-1'>
                    {item.subItems.map((subItem) => (
                      <li key={subItem.id}>
                        <div
                          onClick={() => handleItemClick(subItem)}
                          className={`tw:flex tw:items-center tw:p-2 tw:rounded-md tw:cursor-pointer tw:transition-colors ${
                            theme === 'dark' ? 'tw:hover:bg-slate-700' : 'tw:hover:bg-indigo-50'
                          }`}
                        >
                          <Icon icon={subItem.icon} className='tw:w-4 tw:h-4 tw:mr-2' />
                          <span>{subItem.label}</span>
                          {subItem.isExternal && (
                            <Icon
                              icon='lucide:external-link'
                              className='tw:w-3.5 tw:h-3.5 tw:ml-auto tw:opacity-70'
                            />
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                // 서브메뉴가 없는 단일 메뉴 항목
                <div
                  onClick={() => handleItemClick(item)}
                  className={`tw:flex tw:items-center tw:p-2.5 tw:rounded-md tw:cursor-pointer tw:transition-colors ${
                    theme === 'dark' ? 'tw:hover:bg-slate-700' : 'tw:hover:bg-indigo-50'
                  }`}
                >
                  <Icon icon={item.icon} className='tw:w-5 tw:h-5 tw:mr-3' />
                  <span>{item.label}</span>
                  {item.isExternal && (
                    <Icon
                      icon='lucide:external-link'
                      className='tw:w-4 tw:h-4 tw:ml-auto tw:opacity-70'
                    />
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default MenuSidebar
