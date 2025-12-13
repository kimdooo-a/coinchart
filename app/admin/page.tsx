
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminPage() {
    // Auth Check
    const [checking, setChecking] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    // Data State
    const [users, setUsers] = useState<any[]>([]);
    const [crawlResult, setCrawlResult] = useState<string | null>(null);
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
        setCrawlResult('Crawling...');
        try {
            // Reusing the cron API
            const res = await fetch('/api/cron/news?lang=ko');
            const text = await res.text();

            try {
                const data = JSON.parse(text);
                setCrawlResult(JSON.stringify(data, null, 2));
            } catch (jsonError) {
                console.error('JSON Parse Error:', jsonError);
                setCrawlResult(`Error: Invalid JSON response.\nRaw Output:\n${text.slice(0, 500)}...`);
            }
        } catch (e) {
            setCrawlResult('Error: ' + String(e));
        } finally {
            setLoading(false);
        }
    };

    if (checking) {
        return <div className="min-h-screen bg-black text-white flex justify-center items-center">Checking permissions...</div>;
    }

    if (!authorized) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center p-4">
                <h1 className="text-3xl font-bold mb-4 text-red-500">Access Denied</h1>
                <p className="text-gray-400 mb-6">You are not authorized to view this page.</p>
                <Link href="/" className="px-6 py-2 bg-gray-800 rounded hover:bg-gray-700 transition-colors">
                    Back to Home
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <header className="max-w-4xl mx-auto flex items-center gap-4 mb-10 border-b border-gray-800 pb-4">
                <Link
                    href="/"
                    className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity flex items-center gap-2"
                >
                    ← Admin DashBoard
                </Link>
            </header>

            <div className="max-w-4xl mx-auto space-y-12">

                {/* News Control Section */}
                <section className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        📰 News Crawler Control
                        {loading && <span className="text-xs text-yellow-500 animate-pulse">(Processing...)</span>}
                    </h2>
                    <p className="text-gray-400 mb-6 text-sm">
                        Manually trigger the news crawler. Duplicates will be strictly ignored based on URL.
                    </p>

                    <div className="flex gap-4 items-start">
                        <button
                            onClick={triggerNewsCrawl}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 px-6 py-3 rounded-lg font-bold transition-all"
                        >
                            Trigger Crawler (Korean)
                        </button>

                        <div className="flex-1 bg-black p-4 rounded-lg font-mono text-xs text-green-400 overflow-x-auto h-32 border border-gray-800">
                            {crawlResult || 'Ready to crawl...'}
                        </div>
                    </div>
                </section>

                {/* User Management Section */}
                <section className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">👥 User Management ({users.length})</h2>
                        <button
                            onClick={fetchUsers}
                            className="text-sm bg-gray-800 px-3 py-1 rounded hover:bg-gray-700"
                        >
                            Refresh
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-gray-800 text-gray-200 uppercase font-bold text-xs">
                                <tr>
                                    <th className="p-3">Email</th>
                                    <th className="p-3">Created At</th>
                                    <th className="p-3">Last Sign In</th>
                                    <th className="p-3">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-4 text-center text-gray-600">No users found</td>
                                    </tr>
                                ) : (
                                    users.map((u) => (
                                        <tr key={u.id} className="hover:bg-gray-800/50">
                                            <td className="p-3 text-white font-medium">{u.email}</td>
                                            <td className="p-3">{new Date(u.created_at).toLocaleDateString()}</td>
                                            <td className="p-3">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : '-'}</td>
                                            <td className="p-3">
                                                <button
                                                    onClick={() => deleteUser(u.id)}
                                                    className="bg-red-900/30 text-red-400 hover:bg-red-900/50 px-3 py-1 rounded border border-red-900/50 transition-colors"
                                                >
                                                    Delete
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
