import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const domain = process.env.NEXT_PUBLIC_APP_URL || "https://boatbank.jp";

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetLink = `${domain}/reset-password?token=${token}`;

  const text = [
    "BOAT BANK パスワードリセット",
    "",
    "以下のリンクをクリックして、パスワードを再設定してください。",
    resetLink,
    "",
    "このリンクは1時間有効です。",
    "心当たりがない場合は、このメールを無視してください。",
    "",
    "---",
    "BOAT BANK - 競艇予想マーケットプレイス",
    domain,
  ].join("\n");

  try {
    await resend.emails.send({
      from: "BOAT BANK <noreply@boatbank.jp>",
      to: email,
      replyTo: "support@boatbank.jp",
      subject: "【BOAT BANK】パスワードリセット",
      text,
      headers: {
        "List-Unsubscribe": "<mailto:unsubscribe@boatbank.jp>",
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
          <h2 style="color: #0f172a; font-size: 20px; margin-bottom: 16px;">パスワードリセット</h2>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">
            以下のボタンをクリックして、パスワードを再設定してください。
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetLink}"
               style="background-color: #533afd; color: white; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px;">
              パスワードを再設定する
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 12px; line-height: 1.5;">
            このリンクは1時間有効です。<br/>
            心当たりがない場合は、このメールを無視してください。
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #cbd5e1; font-size: 11px;">
            BOAT BANK - 競艇予想マーケットプレイス
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    throw new Error("パスワードリセットメールの送信に失敗しました");
  }
}

export async function sendContactEmail(args: {
  fromName: string;
  fromEmail: string;
  category: string;
  message: string;
  userId?: string;
}) {
  const { fromName, fromEmail, category, message, userId } = args;

  const text = [
    `【BOAT BANK お問い合わせ】`,
    ``,
    `カテゴリ: ${category}`,
    `名前: ${fromName}`,
    `メールアドレス: ${fromEmail}`,
    userId ? `ユーザーID: ${userId}` : `ユーザーID: (未ログイン)`,
    ``,
    `--- メッセージ ---`,
    message,
    `----------------`,
  ].join("\n");

  try {
    await resend.emails.send({
      from: "BOAT BANK <noreply@boatbank.jp>",
      to: "support@boatbank.jp",
      replyTo: fromEmail,
      subject: `【お問い合わせ】${category} - ${fromName}`,
      text,
    });
  } catch (error) {
    console.error("Failed to send contact email:", error);
    throw new Error("お問い合わせの送信に失敗しました");
  }
}

export async function sendVerificationEmail(email: string, token: string) {
  const confirmLink = `${domain}/verify-email?token=${token}`;

  const text = [
    "BOAT BANK へようこそ！",
    "",
    "以下のリンクをクリックして、メールアドレスの確認を完了してください。",
    confirmLink,
    "",
    "このリンクは1時間有効です。",
    "心当たりがない場合は、このメールを無視してください。",
    "",
    "---",
    "BOAT BANK - 競艇予想マーケットプレイス",
    domain,
  ].join("\n");

  try {
    await resend.emails.send({
      from: "BOAT BANK <noreply@boatbank.jp>",
      to: email,
      replyTo: "support@boatbank.jp",
      subject: "【BOAT BANK】メールアドレスの確認",
      text,
      headers: {
        "List-Unsubscribe": "<mailto:unsubscribe@boatbank.jp>",
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
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
            このリンクは1時間有効です。<br/>
            心当たりがない場合は、このメールを無視してください。
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #cbd5e1; font-size: 11px;">
            BOAT BANK - 競艇予想マーケットプレイス
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send verification email:", error);
    throw new Error("確認メールの送信に失敗しました");
  }
}
