import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { z } from 'zod'
import { badRequestFromZod } from '@/lib/validation'
import { buildRateLimitHeaders, checkRateLimit, getRateLimitRule } from '@/lib/rate-limit'
import logger from '@/lib/logger'

const CONTACT_SCHEMA = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120, 'Name is too long'),
  email: z.string().trim().email('Invalid email format').max(254, 'Email is too long'),
  subject: z.string().trim().min(1, 'Subject is required').max(180, 'Subject is too long'),
  message: z.string().trim().min(1, 'Message is required').max(3000, 'Message is too long'),
})

function jsonError(
  status: number,
  message: string,
  code: string,
  headers?: HeadersInit,
  details?: unknown
) {
  return NextResponse.json(
    {
      error: message,
      code,
      ...(details ? { details } : {}),
    },
    {
      status,
      ...(headers ? { headers } : {}),
    }
  )
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function methodNotAllowed() {
  return jsonError(405, 'Method not allowed', 'METHOD_NOT_ALLOWED', {
    Allow: 'POST, OPTIONS',
  })
}

export async function GET() {
  return methodNotAllowed()
}

export async function PUT() {
  return methodNotAllowed()
}

export async function PATCH() {
  return methodNotAllowed()
}

export async function DELETE() {
  return methodNotAllowed()
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: 'POST, OPTIONS',
    },
  })
}

export async function POST(req: Request) {
  const contactIpRule = getRateLimitRule('contactIp')
  const contactEmailRule = getRateLimitRule('contactEmail')

  try {
    const ipResult = await checkRateLimit({
      request: req,
      ...contactIpRule,
    })

    if (!ipResult.success) {
      return jsonError(
        429,
        'Too many requests. Please try again later.',
        'RATE_LIMITED',
        buildRateLimitHeaders(ipResult)
      )
    }

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return jsonError(400, 'Invalid JSON payload', 'INVALID_JSON')
    }

    const parsed = CONTACT_SCHEMA.safeParse(body)
    if (!parsed.success) {
      const validationError = badRequestFromZod(parsed.error)
      return jsonError(400, validationError.error, 'INVALID_PAYLOAD', undefined, validationError.issues)
    }

    const { name, email, subject, message } = parsed.data

    const sanitizedName = escapeHtml(name)
    const sanitizedEmail = escapeHtml(email)
    const sanitizedSubject = escapeHtml(subject)
    const sanitizedMessage = escapeHtml(message)

    const emailRateResult = await checkRateLimit({
      key: email.toLowerCase(),
      ...contactEmailRule,
    })

    if (!emailRateResult.success) {
      return jsonError(
        429,
        'Too many requests. Please try again later.',
        'RATE_LIMITED',
        buildRateLimitHeaders(emailRateResult)
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
      subject: `Contact Form: ${sanitizedSubject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>From:</strong> ${sanitizedName}</p>
            <p style="margin: 10px 0;"><strong>Email:</strong> ${sanitizedEmail}</p>
            <p style="margin: 10px 0;"><strong>Subject:</strong> ${sanitizedSubject}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h3 style="color: #333;">Message:</h3>
            <p style="white-space: pre-wrap; line-height: 1.6; color: #555;">${sanitizedMessage}</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #888;">
            <p>This email was sent from the Zero Error Esports contact form.</p>
            <p>Reply directly to: ${sanitizedEmail}</p>
          </div>
        </div>
      `,
      replyTo: sanitizedEmail, // Allow direct reply to the sender
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

    return jsonError(500, 'Failed to send email. Please try again later.', 'INTERNAL_ERROR')
  }
}
