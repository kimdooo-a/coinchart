'use client'

import { Lock, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface SecureMemo {
    id: string
    title: string
    encrypted_content: string
    salt: string
    iv: string
    created_at: string
    updated_at: string
}

interface MemoCardProps {
    memo: SecureMemo
    onClick: () => void
    onDelete: () => void
    t: {
        locked: string
        createdAt: string
        updatedAt: string
        delete: string
    }
}

export function MemoCard({ memo, onClick, onDelete, t }: MemoCardProps) {
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group bg-card/30 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl hover:border-indigo-500/30 transition-all cursor-pointer"
            onClick={onClick}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 flex-shrink-0">
                        <Lock className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-foreground truncate">
                            {memo.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full border border-yellow-500/20">
                                {t.locked}
                            </span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onDelete()
                    }}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title={t.delete}
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex justify-between text-xs text-muted-foreground">
                <span>{t.createdAt}: {formatDate(memo.created_at)}</span>
                <span>{t.updatedAt}: {formatDate(memo.updated_at)}</span>
            </div>
        </motion.div>
    )
}
