'use client'

import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'

type AccountMenuProps = {
    user: User
    onLogout: () => void
}

/** 관리자 권한 조건 — 기존 하드코딩 유지(권한 체계 변경은 범위 밖) */
const ADMIN_EMAIL = 'smartkdy7@gmail.com'

type MenuLink = {
    href: string
    label: string
    icon: React.ReactNode
    /** 관리자 등 강조 톤 */
    tone?: 'admin'
}

export const AccountMenu = ({ user, onLogout }: AccountMenuProps) => {
    const [isOpen, setIsOpen] = useState(false)
    /** roving tabindex / 키보드 포커스 대상 인덱스 (-1 = 비활성) */
    const [activeIndex, setActiveIndex] = useState(-1)

    const containerRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const itemRefs = useRef<Array<HTMLAnchorElement | HTMLButtonElement | null>>([])
    const menuId = useId()

    const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
    const initial = (user.email?.[0] ?? '?').toUpperCase()
    const isAdmin = user.email === ADMIN_EMAIL

    const links = useMemo<MenuLink[]>(() => {
        const items: MenuLink[] = [
            {
                href: '/portfolio',
                label: '내 포트폴리오',
                icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13.5l4.5-4.5 3 3 6-6M21 6v4m0-4h-4" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19h16" />
                    </svg>
                ),
            },
            {
                href: '/watchlist',
                label: '관심종목',
                icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                ),
            },
            {
                href: '/settings',
                label: '설정',
                icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                ),
            },
        ]
        if (isAdmin) {
            items.push({
                href: '/admin',
                label: '관리자',
                tone: 'admin',
                icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                ),
            })
        }
        return items
    }, [isAdmin])

    /** 링크 항목 + 로그아웃(맨 끝) 합산 개수 — roving 순회용 */
    const itemCount = links.length + 1
    const logoutIndex = links.length

    // 바깥 클릭 닫기 (열렸을 때만 리스너 등록)
    useEffect(() => {
        if (!isOpen) return
        const handlePointerDown = (e: PointerEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false)
                setActiveIndex(-1)
            }
        }
        document.addEventListener('pointerdown', handlePointerDown)
        return () => document.removeEventListener('pointerdown', handlePointerDown)
    }, [isOpen])

    // 키보드로 연 경우 해당 항목으로 포커스 이동
    useEffect(() => {
        if (isOpen && activeIndex >= 0) {
            itemRefs.current[activeIndex]?.focus()
        }
    }, [isOpen, activeIndex])

    const closeMenu = (focusTrigger = true) => {
        setIsOpen(false)
        setActiveIndex(-1)
        if (focusTrigger) triggerRef.current?.focus()
    }

    const handleTriggerClick = () => {
        setIsOpen((prev) => !prev)
        // 마우스 토글 시에는 포커스를 항목으로 옮기지 않음
        setActiveIndex(-1)
    }

    const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setIsOpen(true)
            setActiveIndex(0)
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setIsOpen(true)
            setActiveIndex(itemCount - 1)
        }
    }

    const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        switch (e.key) {
            case 'Escape':
                e.preventDefault()
                closeMenu()
                break
            case 'ArrowDown':
                e.preventDefault()
                setActiveIndex((i) => (i + 1) % itemCount)
                break
            case 'ArrowUp':
                e.preventDefault()
                setActiveIndex((i) => (i - 1 + itemCount) % itemCount)
                break
            case 'Home':
                e.preventDefault()
                setActiveIndex(0)
                break
            case 'End':
                e.preventDefault()
                setActiveIndex(itemCount - 1)
                break
            case 'Tab':
                // 메뉴 밖으로 탭 이동 시 닫기 (포커스는 자연 흐름 유지)
                setIsOpen(false)
                setActiveIndex(-1)
                break
            default:
                break
        }
    }

    return (
        <div className="relative" ref={containerRef}>
            <button
                ref={triggerRef}
                type="button"
                onClick={handleTriggerClick}
                onKeyDown={handleTriggerKeyDown}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                aria-controls={menuId}
                title="계정 메뉴"
                className="flex items-center gap-2 bg-surface-container backdrop-blur-md border border-outline-variant rounded-full pl-1.5 pr-2.5 py-1 shadow-lg hover:bg-surface-container-high transition-colors"
            >
                <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs ring-2 ring-transparent shadow-md relative">
                    {initial}
                    <span className="absolute inset-0 rounded-full border border-white/20" aria-hidden="true"></span>
                </span>
                <span className="hidden md:block text-xs font-bold text-on-surface max-w-[100px] truncate">
                    {displayName}
                </span>
                <svg
                    className={`w-4 h-4 text-on-surface-variant transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div
                    id={menuId}
                    role="menu"
                    aria-label="계정 메뉴"
                    onKeyDown={handleMenuKeyDown}
                    className="absolute right-0 top-full mt-2 w-60 bg-surface-container border border-outline-variant rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                >
                    {/* 헤더: 이름 + 이메일 */}
                    <div className="px-4 py-3 border-b border-outline-variant">
                        <p className="text-sm font-bold text-on-surface truncate">{displayName}</p>
                        <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
                    </div>

                    <nav className="py-1">
                        {links.map((item, i) => (
                            <Link
                                key={item.href}
                                ref={(el) => {
                                    itemRefs.current[i] = el
                                }}
                                href={item.href}
                                role="menuitem"
                                tabIndex={activeIndex === i ? 0 : -1}
                                onClick={() => closeMenu(false)}
                                className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-surface-container-high focus:bg-surface-container-high focus:outline-none ${
                                    item.tone === 'admin'
                                        ? 'text-red-500 hover:text-red-600'
                                        : 'text-on-surface'
                                }`}
                            >
                                <span className={item.tone === 'admin' ? 'text-red-500' : 'text-on-surface-variant'}>
                                    {item.icon}
                                </span>
                                <span className="truncate">{item.label}</span>
                            </Link>
                        ))}

                        <div role="separator" className="my-1 h-px bg-outline-variant" />

                        <button
                            ref={(el) => {
                                itemRefs.current[logoutIndex] = el
                            }}
                            type="button"
                            role="menuitem"
                            tabIndex={activeIndex === logoutIndex ? 0 : -1}
                            onClick={() => {
                                closeMenu(false)
                                onLogout()
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors hover:bg-surface-container-high focus:bg-surface-container-high focus:outline-none"
                        >
                            <span className="text-on-surface-variant">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </span>
                            <span>로그아웃</span>
                        </button>
                    </nav>
                </div>
            )}
        </div>
    )
}
