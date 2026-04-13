import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, BarChart3, Trophy, CalendarDays } from "lucide-react";

export const metadata = {
  title: "使い方ガイド | BOAT BANK",
};

function Step({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex gap-5 py-5">
      <span className="text-4xl font-extralight text-[#d1d5db] leading-none select-none tabular-nums">
        {number}
      </span>
      <div className="pt-0.5">
        <h3 className="text-[15px] font-semibold text-[#061b31] mb-1">{title}</h3>
        <p className="text-sm text-[#64748d] leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function ScreenshotFrame({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="my-6 mx-auto max-w-[280px]">
      <div className="rounded-2xl overflow-hidden border border-[#e5edf5] shadow-lg">
        <Image
          src={src}
          alt={alt}
          width={390}
          height={844}
          className="w-full h-auto"
          quality={90}
        />
      </div>
      <p className="text-[11px] text-[#94a3b8] text-center mt-2">{alt}</p>
    </div>
  );
}

export default function GuidePage() {
  return (
    <div className="min-h-full bg-white px-5 py-10 max-w-xl mx-auto">
      {/* ヘッダー */}
      <header className="mb-16">
        <h1 className="text-2xl font-bold text-[#061b31] tracking-tight mb-2">
          使い方ガイド
        </h1>
        <p className="text-sm text-[#64748d] leading-relaxed">
          BOAT BANKは競艇の予想マーケットプレイス＆収支管理アプリです。
        </p>
      </header>

      {/* セクション1: 賭けを記録する */}
      <section className="mb-14">
        <h2 className="text-lg font-bold text-[#061b31] mb-1">賭けを記録する</h2>
        <p className="text-sm text-[#64748d] mb-4">レースの購入履歴を記録し、収支を自動で管理します。</p>

        <ScreenshotFrame src="/guide/home.png" alt="ホーム画面 - 全国24場の開催状況" />

        <div className="border-t border-[#e5edf5]">
          <Step
            number={1}
            title="ホームからレース場を選択"
            description="トップページの24場グリッドから、開催中のレース場をタップします。緑のラインが開催中の目印です。"
          />
          <div className="border-t border-[#f1f5f9]" />
          <Step
            number={2}
            title="「賭けを登録」をタップ"
            description="レース詳細画面の下にあるボタンから「賭けを登録（非公開）」を選択します。あなただけの収支記録用です。"
          />
        </div>

        <ScreenshotFrame src="/guide/venue.png" alt="レース場画面 - 出走表と登録ボタン" />

        <div className="border-t border-[#e5edf5]">
          <Step
            number={3}
            title="マークシートで買い目を選択し金額入力"
            description="式別（3連単など）を選び、枠番をタップして買い目を作成。金額を入力してカートに追加します。複数の買い目をまとめて登録できます。"
          />
          <div className="border-t border-[#f1f5f9]" />
          <Step
            number={4}
            title="結果は自動で判定"
            description="レース終了後、数分で結果が自動取得されます。的中・返還・不的中が判定され、マイページのカレンダーで日別の収支を確認できます。"
          />
        </div>
      </section>

      {/* セクション2: 予想を販売する */}
      <section className="mb-14">
        <h2 className="text-lg font-bold text-[#061b31] mb-1">予想を販売する</h2>
        <p className="text-sm text-[#64748d] mb-4">あなたの予想を他のユーザーに販売してポイントを獲得できます。</p>
        <div className="border-t border-[#e5edf5]">
          <Step
            number={1}
            title="「予想を販売・公開」をタップ"
            description="レース詳細画面のボタンから「予想を販売・公開」を選択します。"
          />
          <div className="border-t border-[#f1f5f9]" />
          <Step
            number={2}
            title="自サイト販売 or 他サイト誘導を選択"
            description="BOAT BANK上で直接販売するか、外部サイトへの誘導リンクを設置するかを選べます。"
          />
          <div className="border-t border-[#f1f5f9]" />
          <Step
            number={3}
            title="買い目・価格を設定して公開"
            description="マークシートで買い目を選び、タイトル・展開予想・販売価格を設定して公開します。価格を空欄にすると無料予想になります。"
          />
        </div>
      </section>

      {/* セクション3: ポイント */}
      <section className="mb-14">
        <h2 className="text-lg font-bold text-[#061b31] mb-1">ポイントの仕組み</h2>
        <p className="text-sm text-[#64748d] mb-4">ポイントはサービス内の予想売買に使用します。換金はできません。</p>
        <div className="border border-[#e5edf5] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-[#e5edf5]">
              <tr>
                <td className="px-4 py-3 text-[#061b31]">新規登録ボーナス</td>
                <td className="px-4 py-3 text-right font-semibold text-[#533afd]">5,000 pt</td>
              </tr>
              <tr>
                <td className="px-4 py-3">
                  <span className="text-[#061b31]">デイリーポイント</span>
                  <span className="block text-xs text-[#94a3b8]">毎日0時リセット / 持ち越し不可</span>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-[#533afd]">毎日 300 pt</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-[#061b31]">予想が購入された時</td>
                <td className="px-4 py-3 text-right font-semibold text-[#533afd]">販売価格分</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* セクション4: もっと使いこなす */}
      <section className="mb-14">
        <h2 className="text-lg font-bold text-[#061b31] mb-1">もっと使いこなす</h2>
        <p className="text-sm text-[#64748d] mb-4">収支管理以外にも便利な機能があります。</p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-2xl overflow-hidden border border-[#e5edf5] shadow-md">
            <Image src="/guide/ranking.png" alt="ランキング" width={390} height={844} className="w-full h-auto" quality={90} />
          </div>
          <div className="rounded-2xl overflow-hidden border border-[#e5edf5] shadow-md">
            <Image src="/guide/events.png" alt="限定ptイベント" width={390} height={844} className="w-full h-auto" quality={90} />
          </div>
        </div>

        <div className="border-t border-[#e5edf5] divide-y divide-[#f1f5f9]">
          <Link
            href="/mypage/venues"
            className="flex items-center gap-4 py-4 group"
          >
            <BarChart3 className="w-5 h-5 text-[#94a3b8] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold text-[#061b31] group-hover:text-[#533afd] transition-colors">
                詳細成績
              </p>
              <p className="text-sm text-[#64748d]">
                24場別・時間帯別の回収率と利益を確認
              </p>
            </div>
            <span className="text-[#c4cdd5] text-sm shrink-0">&rarr;</span>
          </Link>
          <Link
            href="/ranking"
            className="flex items-center gap-4 py-4 group"
          >
            <Trophy className="w-5 h-5 text-[#94a3b8] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold text-[#061b31] group-hover:text-[#533afd] transition-colors">
                ランキング
              </p>
              <p className="text-sm text-[#64748d]">
                回収率・獲得pt・限定ptの3種類のランキング
              </p>
            </div>
            <span className="text-[#c4cdd5] text-sm shrink-0">&rarr;</span>
          </Link>
          <Link
            href="/events"
            className="flex items-center gap-4 py-4 group"
          >
            <CalendarDays className="w-5 h-5 text-[#94a3b8] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold text-[#061b31] group-hover:text-[#533afd] transition-colors">
                限定ptイベント
              </p>
              <p className="text-sm text-[#64748d]">
                SG等の特別レース開催時に全員参加のポイントバトル
              </p>
            </div>
            <span className="text-[#c4cdd5] text-sm shrink-0">&rarr;</span>
          </Link>
        </div>
      </section>

      {/* フッター */}
      <footer className="border-t border-[#e5edf5] pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#64748d] hover:text-[#533afd] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          ホームに戻る
        </Link>
      </footer>
    </div>
  );
}
