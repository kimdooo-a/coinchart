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
        <main className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col items-center">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[120px]" />
            </div>

            {/* Spacer for GlobalHeader */}
            <div className="h-24 w-full" aria-hidden="true" />

            <div className="relative z-10 w-full max-w-2xl px-4 py-8">
                <header className="mb-10 text-center">
                    <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-6 border border-primary/20 shadow-lg shadow-primary/5">
                        <Mail className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-4xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                        {lang === 'ko' ? '문의하기' : 'Contact Us'}
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        {lang === 'ko'
                            ? '궁금한 점이나 제안사항이 있으시면 언제든지 문의해주세요.'
                            : 'Have questions or suggestions? We\'d love to hear from you.'}
                    </p>
                </header>

                <div className="bg-card/30 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-xl">
                    {status === 'success' ? (
                        <div className="text-center py-12 animate-in fade-in zoom-in duration-300">
                            <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
                            <h3 className="text-3xl font-bold text-foreground mb-4">
                                {lang === 'ko' ? '전송 완료!' : 'Message Sent!'}
                            </h3>
                            <p className="text-muted-foreground mb-8 text-lg">
                                {lang === 'ko'
                                    ? '문의하신 내용이 성공적으로 접수되었습니다. 빠른 시일 내에 답변 드리겠습니다.'
                                    : 'Thank you for reaching out. We will get back to you shortly.'}
                            </p>
                            <button
                                onClick={() => setStatus('idle')}
                                className="px-8 py-3 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 rounded-full text-base font-bold transition-all hover:scale-105"
                            >
                                {lang === 'ko' ? '다른 문의 보내기' : 'Send Another Message'}
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-sm font-bold text-muted-foreground ml-1">
                                        {lang === 'ko' ? '이름' : 'Name'}
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/50"
                                        placeholder={lang === 'ko' ? '홍길동' : 'John Doe'}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-bold text-muted-foreground ml-1">
                                        {lang === 'ko' ? '이메일' : 'Email'}
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/50"
                                        placeholder="name@example.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="subject" className="text-sm font-bold text-muted-foreground ml-1">
                                    {lang === 'ko' ? '제목' : 'Subject'}
                                </label>
                                <input
                                    type="text"
                                    id="subject"
                                    name="subject"
                                    required
                                    value={formData.subject}
                                    onChange={handleChange}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/50"
                                    placeholder={lang === 'ko' ? '문의 제목을 입력해주세요' : 'How can we help?'}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="message" className="text-sm font-bold text-muted-foreground ml-1">
                                    {lang === 'ko' ? '내용' : 'Message'}
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    required
                                    rows={5}
                                    value={formData.message}
                                    onChange={handleChange}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/50 resize-none"
                                    placeholder={lang === 'ko' ? '자세한 내용을 적어주세요...' : 'Tell us more...'}
                                ></textarea>
                            </div>

                            {status === 'error' && (
                                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <span>{errorMessage || (lang === 'ko' ? '전송 중 오류가 발생했습니다.' : 'Failed to send message.')}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
