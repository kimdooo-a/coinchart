'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { TRANSLATIONS } from '@/lib/translations';
import { Mail, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

export default function ContactPage() {
    const { lang } = useLanguage();
    const t = TRANSLATIONS[lang];

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [status, setStatus] = useState<FormStatus>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage('');

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Something went wrong');

            setStatus('success');
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (error: any) {
            setStatus('error');
            setErrorMessage(error.message);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <main className="min-h-screen bg-black text-white p-4 md:p-8 flex flex-col items-center">
            {/* Spacer for GlobalHeader */}
            <div className="h-24 w-full" aria-hidden="true" />

            <div className="w-full max-w-2xl">
                <header className="mb-10 text-center">
                    <div className="inline-flex items-center justify-center p-3 bg-gray-900 rounded-full mb-4 border border-gray-800">
                        <Mail className="w-6 h-6 text-blue-400" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        {lang === 'ko' ? '문의하기' : 'Contact Us'}
                    </h1>
                    <p className="text-gray-400">
                        {lang === 'ko'
                            ? '궁금한 점이나 제안사항이 있으시면 언제든지 문의해주세요.'
                            : 'Have questions or suggestions? We\'d love to hear from you.'}
                    </p>
                </header>

                <div className="bg-gray-900/50 p-8 rounded-3xl border border-gray-800 shadow-xl backdrop-blur-sm">
                    {status === 'success' ? (
                        <div className="text-center py-12 animate-in fade-in zoom-in duration-300">
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-white mb-2">
                                {lang === 'ko' ? '전송 완료!' : 'Message Sent!'}
                            </h3>
                            <p className="text-gray-400 mb-8">
                                {lang === 'ko'
                                    ? '문의하신 내용이 성공적으로 접수되었습니다. 빠른 시일 내에 답변 드리겠습니다.'
                                    : 'Thank you for reaching out. We will get back to you shortly.'}
                            </p>
                            <button
                                onClick={() => setStatus('idle')}
                                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-full text-sm font-bold transition-colors"
                            >
                                {lang === 'ko' ? '다른 문의 보내기' : 'Send Another Message'}
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-sm font-bold text-gray-400 ml-1">
                                        {lang === 'ko' ? '이름' : 'Name'}
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600"
                                        placeholder={lang === 'ko' ? '홍길동' : 'John Doe'}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-bold text-gray-400 ml-1">
                                        {lang === 'ko' ? '이메일' : 'Email'}
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600"
                                        placeholder="name@example.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="subject" className="text-sm font-bold text-gray-400 ml-1">
                                    {lang === 'ko' ? '제목' : 'Subject'}
                                </label>
                                <input
                                    type="text"
                                    id="subject"
                                    name="subject"
                                    required
                                    value={formData.subject}
                                    onChange={handleChange}
                                    className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600"
                                    placeholder={lang === 'ko' ? '문의 제목을 입력해주세요' : 'How can we help?'}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="message" className="text-sm font-bold text-gray-400 ml-1">
                                    {lang === 'ko' ? '내용' : 'Message'}
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    required
                                    rows={5}
                                    value={formData.message}
                                    onChange={handleChange}
                                    className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600 resize-none"
                                    placeholder={lang === 'ko' ? '자세한 내용을 적어주세요...' : 'Tell us more...'}
                                ></textarea>
                            </div>

                            {status === 'error' && (
                                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 p-3 rounded-lg border border-red-900/50">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>{errorMessage || (lang === 'ko' ? '전송 중 오류가 발생했습니다.' : 'Failed to send message.')}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {status === 'loading' ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>{lang === 'ko' ? '전송 중...' : 'Sending...'}</span>
                                    </>
                                ) : (
                                    <>
                                        <span>{lang === 'ko' ? '메시지 보내기' : 'Send Message'}</span>
                                        <Send className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </main>
    );
}
