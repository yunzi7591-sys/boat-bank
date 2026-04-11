import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const domain = process.env.NEXT_PUBLIC_APP_URL || "https://boatbank.jp";

export async function sendVerificationEmail(email: string, token: string) {
  const confirmLink = `${domain}/verify-email?token=${token}`;

  await resend.emails.send({
    from: "BOAT BANK <noreply@boatbank.jp>",
    to: email,
    subject: "【BOAT BANK】メールアドレスの確認",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
        <h2 style="color: #0f172a; font-size: 20px; margin-bottom: 16px;">BOAT BANK へようこそ！</h2>
        <p style="color: #334155; font-size: 14px; line-height: 1.6;">
          以下のボタンをクリックして、メールアドレスの確認を完了してください。
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${confirmLink}"
             style="background-color: #10b981; color: white; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px;">
            メールアドレスを確認する
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 12px; line-height: 1.5;">
          このリンクは24時間有効です。<br/>
          心当たりがない場合は、このメールを無視してください。
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #cbd5e1; font-size: 11px;">
          BOAT BANK - 競艇予想マーケットプレイス
        </p>
      </div>
    `,
  });
}
