'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function AuthErrorPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md rounded-2xl bg-[#111] p-8 text-center shadow-xl border border-red-900/30"
            >
                <div className="mb-6 flex justify-center">
                    <div className="rounded-full bg-red-900/20 p-4">
                        <svg
                            className="h-8 w-8 text-red-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                </div>

                <h1 className="mb-2 text-2xl font-bold text-white">
                    Authentication Error
                </h1>

                <p className="mb-8 text-gray-400">
                    There was a problem signing you in. Please try again or contact support if the problem persists.
                </p>

                <div className="flex flex-col gap-3">
                    <Link
                        href="/auth/login"
                        className="w-full rounded-lg bg-white px-6 py-3 font-medium text-black transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Try Again
                    </Link>
                    <Link
                        href="/"
                        className="w-full rounded-lg px-6 py-3 font-medium text-gray-400 hover:text-white transition-colors"
                    >
                        Go Home
                    </Link>
                </div>
            </motion.div>
        </div>
    )
}
