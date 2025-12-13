
'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export const AuthButton = () => {
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            setLoading(false)
        }
        getUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.refresh()
    }

    if (loading) return null

    return (
        <div className="fixed top-4 right-36 z-50 flex items-center gap-3">
            {user ? (
                <div className="flex items-center gap-3 bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-full pl-4 pr-2 py-1 shadow-lg">
                    <div className="flex flex-col items-end hidden md:flex">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wide">Welcome</span>
                        <span className="text-xs font-bold text-blue-400 max-w-[100px] truncate">
                            {user.user_metadata?.full_name || user.email?.split('@')[0]}
                        </span>
                    </div>

                    {/* Admin Button (Only for smartkdy7@gmail.com) */}
                    {user.email === 'smartkdy7@gmail.com' && (
                        <Link
                            href="/admin"
                            className="p-2 text-red-400 hover:text-red-300 transition-colors hover:bg-white/10 rounded-full mr-1"
                            title="Admin Dashboard"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </Link>
                    )}

                    <Link
                        href="/portfolio"
                        className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs ring-2 ring-transparent hover:ring-blue-400 transition-all shadow-md group relative"
                        title="My Portfolio"
                    >
                        {user.email?.[0].toUpperCase()}
                        <div className="absolute inset-0 rounded-full border border-white/20"></div>
                    </Link>

                    <div className="h-4 w-px bg-gray-700 mx-1"></div>

                    <button
                        onClick={handleLogout}
                        className="p-2 text-gray-400 hover:text-white transition-colors hover:bg-white/10 rounded-full"
                        title="Logout"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            ) : (
                <Link
                    href="/auth/login"
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 border border-blue-500/30 rounded-full text-white font-bold shadow-lg hover:shadow-blue-500/25 transition-all flex items-center gap-2 group text-sm"
                >
                    <span>Login</span>
                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                </Link>
            )}
        </div>
    )
}
