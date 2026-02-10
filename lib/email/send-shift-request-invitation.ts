'use server'

import { Resend } from 'resend'
import { logger } from '@/lib/errors/logger'

function getResend() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return null
  }
  return new Resend(apiKey)
}

interface SendShiftRequestInvitationParams {
  to: string
  staffName: string
  token: string
  deadline?: string // 提出期限（オプション）
}

export async function sendShiftRequestInvitation({
  to,
  staffName,
  token,
  deadline,
}: SendShiftRequestInvitationParams) {
  if (!to) {
    logger.warn('No email address provided for staff', { action: 'sendShiftRequestInvitation' })
    return { success: false, error: 'No email address' }
  }

  const resend = getResend()
  if (!resend) {
    logger.warn('RESEND_API_KEY is not set. Email sending is disabled.', { action: 'sendShiftRequestInvitation' })
    return { success: false, error: 'Email sending is not configured' }
  }

  const requestUrl = `${process.env.NEXT_PUBLIC_APP_URL}/shift-request/${token}`

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'シフト管理 <noreply@resend.dev>',
      to: [to],
      subject: '【ANA】シフト希望提出のお願い',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
          </head>
          <body style="font-family: sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <img src="${process.env.NEXT_PUBLIC_APP_URL}/ana-logo.png" alt="ANA" style="height: 60px;">
              </div>

              <h2 style="color: #1B3A5C;">シフト希望提出のお願い</h2>

              <p>${staffName} 様</p>

              <p>お疲れ様です。<br>
              今月のシフト希望を提出してください。</p>

              ${deadline ? `<p style="background-color: #fef3c7; padding: 12px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                <strong>📅 提出期限:</strong> ${deadline}
              </p>` : ''}

              <p>以下のリンクから希望を提出できます。</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${requestUrl}"
                   style="display: inline-block; background-color: #1B3A5C; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  シフト希望を提出する
                </a>
              </div>

              <p style="color: #666; font-size: 14px;">
                ※ このリンクはあなた専用です。他の人と共有しないでください。<br>
                ※ このメールに心当たりがない場合は、管理者にお問い合わせください。
              </p>

              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

              <p style="color: #999; font-size: 12px; text-align: center;">
                © 2025 ANA シフト管理システム
              </p>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      logger.error('Resend error', { action: 'sendShiftRequestInvitation' }, error)
      return { success: false, error: error.message }
    }

    logger.info('Shift request invitation email sent successfully', { action: 'sendShiftRequestInvitation', emailId: data?.id })
    return { success: true, data }
  } catch (error: any) {
    logger.error('Failed to send shift request invitation email', { action: 'sendShiftRequestInvitation' }, error)
    return { success: false, error: error.message }
  }
}
