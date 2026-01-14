'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Edit2, Trash2, Save, AlertTriangle } from 'lucide-react'
import { encryptMemo } from '@/lib/crypto/memo-encryption'
import { createClient } from '@/lib/supabase/client'

interface SecureMemo {
    id: string
    title: string
    encrypted_content: string
    salt: string
    iv: string
    created_at: string
    updated_at: string
}

interface MemoViewModalProps {
    isOpen: boolean
    memo: SecureMemo | null
    decryptedContent: string
    onClose: () => void
    onDelete: () => void
    onUpdate: () => void
    t: {
        memoTitle: string
        memoContent: string
        password: string
        confirmPassword: string
        passwordMismatch: string
        passwordRequired: string
        warning: string
        save: string
        cancel: string
        close: string
        edit: string
        delete: string
        saving: string
        deleteConfirm: string
    }
}

export function MemoViewModal({ isOpen, memo, decryptedContent, onClose, onDelete, onUpdate, t }: MemoViewModalProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        if (memo && decryptedContent) {
            setTitle(memo.title)
            setContent(decryptedContent)
        }
    }, [memo, decryptedContent])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!memo) return

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

            const { error: dbError } = await supabase
                .from('secure_memos')
                .update({
                    title: title,
                    encrypted_content: encrypted.encryptedContent,
                    salt: encrypted.salt,
                    iv: encrypted.iv,
                    updated_at: new Date().toISOString()
                })
                .eq('id', memo.id)

            if (dbError) throw dbError

            setPassword('')
            setConfirmPassword('')
            setIsEditing(false)
            onUpdate()
            onClose()
        } catch (err: any) {
            setError(err.message || 'Failed to save memo')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = () => {
        if (confirm(t.deleteConfirm)) {
            onDelete()
        }
    }

    const handleClose = () => {
        setIsEditing(false)
        setPassword('')
        setConfirmPassword('')
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
                    className="bg-[#111] border border-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto"
                >
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {!isEditing ? (
                        /* View Mode */
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white">{memo.title}</h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                                        title={t.edit}
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                        title={t.delete}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 min-h-[200px]">
                                <pre className="text-gray-200 whitespace-pre-wrap font-sans text-sm leading-relaxed">
                                    {decryptedContent}
                                </pre>
                            </div>

                            <button
                                onClick={handleClose}
                                className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 font-medium transition-all"
                            >
                                {t.close}
                            </button>
                        </div>
                    ) : (
                        /* Edit Mode */
                        <form onSubmit={handleSave} className="space-y-4">
                            <h2 className="text-xl font-bold text-white">{t.edit}</h2>

                            {/* Title */}
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">{t.memoTitle}</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                                    required
                                />
                            </div>

                            {/* Content */}
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">{t.memoContent}</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 min-h-[150px] resize-none"
                                    required
                                />
                            </div>

                            {/* New Password */}
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">{t.password}</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                                    required
                                />
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">{t.confirmPassword}</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
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
                                    onClick={() => {
                                        setIsEditing(false)
                                        setPassword('')
                                        setConfirmPassword('')
                                        setError('')
                                        setTitle(memo.title)
                                        setContent(decryptedContent)
                                    }}
                                    className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 font-medium transition-all"
                                >
                                    {t.cancel}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-white font-bold hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    {isLoading ? t.saving : t.save}
                                </button>
                            </div>
                        </form>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
