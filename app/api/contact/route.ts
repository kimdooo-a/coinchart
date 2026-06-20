import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// 이메일 본문(HTML)에 사용자 입력을 그대로 끼워넣을 때의 HTML/태그 인젝션 차단
function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// 간단한 이메일 형식 검증 (RFC 완전 준수가 아닌 실용적 패턴)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 필드별 최대 길이 (과도한 페이로드·헤더 인젝션 방지)
const LIMITS = { name: 100, email: 254, subject: 200, message: 5000 } as const;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const name = typeof body.name === 'string' ? body.name.trim() : '';
        const email = typeof body.email === 'string' ? body.email.trim() : '';
        const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
        const message = typeof body.message === 'string' ? body.message.trim() : '';

        // 1. 필수값 검증
        if (!name || !email || !subject || !message) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // 2. 길이 제한
        if (
            name.length > LIMITS.name ||
            email.length > LIMITS.email ||
            subject.length > LIMITS.subject ||
            message.length > LIMITS.message
        ) {
            return NextResponse.json(
                { message: 'Input exceeds allowed length' },
                { status: 400 }
            );
        }

        // 3. 이메일 형식 (+ 헤더 인젝션용 개행 차단)
        if (!EMAIL_RE.test(email) || /[\r\n]/.test(email)) {
            return NextResponse.json(
                { message: 'Invalid email format' },
                { status: 400 }
            );
        }

        const recipient = process.env.CONTACT_EMAIL_TO || 'smartkdy7@gmail.com';

        // Configure Nodemailer Transporter
        // Using explicit SMTP settings is often more reliable than the 'service' shorthand
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
                user: process.env.CONTACT_EMAIL_USER,
                pass: process.env.CONTACT_EMAIL_PASS,
            },
        });

        // Email Options — HTML 본문은 escapeHtml로 인젝션 차단, from 표시명은 따옴표 제거
        const safeFromName = name.replace(/["\r\n]/g, ' ').trim();
        const mailOptions = {
            from: `"${safeFromName}" <${process.env.CONTACT_EMAIL_USER}>`, // Sender address
            to: recipient, // List of receivers
            replyTo: email, // Set Reply-To to the user's email
            subject: `[Contact Form] ${subject.replace(/[\r\n]/g, ' ')}`, // Subject line (개행 제거)
            text: `
Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
            `, // plain text body
            html: `
<h3>New Contact Form Submission</h3>
<p><strong>Name:</strong> ${escapeHtml(name)}</p>
<p><strong>Email:</strong> ${escapeHtml(email)}</p>
<p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
<hr/>
<p><strong>Message:</strong></p>
<pre style="font-family: inherit; white-space: pre-wrap;">${escapeHtml(message)}</pre>
            `, // html body
        };

        // Send Email
        await transporter.sendMail(mailOptions);

        return NextResponse.json(
            { message: 'Email sent successfully' },
            { status: 200 }
        );

    } catch (error: unknown) {
        console.error('Email send error:', error);
        return NextResponse.json(
            { message: 'Failed to send email', error: (error as Error).message },
            { status: 500 }
        );
    }
}
