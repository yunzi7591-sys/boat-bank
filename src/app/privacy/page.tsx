import Link from "next/link";

export const metadata = {
  title: "プライバシーポリシー | BOAT BANK",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-full bg-white px-4 py-8 max-w-2xl mx-auto">
      <Link
        href="/"
        className="text-xs text-[#533afd] hover:underline inline-block mb-6"
      >
        ← トップに戻る
      </Link>

      <article className="prose prose-sm prose-slate max-w-none">
        <h1 className="text-xl font-bold text-[#061b31] mb-6">
          プライバシーポリシー
        </h1>

        <p className="text-xs text-slate-400 mb-8">最終更新日: 2026年4月13日</p>

        <p className="mb-4">
          BOAT BANK（以下「本サービス」）は、個人が運営するWebサービスです。本サービスの利用に際して取得する個人情報の取り扱いについて、以下のとおりプライバシーポリシーを定めます。
        </p>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">1. 収集する情報</h2>
          <p className="mb-4">本サービスでは、以下の情報を収集する場合があります。</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>メールアドレス</li>
            <li>パスワード（暗号化して保存）</li>
            <li>利用データ（アクセスログ、利用履歴、IPアドレス、ブラウザ情報等）</li>
            <li>ポイントの取引履歴・予想の購入履歴</li>
            <li>収支管理機能に入力された情報</li>
            <li>フォロー・フォロワー関係の情報</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">2. 利用目的</h2>
          <p className="mb-4">収集した情報は、以下の目的で利用します。</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>本サービスの提供・運営</li>
            <li>サービスの改善・新機能の開発</li>
            <li>ポイントの管理・取引の記録</li>
            <li>ユーザーサポートへの対応</li>
            <li>不正利用の防止・検知</li>
            <li>利用規約への違反行為への対応</li>
            <li>メール認証・パスワードリセット等のメール送信</li>
            <li>ニュース・お知らせの配信</li>
            <li>フォロー機能によるユーザー間の関係管理</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">3. 第三者提供</h2>
          <p className="mb-4">
            本サービスは、以下の場合を除き、ユーザーの個人情報を第三者に提供することはありません。
          </p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>ユーザーの同意がある場合</li>
            <li>法令に基づく場合</li>
            <li>人の生命・身体・財産の保護に必要な場合であって、本人の同意を得ることが困難な場合</li>
            <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合</li>
            <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">4. メール送信について</h2>
          <p className="mb-4">
            本サービスでは、以下の目的でユーザーのメールアドレス宛にメールを送信します。メールの送信にはResend社のメール配信サービスを利用しており、送信に必要な範囲でメールアドレスを同社に提供します。
          </p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>アカウント登録時のメールアドレス認証</li>
            <li>パスワードリセットの案内</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">5. フォロー関係の情報について</h2>
          <p className="mb-4">
            本サービスでは、ユーザー検索・フォロー機能を提供しています。フォロー・フォロワーの関係情報は、ユーザーのプロフィールページ等で他のユーザーに表示される場合があります。フォロー関係の情報は、サービスの提供・改善の目的にのみ利用し、第三者に提供することはありません（第3条に定める場合を除く）。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">6. Cookie・アクセス解析</h2>
          <p className="mb-4">
            本サービスでは、利便性の向上やアクセス解析のためにCookieを使用する場合があります。ユーザーはブラウザの設定によりCookieの受け入れを拒否することができますが、一部の機能が利用できなくなる場合があります。
          </p>
          <p className="mb-4">
            また、サービス改善のためにGoogle Analytics等のアクセス解析ツールを使用する場合があります。これらのツールはCookieを使用してデータを収集しますが、個人を特定する情報は含まれません。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">7. 情報の管理・安全対策</h2>
          <p className="mb-4">
            本サービスは、収集した個人情報の漏洩・滅失・毀損を防止するため、適切な安全対策を講じます。パスワードは暗号化して保存し、不正アクセスの防止に努めます。
          </p>
          <p className="mb-4">
            ただし、インターネット上の通信においてセキュリティを完全に保証するものではありません。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">8. 個人情報の保存期間</h2>
          <p className="mb-4">
            本サービスは、利用目的の達成に必要な範囲内で個人情報を保存します。アカウント削除の申請があった場合、法令に基づき保存が必要な情報を除き、合理的な期間内に個人情報を削除します。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">9. ユーザーの権利</h2>
          <p className="mb-4">
            ユーザーは、本サービスが保有する自身の個人情報について、以下の権利を有します。
          </p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>個人情報の開示を求める権利</li>
            <li>個人情報の訂正・追加・削除を求める権利</li>
            <li>個人情報の利用停止・消去を求める権利</li>
            <li>個人情報の第三者提供の停止を求める権利</li>
          </ul>
          <p className="mb-4">
            ご希望の場合は、下記のお問い合わせ先までご連絡ください。本人確認を行ったうえで、合理的な期間内に対応いたします。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">10. 広告配信について</h2>
          <p className="mb-4">
            本サービスでは、Google AdSense等の第三者配信の広告サービスを利用しています。広告配信事業者は、ユーザーの興味に応じた広告を表示するためにCookie（広告Cookie）を使用することがあります。
          </p>
          <p className="mb-4">
            Google AdSenseによる広告配信では、Googleおよびそのパートナーがユーザーのアクセス情報に基づいて適切な広告を表示します。ユーザーは、Googleの広告設定ページ（https://adssettings.google.com）からパーソナライズ広告を無効にすることができます。また、Network Advertising Initiativeのオプトアウトページ（https://optout.networkadvertising.org）からも第三者配信事業者のCookieの使用を無効にすることができます。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">11. 未成年者の利用について</h2>
          <p className="mb-4">
            本サービスは、20歳未満の方の利用を推奨しておりません。20歳未満の方が本サービスを利用する場合は、保護者の同意を得たうえでご利用ください。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">12. ポリシーの変更</h2>
          <p className="mb-4">
            本ポリシーの内容は、法令変更やサービス内容の変更に伴い、事前の通知なく変更する場合があります。変更後のポリシーは、本ページに掲載した時点から効力を生じるものとします。重要な変更を行う場合は、本サービス上で通知するよう努めます。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">13. お問い合わせ</h2>
          <p className="mb-4">
            本ポリシーに関するお問い合わせは、本サービス内のお問い合わせ機能またはサイト上に掲載する連絡先までお願いいたします。
          </p>
        </section>

        <p className="text-xs text-slate-400 mt-8">
          URL:{" "}
          <a
            href="https://boatbank.jp"
            className="text-[#533afd]"
          >
            https://boatbank.jp
          </a>
        </p>
      </article>
    </div>
  );
}
