import Link from "next/link";

export const metadata = {
    title: "特定商取引法に基づく表記 | BOAT BANK",
};

export default function SctPage() {
    return (
        <div className="min-h-full bg-white px-4 py-8 max-w-2xl mx-auto">
            <Link
                href="/"
                className="text-xs text-[#533afd] hover:underline inline-block mb-6"
            >
                ← トップに戻る
            </Link>

            <article className="prose prose-sm prose-slate max-w-none">
                <h1 className="text-xl font-bold text-[#061b31] mb-6">特定商取引法に基づく表記</h1>

                <p className="text-xs text-slate-400 mb-8">最終更新日: 2026年6月17日</p>

                <table className="w-full text-sm border-collapse">
                    <tbody>
                        <Row label="事業者の名称">soma anraku</Row>
                        <Row label="運営統括責任者">soma anraku</Row>
                        <Row label="所在地">
                            〒106-0032<br />
                            東京都港区六本木3丁目16番12号<br />
                            六本木KSビル5F
                        </Row>
                        <Row label="電話番号">ご請求があれば遅滞なく開示します。</Row>
                        <Row label="お問い合わせ先">
                            <a href="mailto:support@boatbank.jp" className="text-[#533afd] underline">
                                support@boatbank.jp
                            </a>
                        </Row>
                        <Row label="ホームページURL">
                            <a href="https://boatbank.jp" className="text-[#533afd] underline">
                                https://boatbank.jp
                            </a>
                        </Row>
                        <Row label="販売価格">
                            <strong>BOAT BANK スタンダード（自動更新サブスクリプション）</strong>
                            <br />
                            月額500円（税込）
                            <br />
                            ※ 各商品ページに表示しています
                        </Row>
                        <Row label="商品代金以外の必要料金">
                            通信料金等はお客様のご負担となります。
                            <br />
                            その他の追加料金は発生しません。
                        </Row>
                        <Row label="お支払い方法">
                            Apple App Store または Google Play のアカウントに登録された支払い方法（クレジットカード、デビットカード、キャリア決済、各ストアの残高等）
                        </Row>
                        <Row label="お支払い時期">
                            お申込み時に課金されます（無料トライアル期間中は課金されません）。
                            <br />
                            自動更新により、有効期間終了の24時間前までに解約されない場合、次の有効期間分の料金が請求されます。
                        </Row>
                        <Row label="商品の引渡時期">
                            お申込み完了後、即時にご利用いただけます。
                        </Row>
                        <Row label="返品・キャンセルについて">
                            デジタルコンテンツの性質上、購入後の返品・返金は原則として承っておりません。
                            <br />
                            無料トライアル期間中に解約された場合、料金は発生しません。
                            <br />
                            なお、課金処理は Apple App Store または Google Play によって行われるため、返金につきましては各ストアの規約に基づき判断されます。返金のご相談は、ご利用のストア（{" "}
                            <a href="https://support.apple.com/ja-jp/HT204084" className="text-[#533afd] underline" target="_blank" rel="noopener noreferrer">
                                Apple サポート
                            </a>
                            {" / "}
                            <a href="https://support.google.com/googleplay/answer/2479637" className="text-[#533afd] underline" target="_blank" rel="noopener noreferrer">
                                Google Play ヘルプ
                            </a>
                            ）までご連絡ください。
                        </Row>
                        <Row label="サブスクリプションの解約方法">
                            iOS: iPhone「設定」＞「Apple ID」＞「サブスクリプション」から。
                            <br />
                            Android: 「Google Play」アプリ ＞「お支払いと定期購入」＞「定期購入」から。
                            <br />
                            いずれもいつでも解約手続きが可能です。
                        </Row>
                        <Row label="動作環境">
                            iOS 15 以上 / Android 7.0 以上 / 最新のSafari, Chrome 等のモダンブラウザ
                        </Row>
                    </tbody>
                </table>

                <p className="text-xs text-slate-500 mt-8">
                    本表記は、特定商取引に関する法律第11条（通信販売についての広告）に基づくものです。
                </p>

                <p className="text-xs text-slate-400 mt-4">
                    関連ページ:{" "}
                    <Link href="/terms" className="text-[#533afd] underline">利用規約</Link>
                    {" / "}
                    <Link href="/privacy" className="text-[#533afd] underline">プライバシーポリシー</Link>
                </p>
            </article>
        </div>
    );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <tr className="border-b border-slate-200">
            <th className="text-left align-top py-3 pr-4 font-bold text-[#061b31] w-1/3 min-w-[120px]">
                {label}
            </th>
            <td className="py-3 text-[#273951] leading-relaxed">{children}</td>
        </tr>
    );
}
