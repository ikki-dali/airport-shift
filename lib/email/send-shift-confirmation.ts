'use server'

import { Resend } from 'resend'

function getResend() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return null
  }
  return new Resend(apiKey)
}

interface SendShiftConfirmationEmailParams {
  to: string
  staffName: string
  token: string
  shiftCount: number
}

export async function sendShiftConfirmationEmail({
  to,
  staffName,
  token,
  shiftCount,
}: SendShiftConfirmationEmailParams) {
  if (!to) {
    console.warn('No email address provided for staff')
    return { success: false, error: 'No email address' }
  }

  const resend = getResend()
  if (!resend) {
    console.warn('RESEND_API_KEY is not set. Email sending is disabled.')
    return { success: false, error: 'Email sending is not configured' }
  }

  const shiftViewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/staff/shifts?token=${token}`

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'シフト管理 <noreply@resend.dev>',
      to: [to],
      subject: '【ANA】シフトが確定しました',
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

              <h2 style="color: #2563eb;">シフトが確定しました</h2>

              <p>${staffName} 様</p>

              <p>お疲れ様です。<br>
              ${shiftCount}件のシフトが確定されました。</p>

              <p>以下のリンクから確定シフトをご確認ください。</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${shiftViewUrl}"
                   style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  確定シフトを確認
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
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }

    console.log('Email sent successfully:', data)
    return { success: true, data }
  } catch (error: any) {
    console.error('Failed to send email:', error)
    return { success: false, error: error.message }
  }
}
