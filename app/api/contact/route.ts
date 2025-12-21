import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    try {
        const { name, email, subject, message } = await req.json();

        // Validate input
        if (!name || !email || !subject || !message) {
            return NextResponse.json(
                { message: 'Missing required fields' },
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

        // Email Options
        const mailOptions = {
            from: `"${name}" <${process.env.CONTACT_EMAIL_USER}>`, // Sender address
            to: recipient, // List of receivers
            replyTo: email, // Set Reply-To to the user's email
            subject: `[Contact Form] ${subject}`, // Subject line
            text: `
Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
            `, // plain text body
            html: `
<h3>New Contact Form Submission</h3>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Subject:</strong> ${subject}</p>
<hr/>
<p><strong>Message:</strong></p>
<pre style="font-family: inherit; white-space: pre-wrap;">${message}</pre>
            `, // html body
        };

        // Send Email
        await transporter.sendMail(mailOptions);

        return NextResponse.json(
            { message: 'Email sent successfully' },
            { status: 200 }
        );

    } catch (error: any) {
        console.error('Email send error:', error);
        return NextResponse.json(
            { message: 'Failed to send email', error: error.message },
            { status: 500 }
        );
    }
}
