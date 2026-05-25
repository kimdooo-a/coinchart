'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { useLanguage } from '@/context/LanguageContext'
import { TRANSLATIONS } from '@/lib/translations'
import { Lock, Plus, ShieldCheck } from 'lucide-react'
import { MemoCard } from '@/components/SecureMemo/MemoCard'
import { MemoCreateModal } from '@/components/SecureMemo/MemoCreateModal'
import { MemoUnlockModal } from '@/components/SecureMemo/MemoUnlockModal'
import { MemoViewModal } from '@/components/SecureMemo/MemoViewModal'

interface SecureMemo {
    id: string
    title: string
    encrypted_content: string
    salt: string
    iv: string
    created_at: string
    updated_at: string
}

export default function SecureMemoPage() {
    const { lang } = useLanguage()
    const t = TRANSLATIONS[lang]

    const [user, setUser] = useState<any>(null)
    const [memos, setMemos] = useState<SecureMemo[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [unlockingMemo, setUnlockingMemo] = useState<SecureMemo | null>(null)
    const [viewingMemo, setViewingMemo] = useState<{ memo: SecureMemo; content: string } | null>(null)

    const supabase = createClient()

    useEffect(() => {
        const initData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            if (user) {
                await fetchMemos(user.id)
            }
        }
        initData()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })
        return () => subscription.unsubscribe()
    }, [])

    const fetchMemos = async (userId: string) => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('secure_memos')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })

        if (!error && data) {
            setMemos(data)
        }
        setIsLoading(false)
    }

    const handleDelete = async (memoId: string) => {
        if (!confirm(t.secureMemo.deleteConfirm)) return

        const { error } = await supabase
            .from('secure_memos')
            .delete()
            .eq('id', memoId)

        if (!error) {
            setMemos(memos.filter(m => m.id !== memoId))
            setViewingMemo(null)
        }
    }

    const handleMemoCreated = () => {
        if (user) fetchMemos(user.id)
    }

    const handleUnlockSuccess = (memo: SecureMemo, content: string) => {
        setUnlockingMemo(null)
        setViewingMemo({ memo, content })
    }

    return (
        <div className="min-h-screen bg-background text-foreground relative overflow-hidden pt-[120px] md:pt-[140px]">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                            <ShieldCheck className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                                {t.secureMemo.title}
                            </h1>
                            <p className="text-on-surface-variant mt-1">{t.secureMemo.subtitle}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-full transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        {t.secureMemo.newMemo}
                    </button>
                </div>

                {/* Warning Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-start gap-3"
                >
                    <Lock className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-400">{t.secureMemo.warning}</p>
                </motion.div>

                {/* Memos Grid */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-pulse text-on-surface-variant">{t.common.loading}</div>
                    </div>
                ) : memos.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-20 text-center"
                    >
                        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                            <Lock className="w-10 h-10 text-on-surface-variant" />
                        </div>
                        <p className="text-on-surface-variant text-lg">{t.secureMemo.noMemos}</p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-full transition-all"
                        >
                            {t.secureMemo.newMemo}
                        </button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {memos.map((memo, index) => (
                            <motion.div
                                key={memo.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <MemoCard
                                    memo={memo}
                                    onClick={() => setUnlockingMemo(memo)}
                                    onDelete={() => handleDelete(memo.id)}
                                    t={{
                                        locked: t.secureMemo.locked,
                                        createdAt: t.secureMemo.createdAt,
                                        updatedAt: t.secureMemo.updatedAt,
                                        delete: t.secureMemo.delete,
                                    }}
                                />
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            <MemoCreateModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleMemoCreated}
                userId={user?.id}
                t={{
                    newMemo: t.secureMemo.newMemo,
                    memoTitle: t.secureMemo.memoTitle,
                    memoContent: t.secureMemo.memoContent,
                    password: t.secureMemo.password,
                    confirmPassword: t.secureMemo.confirmPassword,
                    passwordMismatch: t.secureMemo.passwordMismatch,
                    passwordRequired: t.secureMemo.passwordRequired,
                    warning: t.secureMemo.warning,
                    save: t.secureMemo.save,
                    cancel: t.secureMemo.cancel,
                    saving: t.secureMemo.saving,
                    titlePlaceholder: t.secureMemo.titlePlaceholder,
                    contentPlaceholder: t.secureMemo.contentPlaceholder,
                }}
            />

            <MemoUnlockModal
                isOpen={!!unlockingMemo}
                memo={unlockingMemo}
                onClose={() => setUnlockingMemo(null)}
                onUnlock={handleUnlockSuccess}
                t={{
                    enterPassword: t.secureMemo.enterPassword,
                    password: t.secureMemo.password,
                    unlock: t.secureMemo.unlock,
                    cancel: t.secureMemo.cancel,
                    decryptionFailed: t.secureMemo.decryptionFailed,
                    unlocking: t.secureMemo.unlocking,
                }}
            />

            <MemoViewModal
                isOpen={!!viewingMemo}
                memo={viewingMemo?.memo ?? null}
                decryptedContent={viewingMemo?.content ?? ''}
                onClose={() => setViewingMemo(null)}
                onDelete={() => {
                    if (viewingMemo) {
                        handleDelete(viewingMemo.memo.id)
                    }
                }}
                onUpdate={handleMemoCreated}
                t={{
                    memoTitle: t.secureMemo.memoTitle,
                    memoContent: t.secureMemo.memoContent,
                    password: t.secureMemo.password,
                    confirmPassword: t.secureMemo.confirmPassword,
                    passwordMismatch: t.secureMemo.passwordMismatch,
                    passwordRequired: t.secureMemo.passwordRequired,
                    warning: t.secureMemo.warning,
                    save: t.secureMemo.save,
                    cancel: t.secureMemo.cancel,
                    close: t.secureMemo.close,
                    edit: t.secureMemo.edit,
                    delete: t.secureMemo.delete,
                    saving: t.secureMemo.saving,
                    deleteConfirm: t.secureMemo.deleteConfirm,
                }}
            />
        </div>
    )
}
