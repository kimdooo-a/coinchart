
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

import { useLanguage } from '@/context/LanguageContext';
import { TRANSLATIONS } from '@/lib/translations';

interface AdminUser {
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at: string | null;
}

export default function AdminPage() {
    const { lang } = useLanguage();
    const t = TRANSLATIONS[lang];

    // Auth Check
    const [checking, setChecking] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    // Data State
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [crawlResult, setCrawlResult] = useState<string | null>(null);
    const [marketResult, setMarketResult] = useState<string | null>(null);
    const [cleanupResult, setCleanupResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const verifyAdmin = async () => {
            // Need to import createClient dynamically or use the one from props context if available
            // For simplicity in this file:
            const { createClient } = await import('@/lib/supabase/client');
            const supabase = createClient();

            const { data: { user } } = await supabase.auth.getUser();

            if (user && user.email === 'smartkdy7@gmail.com') {
                setAuthorized(true);
                fetchUsers();
            } else {
                setAuthorized(false);
            }
            setChecking(false);
        };

        verifyAdmin();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            if (data.users) setUsers(data.users);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const deleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            const res = await fetch('/api/admin/users', {
                method: 'DELETE',
                body: JSON.stringify({ userId })
            });
            if (res.ok) {
                alert('User Deleted');
                fetchUsers();
            } else {
                alert('Failed to delete');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const triggerNewsCrawl = async () => {
        setLoading(true);
        setCrawlResult(t.admin.processing);
        try {
            // Call the REAL crawler
            const res = await fetch(`/api/admin/news-crawl?lang=${lang}`);
            const data = await res.json();

            setCrawlResult(JSON.stringify(data, null, 2));

            // Refresh the displayed news if needed, but for now just showing report
        } catch (e) {
            setCrawlResult('Error: ' + String(e));
        } finally {
            setLoading(false);
        }
    };

    const updateMarketPrices = async () => {
        setLoading(true);
        setMarketResult(t.admin.processing);
        try {
            const res = await fetch('/api/admin/market-data');
            const data = await res.json();
            setMarketResult(JSON.stringify(data, null, 2));
        } catch (e) {
            setMarketResult('Error: ' + String(e));
        } finally {
            setLoading(false);
        }
    };

    const cleanupData = async () => {
        if (!confirm(t.admin.confirmCleanup)) return;
        setLoading(true);
        setCleanupResult(t.admin.processing);
        try {
            const res = await fetch('/api/admin/cleanup-data', {
                method: 'POST',
                body: JSON.stringify({ limit: 2000, target: 'all' })
            });
            const data = await res.json();
            setCleanupResult(JSON.stringify(data, null, 2));
        } catch (e) {
            setCleanupResult('Error: ' + String(e));
        } finally {
            setLoading(false);
        }
    };

    if (checking) {
        return (
            <div className="min-h-screen bg-background text-foreground flex justify-center items-center relative overflow-hidden">
                <div className="fixed inset-0 z-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[120px]" />
                </div>
                <div className="relative z-10 flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-on-surface-variant font-medium">{t.admin.checking}</p>
                </div>
            </div>
        );
    }

    if (!authorized) {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 relative overflow-hidden">
                <div className="fixed inset-0 z-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-500/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/10 rounded-full blur-[120px]" />
                </div>
                <div className="relative z-10 bg-surface-container border border-outline-variant p-8 rounded-3xl shadow-xl text-center max-w-md w-full">
                    <h1 className="text-3xl font-black mb-4 text-red-500">{t.admin.accessDenied}</h1>
                    <p className="text-on-surface-variant mb-8">{t.admin.accessDeniedMsg}</p>
                    <Link href="/" className="px-8 py-3 bg-surface-container-high hover:bg-surface-container-highest rounded-full font-bold transition-all text-on-surface inline-block">
                        {t.common.back}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-8 relative overflow-hidden pt-[120px] md:pt-[140px]">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/10 rounded-full blur-[120px]" />
            </div>

            <header className="relative z-10 max-w-5xl mx-auto flex items-center gap-4 mb-10 border-b border-outline-variant pb-6">
                <Link
                    href="/"
                    className="text-2xl font-black bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity flex items-center gap-2"
                >
                    ← {t.admin.title}
                </Link>
            </header>

            <div className="relative z-10 max-w-5xl mx-auto space-y-12">

                {/* 블로그 관리 바로가기 */}
                <section className="bg-surface-container border border-outline-variant p-8 rounded-3xl shadow-xl">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-foreground">
                        {lang === 'ko' ? '블로그 관리' : 'Blog Management'}
                    </h2>
                    <p className="text-on-surface-variant mb-6 text-sm">
                        {lang === 'ko' ? '블로그 글 작성, 수정, 삭제를 관리합니다.' : 'Manage blog posts: create, edit, and delete.'}
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <Link
                            href="/admin/blog"
                            className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-purple-900/20 text-white"
                        >
                            {lang === 'ko' ? '글 목록 관리' : 'Manage Posts'}
                        </Link>
                        <Link
                            href="/admin/blog/new"
                            className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-900/20 text-white"
                        >
                            {lang === 'ko' ? '새 글 작성' : 'Write New Post'}
                        </Link>
                        <Link
                            href="/blog"
                            className="bg-surface-container-high hover:bg-surface-container-highest px-6 py-3 rounded-xl font-bold transition-all shadow-sm text-on-surface"
                        >
                            {lang === 'ko' ? '블로그 보기' : 'View Blog'}
                        </Link>
                    </div>
                </section>

                {/* 공지 게시판 관리 바로가기 (R3/T06) */}
                <section className="bg-surface-container border border-outline-variant p-8 rounded-3xl shadow-xl">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-foreground">
                        📌 {lang === 'ko' ? '공지 게시판 관리' : 'Notice Management'}
                    </h2>
                    <p className="text-on-surface-variant mb-6 text-sm">
                        {lang === 'ko' ? '게시판별 공지 작성 및 공지 등록/해제를 관리합니다.' : 'Create board notices and toggle notice status.'}
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <Link
                            href="/admin/board"
                            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 text-white"
                        >
                            {lang === 'ko' ? '공지 관리' : 'Manage Notices'}
                        </Link>
                    </div>
                </section>

                {/* News Control Section */}
                <section className="bg-surface-container border border-outline-variant p-8 rounded-3xl shadow-xl">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-foreground">
                        📰 {t.admin.newsControl}
                        {loading && <span className="text-xs text-yellow-500 animate-pulse font-mono bg-yellow-500/10 px-2 py-1 rounded">({t.admin.processing})</span>}
                    </h2>
                    <p className="text-on-surface-variant mb-6 text-sm">
                        {t.admin.newsDesc}
                    </p>

                    <div className="flex gap-4 items-start">
                        <button
                            onClick={triggerNewsCrawl}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-green-900/20 text-white"
                        >
                            {t.admin.triggerCrawler}
                        </button>

                        <div className="flex-1 bg-surface-container-high p-4 rounded-xl font-mono text-xs text-secondary overflow-x-auto h-32 border border-outline-variant custom-scrollbar">
                            {crawlResult || t.admin.status.ready}
                        </div>
                    </div>
                </section>

                {/* Market Data Control Section */}
                <section className="bg-surface-container border border-outline-variant p-8 rounded-3xl shadow-xl">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-foreground">
                        📈 {t.admin.marketControl}
                        {loading && <span className="text-xs text-yellow-500 animate-pulse font-mono bg-yellow-500/10 px-2 py-1 rounded">({t.admin.processing})</span>}
                    </h2>
                    <p className="text-on-surface-variant mb-6 text-sm">
                        {t.admin.marketDesc}
                    </p>

                    <div className="flex gap-4 items-start">
                        <button
                            onClick={updateMarketPrices}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 text-white"
                        >
                            {t.admin.updatePrices}
                        </button>

                        <div className="flex-1 bg-surface-container-high p-4 rounded-xl font-mono text-xs text-primary overflow-x-auto h-32 border border-outline-variant custom-scrollbar">
                            {marketResult || t.admin.status.ready}
                        </div>
                    </div>
                </section>


                {/* Data Cleanup Section */}
                <section className="bg-surface-container border border-outline-variant p-8 rounded-3xl shadow-xl">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-foreground">
                        🧹 {t.admin.dataCleanup}
                        {loading && <span className="text-xs text-yellow-500 animate-pulse font-mono bg-yellow-500/10 px-2 py-1 rounded">({t.admin.processing})</span>}
                    </h2>
                    <p className="text-on-surface-variant mb-6 text-sm">
                        {t.admin.cleanupDesc}
                    </p>

                    <div className="flex gap-4 items-start">
                        <button
                            onClick={cleanupData}
                            disabled={loading}
                            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-red-900/20 text-white"
                        >
                            {t.admin.startCleanup}
                        </button>

                        <div className="flex-1 bg-surface-container-high p-4 rounded-xl font-mono text-xs text-error overflow-x-auto h-32 border border-outline-variant custom-scrollbar">
                            {cleanupResult || t.admin.status.ready}
                        </div>
                    </div>
                </section>

                {/* User Management Section */}
                <section className="bg-surface-container border border-outline-variant p-8 rounded-3xl shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-foreground">👥 {t.admin.userManagement} ({users.length})</h2>
                        <button
                            onClick={fetchUsers}
                            className="text-sm bg-surface-container-high hover:bg-surface-container-highest px-4 py-2 rounded-lg font-bold transition-all border border-outline-variant text-on-surface"
                        >
                            {t.admin.refresh}
                        </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-outline-variant">
                        <table className="w-full text-left text-sm text-on-surface-variant">
                            <thead className="bg-surface-container-high text-on-surface uppercase font-bold text-xs">
                                <tr>
                                    <th className="p-4">{t.admin.table.email}</th>
                                    <th className="p-4">{t.admin.table.created}</th>
                                    <th className="p-4">{t.admin.table.lastSign}</th>
                                    <th className="p-4 text-right">{t.admin.table.action}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant bg-surface-container-lowest">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-on-surface-variant">{t.admin.table.noUsers}</td>
                                    </tr>
                                ) : (
                                    users.map((u) => (
                                        <tr key={u.id} className="hover:bg-surface-container transition-colors">
                                            <td className="p-4 text-on-surface font-medium">{u.email}</td>
                                            <td className="p-4 text-on-surface-variant">{new Date(u.created_at).toLocaleDateString()}</td>
                                            <td className="p-4 text-on-surface-variant">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : '-'}</td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => deleteUser(u.id)}
                                                    className="bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1.5 rounded-lg border border-red-500/30 transition-all text-xs font-bold"
                                                >
                                                    {t.admin.table.delete}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

            </div>
        </div>
    );
}
