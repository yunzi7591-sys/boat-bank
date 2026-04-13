import Link from "next/link";

export const metadata = {
  title: "使い方ガイド | BOAT BANK",
};

export default function GuidePage() {
  return (
    <div className="min-h-full bg-white px-4 py-8 max-w-2xl mx-auto">
      <Link
        href="/"
        className="text-xs text-[#533afd] hover:underline inline-block mb-6"
      >
        ← トップに戻る
      </Link>

      <article className="prose prose-sm prose-slate max-w-none">
        <h1 className="text-xl font-bold text-[#061b31] mb-6">使い方ガイド</h1>

        {/* BOAT BANKとは */}
        <section className="mb-10">
          <h2 className="text-lg font-bold mb-3">BOAT BANKとは</h2>
          <p className="mb-3">
            BOAT BANKは、競艇（ボートレース）の<strong>予想マーケットプレイス</strong>＆<strong>収支管理アプリ</strong>です。
            自分の賭けを記録して収支を管理したり、予想を販売・購入したりできます。
          </p>
          <p className="text-sm text-slate-500">
            ※ 本サービスはボートレース公式（一般財団法人日本モーターボート競走会等）とは一切関係がなく、公式の許諾・認定を受けたサービスではありません。
          </p>
        </section>

        {/* 基本的な使い方 */}
        <section className="mb-10">
          <h2 className="text-lg font-bold mb-4">基本的な使い方</h2>

          {/* 1. レース場を選ぶ */}
          <div className="mb-8">
            <h3 className="text-base font-bold mb-2">1. レース場を選ぶ</h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>ホーム画面の24場グリッドからレース場をタップ</li>
              <li>開催中の場は色付きで表示され、締切が近いレースが自動選択されます</li>
            </ul>
          </div>

          {/* 2. 自分の賭けを記録する */}
          <div className="mb-8">
            <h3 className="text-base font-bold mb-2">2. 自分の賭けを記録する</h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>レース詳細画面の「賭けを登録（非公開）」をタップ</li>
              <li>マークシートで買い目を選択 → 金額入力 → カートに追加 → 投票</li>
              <li>結果が出ると自動で的中判定・収支計算が行われます</li>
            </ul>
          </div>

          {/* 3. 予想を販売・公開する */}
          <div className="mb-8">
            <h3 className="text-base font-bold mb-2">3. 予想を販売・公開する</h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>レース詳細画面の「予想を販売・公開」をタップ</li>
              <li>「自サイトで販売」か「他サイトへ誘導」を選択</li>
              <li><strong>自サイト販売:</strong> 買い目 + タイトル + 展開予想 + 販売価格を設定</li>
              <li><strong>他サイト誘導:</strong> 外部URL + 買い目（非公開）を設定（100pt消費）</li>
            </ul>
          </div>

          {/* 4. 他の人の予想を見る */}
          <div className="mb-8">
            <h3 className="text-base font-bold mb-2">4. 他の人の予想を見る</h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>マーケットで有料/無料/他サイト予想を閲覧</li>
              <li>無料予想は0ptで購入できます（会員登録必須）</li>
              <li>有料予想はポイントで購入できます</li>
            </ul>
          </div>
        </section>

        {/* ポイントについて */}
        <section className="mb-10">
          <h2 className="text-lg font-bold mb-3">ポイントについて</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>新規登録で<strong>5,000pt</strong>プレゼント</li>
            <li>毎日<strong>300pt</strong>のデイリーポイント（翌日リセット）</li>
            <li>あなたの予想が購入されるとポイント獲得</li>
            <li>ポイントは換金不可、サービス内専用です</li>
          </ul>
        </section>

        {/* 限定ptイベント */}
        <section className="mb-10">
          <h2 className="text-lg font-bold mb-3">限定ptイベント</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>管理者が特別レースイベントを開催</li>
            <li>全員に限定ptが配布され、そのptで賭けます</li>
            <li>ランキング上位を目指す期間限定イベントです</li>
          </ul>
        </section>

        {/* マイページ */}
        <section className="mb-10">
          <h2 className="text-lg font-bold mb-3">マイページ</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>収支カレンダー:</strong> 日別の収支を確認</li>
            <li><strong>詳細成績:</strong> 24場別/開催形態別の回収率・利益を確認</li>
            <li><strong>公開プロフィール:</strong> 販売した予想の成績のみ表示されます</li>
          </ul>
        </section>

        {/* その他の機能 */}
        <section className="mb-10">
          <h2 className="text-lg font-bold mb-3">その他の機能</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>ユーザー検索・フォロー</li>
            <li>ランキング（回収率 / 獲得pt / 限定pt）</li>
            <li>パスワード変更・リセット</li>
          </ul>
        </section>
      </article>
    </div>
  );
}
