import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { buildRateLimitHeaders, checkRateLimit, getClientIp } from '@/lib/rate-limit'
import logger from '@/lib/logger'

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req)

    const ipResult = await checkRateLimit({
      key: ip,
      prefix: 'rl:contact:ip',
      limit: 3,
      windowSeconds: 600,
    })

    if (!ipResult.success) {
      return NextResponse.json(
        { error: 'Too many contact requests from this IP. Please try again later.' },
        { status: 429, headers: buildRateLimitHeaders(ipResult) }
      )
    }

    const { name, email, subject, message } = await req.json()

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const emailRateResult = await checkRateLimit({
      key: email.toLowerCase(),
      prefix: 'rl:contact:email',
      limit: 2,
      windowSeconds: 3600,
    })

    if (!emailRateResult.success) {
      return NextResponse.json(
        { error: 'Too many requests for this email. Please try again later.' },
        { status: 429, headers: buildRateLimitHeaders(emailRateResult) }
      )
    }

    // Configure nodemailer transporter with Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    })

    // Email content to send to Zero Error Esports
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to the configured email
      subject: `Contact Form: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>From:</strong> ${name}</p>
            <p style="margin: 10px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 10px 0;"><strong>Subject:</strong> ${subject}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h3 style="color: #333;">Message:</h3>
            <p style="white-space: pre-wrap; line-height: 1.6; color: #555;">${message}</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #888;">
            <p>This email was sent from the Zero Error Esports contact form.</p>
            <p>Reply directly to: ${email}</p>
          </div>
        </div>
      `,
      replyTo: email, // Allow direct reply to the sender
    }

    // Send email
    const info = await transporter.sendMail(mailOptions)
    logger.info({ route: '/api/contact', messageId: info.messageId }, 'Contact email sent')

    return NextResponse.json(
      { message: 'Email sent successfully', messageId: info.messageId },
      { status: 200 }
    )
  } catch (error) {
    logger.error({ route: '/api/contact', err: error }, 'Error sending contact email')

    return NextResponse.json(
      {
        error: 'Failed to send email. Please try again later.',
      },
      { status: 500 }
    )
  }
}
