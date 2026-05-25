'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import { encryptMemo } from '@/lib/crypto/memo-encryption'
import { createClient } from '@/lib/supabase/client'

interface MemoCreateModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    userId: string
    t: {
        newMemo: string
        memoTitle: string
        memoContent: string
        password: string
        confirmPassword: string
        passwordMismatch: string
        passwordRequired: string
        warning: string
        save: string
        cancel: string
        saving: string
        titlePlaceholder: string
        contentPlaceholder: string
    }
}

export function MemoCreateModal({ isOpen, onClose, onSuccess, userId, t }: MemoCreateModalProps) {
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!password) {
            setError(t.passwordRequired)
            return
        }

        if (password !== confirmPassword) {
            setError(t.passwordMismatch)
            return
        }

        setIsLoading(true)

        try {
            const encrypted = await encryptMemo(content, password)

            const { error: dbError } = await supabase.from('secure_memos').insert({
                user_id: userId,
                title: title,
                encrypted_content: encrypted.encryptedContent,
                salt: encrypted.salt,
                iv: encrypted.iv,
            })

            if (dbError) throw dbError

            setTitle('')
            setContent('')
            setPassword('')
            setConfirmPassword('')
            onSuccess()
            onClose()
        } catch (err: unknown) {
            setError((err as Error).message || 'Failed to save memo')
        } finally {
            setIsLoading(false)
        }
    }

    const handleClose = () => {
        setTitle('')
        setContent('')
        setPassword('')
        setConfirmPassword('')
        setError('')
        onClose()
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-popover border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto"
                >
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 text-on-surface-variant hover:text-foreground transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <h2 className="text-xl font-bold text-foreground mb-6">{t.newMemo}</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Title */}
                        <div>
                            <label className="block text-xs text-on-surface-variant mb-1">{t.memoTitle}</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-indigo-500"
                                placeholder={t.titlePlaceholder}
                                required
                            />
                        </div>

                        {/* Content */}
                        <div>
                            <label className="block text-xs text-on-surface-variant mb-1">{t.memoContent}</label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-indigo-500 min-h-[150px] resize-none"
                                placeholder={t.contentPlaceholder}
                                required
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs text-on-surface-variant mb-1">{t.password}</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-indigo-500"
                                required
                            />
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-xs text-on-surface-variant mb-1">{t.confirmPassword}</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-indigo-500"
                                required
                            />
                        </div>

                        {/* Warning */}
                        <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-yellow-400">{t.warning}</p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                                <p className="text-sm text-red-400">{error}</p>
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 py-3 bg-muted hover:bg-muted/70 rounded-lg text-foreground font-medium transition-all"
                            >
                                {t.cancel}
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-white font-bold hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? t.saving : t.save}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
