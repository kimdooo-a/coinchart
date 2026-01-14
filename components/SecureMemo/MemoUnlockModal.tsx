'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, X } from 'lucide-react'
import { decryptMemo } from '@/lib/crypto/memo-encryption'

interface SecureMemo {
    id: string
    title: string
    encrypted_content: string
    salt: string
    iv: string
    created_at: string
    updated_at: string
}

interface MemoUnlockModalProps {
    isOpen: boolean
    memo: SecureMemo | null
    onClose: () => void
    onUnlock: (memo: SecureMemo, content: string) => void
    t: {
        enterPassword: string
        password: string
        unlock: string
        cancel: string
        decryptionFailed: string
        unlocking: string
    }
}

export function MemoUnlockModal({ isOpen, memo, onClose, onUnlock, t }: MemoUnlockModalProps) {
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!memo) return

        setError('')
        setIsLoading(true)

        try {
            const decrypted = await decryptMemo(
                memo.encrypted_content,
                memo.salt,
                memo.iv,
                password
            )

            setPassword('')
            onUnlock(memo, decrypted.content)
        } catch (err: any) {
            if (err.message === 'DECRYPTION_FAILED') {
                setError(t.decryptionFailed)
            } else {
                setError(err.message || 'Decryption failed')
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleClose = () => {
        setPassword('')
        setError('')
        onClose()
    }

    if (!isOpen || !memo) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#111] border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
                >
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg">
                            <Lock className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{memo.title}</h2>
                            <p className="text-sm text-gray-400">{t.enterPassword}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Password */}
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">{t.password}</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                                autoFocus
                                required
                            />
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
                                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 font-medium transition-all"
                            >
                                {t.cancel}
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-white font-bold hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? t.unlocking : t.unlock}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
