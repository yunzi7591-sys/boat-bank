import { LegalLayout, Section, BulletList, Highlight } from "@/components/legal/LegalLayout";

export const metadata = {
    title: "プライバシーポリシー | BOAT BANK",
    alternates: { canonical: "https://boatbank.jp/privacy" },
};

export default function PrivacyPage() {
    return (
        <LegalLayout
            title="プライバシーポリシー"
            updatedAt="2026年7月9日"
            intro={
                <p>
                    BOAT BANK（以下「本サービス」）は、個人が運営するサービスです。
                    本サービスの利用に際して取得する個人情報の取り扱いについて、以下のとおりプライバシーポリシーを定めます。
                </p>
            }
        >
            <Section num={1} title="収集する情報">
                <p>本サービスでは、以下の情報を収集する場合があります。</p>
                <BulletList
                    items={[
                        <>メールアドレス、ニックネーム、自己紹介、プロフィールリンク</>,
                        <>パスワード（暗号化して保存）</>,
                        <>
                            <strong>Sign in with Apple でログインした場合:</strong>
                            Apple ID 識別子（sub）、メールアドレス（Apple のリレーアドレスを含む）、氏名（初回認可時のみ）
                        </>,
                        <>
                            <strong>Google アカウントでログインした場合:</strong>
                            Google アカウント識別子（sub）、メールアドレス、氏名、プロフィール画像URL
                        </>,
                        <>利用データ（アクセスログ、利用履歴、IPアドレス、ブラウザ・端末情報等）</>,
                        <>ポイント取引履歴、予想の購入・公開履歴、収支管理機能で入力された情報</>,
                        <>フォロー・フォロワー関係の情報</>,
                        <>サブスクリプション（会員プラン）の加入状態・有効期限等の購読情報</>,
                        <>プッシュ通知の購読トークン（通知を許可した場合のみ）</>,
                    ]}
                />
                <Highlight>
                    クレジットカード番号等の決済情報は、本サービスでは取得・保存しません。
                    決済は Apple App Store または Google Play によって処理されます。
                </Highlight>
                <p className="text-xs text-slate-500">
                    ※ Apple / Google のソーシャルログインで取得する情報は、本サービスのアカウント識別とログイン認証の目的にのみ利用します。
                    Apple / Google から提供される追加情報（連絡先、カレンダー、ストレージ等）は一切要求しません。
                </p>
            </Section>

            <Section num={2} title="利用目的">
                <BulletList
                    items={[
                        <>本サービスの提供・運営</>,
                        <>サービスの改善・新機能の開発</>,
                        <>ポイント・サブスクリプションの管理、取引の記録</>,
                        <>ユーザーサポートへの対応</>,
                        <>不正利用の防止・検知</>,
                        <>利用規約への違反行為への対応</>,
                        <>メール認証・パスワードリセット等のメール送信</>,
                        <>ニュース・お知らせ・重要な通知の配信（プッシュ通知を含む）</>,
                        <>フォロー機能によるユーザー間の関係管理</>,
                    ]}
                />
            </Section>

            <Section num={3} title="第三者提供">
                <p>本サービスは、以下の場合を除き、ユーザーの個人情報を第三者に提供することはありません。</p>
                <BulletList
                    items={[
                        <>ユーザーの同意がある場合</>,
                        <>法令に基づく場合</>,
                        <>人の生命・身体・財産の保護に必要であり、本人の同意を得ることが困難な場合</>,
                        <>公衆衛生の向上または児童の健全な育成のために特に必要がある場合</>,
                        <>国・地方公共団体またはその委託を受けた者が法令の定める事務を遂行するために協力する必要がある場合</>,
                    ]}
                />
            </Section>

            <Section num={4} title="メール送信について">
                <p>
                    本サービスでは、以下の目的でユーザーのメールアドレス宛にメールを送信します。
                    送信には Resend 社のメール配信サービスを利用し、送信に必要な範囲でメールアドレスを同社に提供します。
                </p>
                <BulletList
                    items={[
                        <>アカウント登録時のメールアドレス認証</>,
                        <>パスワードリセットの案内</>,
                        <>重要なお知らせ（サービスの変更・終了、規約改定等）</>,
                    ]}
                />
            </Section>

            <Section num={5} title="外部サービスの利用">
                <p>
                    本サービスは、運営のために以下の外部サービスを利用しており、必要な範囲で情報を提供することがあります。
                    各サービスのプライバシーポリシーは、各社の公式サイトをご確認ください。
                </p>
                <BulletList
                    items={[
                        <><strong>Vercel（Vercel Inc.）</strong>: ホスティング・インフラ</>,
                        <><strong>Supabase / PostgreSQL</strong>: データベース基盤</>,
                        <><strong>Resend（Resend, Inc.）</strong>: 認証・通知メールの配信</>,
                        <><strong>RevenueCat（RevenueCat, Inc.）</strong>: サブスクリプションの状態管理</>,
                        <><strong>Apple（App Store / Sign in with Apple）</strong>: サブスクリプション課金処理および Sign in with Apple のソーシャルログイン認証。Apple のプライバシーポリシーは <a href="https://www.apple.com/legal/privacy/jp/" target="_blank" rel="noopener noreferrer" className="text-[#533afd] underline">Apple 公式</a> をご確認ください</>,
                        <><strong>Apple Push Notification Service (APNs)</strong>: iOS アプリへのプッシュ通知配信</>,
                        <><strong>Firebase Cloud Messaging（Google LLC）</strong>: Android アプリへのプッシュ通知配信</>,
                        <><strong>Google（Google Play / Sign in with Google / Google Analytics）</strong>: サブスクリプション課金処理、ソーシャルログイン認証およびアクセス解析。Google のプライバシーポリシーは <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#533afd] underline">Google 公式</a> をご確認ください</>,
                        <><strong>A8.net（株式会社ファンコミュニケーションズ）</strong>: アフィリエイト広告の表示・効果測定</>,
                    ]}
                />
            </Section>

            <Section num={6} title="フォロー関係の情報について">
                <p>
                    本サービスでは、ユーザー検索・フォロー機能を提供しています。
                    フォロー・フォロワーの関係情報は、ユーザーのプロフィールページ等で他のユーザーに表示される場合があります。
                    フォロー関係の情報は、サービスの提供・改善の目的にのみ利用し、第三者に提供することはありません（第3条に定める場合を除く）。
                </p>
            </Section>

            <Section num={7} title="Cookie・アクセス解析">
                <p>
                    本サービスでは、ログイン状態の維持・利便性の向上・アクセス解析のために Cookie および類似技術を使用する場合があります。
                    ユーザーはブラウザの設定により Cookie の受け入れを拒否することができますが、ログイン等一部の機能が利用できなくなる場合があります。
                </p>
                <p>
                    また、サービス改善のために Google Analytics を使用しています。
                    Google Analytics は Cookie を使用してアクセス情報を収集しますが、個人を特定する情報は含まれません。
                    収集情報は Google のプライバシーポリシーに基づき管理されます。
                    Google Analytics のオプトアウトは、Google が提供するオプトアウトアドオン等により可能です。
                </p>
            </Section>

            <Section num={8} title="広告の配信について">
                <p>
                    本サービスでは、A8.net 等の第三者配信のアフィリエイト広告サービスを利用する場合があります。
                    これらの広告事業者は、Cookie 等を使用してユーザーの興味に応じた広告を表示することがあります。
                    Cookie を無効にする方法および広告事業者のオプトアウトについては、各事業者のサイトをご確認ください。
                </p>
            </Section>

            <Section num={9} title="プッシュ通知について">
                <p>
                    本サービスでは、予想が購入された時、フォロー中の人が新しい予想を出した時、その他重要なお知らせを通知するためにプッシュ通知機能を提供します。
                    プッシュ通知の受信には、ブラウザまたは端末での許可が必要です。
                    許可した場合、通知の配信に必要な購読トークン（iOS の場合は APNs デバイストークン、Android の場合は FCM トークン）を保存します。
                    プッシュ通知は、ブラウザ・端末の設定または本サービスの通知設定からいつでも無効化できます。
                </p>
            </Section>

            <Section num={10} title="情報の管理・安全対策">
                <p>
                    本サービスは、収集した個人情報の漏洩・滅失・毀損を防止するため、適切な安全対策を講じます。
                    パスワードは暗号化して保存し、通信は HTTPS により暗号化して、不正アクセスの防止に努めます。
                </p>
                <p className="text-xs text-slate-500">
                    ただし、インターネット上の通信においてセキュリティを完全に保証するものではありません。
                </p>
            </Section>

            <Section num={11} title="個人情報の保存期間・アカウント削除">
                <p>
                    本サービスは、利用目的の達成に必要な範囲内で個人情報を保存します。
                </p>
                <p>
                    ユーザーはアプリの「マイページ」からいつでもアカウントを削除できます。
                    アカウント削除を行った場合、法令に基づき保存が必要な情報を除き、関連する個人情報は速やかに削除されます。
                </p>
            </Section>

            <Section num={12} title="ユーザーの権利">
                <p>ユーザーは、本サービスが保有する自身の個人情報について、以下の権利を有します。</p>
                <BulletList
                    items={[
                        <>個人情報の開示を求める権利</>,
                        <>個人情報の訂正・追加・削除を求める権利</>,
                        <>個人情報の利用停止・消去を求める権利</>,
                        <>個人情報の第三者提供の停止を求める権利</>,
                    ]}
                />
                <p className="text-xs text-slate-500">
                    ご希望の場合は、下記のお問い合わせ先までご連絡ください。本人確認のうえ、合理的な期間内に対応いたします。
                </p>
            </Section>

            <Section num={13} title="未成年者の利用について">
                <p>
                    本サービスは、20歳未満の方の利用を推奨しておりません。
                    20歳未満の方が本サービスを利用する場合は、保護者の同意を得たうえでご利用ください。
                </p>
            </Section>

            <Section num={14} title="ポリシーの変更">
                <p>
                    本ポリシーの内容は、法令変更やサービス内容の変更に伴い、事前の通知なく変更する場合があります。
                    変更後のポリシーは、本ページに掲載した時点から効力を生じます。
                    重要な変更を行う場合は、本サービス上で通知するよう努めます。
                </p>
            </Section>

            <Section num={15} title="お問い合わせ">
                <p>本ポリシーに関するお問い合わせは、本サービス内のお問い合わせ機能または下記連絡先までお願いいたします。</p>
                <p className="bg-slate-50 rounded-md px-3 py-2 text-sm font-mono">
                    support@boatbank.jp
                </p>
            </Section>
        </LegalLayout>
    );
}
