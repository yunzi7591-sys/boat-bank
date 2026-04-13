import Link from "next/link";

export const metadata = {
  title: "使い方ガイド | BOAT BANK",
};

function StepCard({ step, title, description, children }: { step: number; title: string; description: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 bg-[#533afd] text-white rounded-lg flex items-center justify-center font-black text-sm shrink-0">{step}</div>
        <h3 className="text-base font-bold text-[#061b31]">{title}</h3>
      </div>
      <p className="text-sm text-[#64748d] mb-3 leading-relaxed">{description}</p>
      {children}
    </div>
  );
}

function MockScreen({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="bg-[#f8fafc] border border-[#e5edf5] rounded-lg p-3 my-3">
      {label && <p className="text-[9px] font-bold text-[#533afd] mb-2 uppercase tracking-wider">{label}</p>}
      {children}
    </div>
  );
}

export default function GuidePage() {
  return (
    <div className="min-h-full bg-white px-4 py-8 max-w-2xl mx-auto">
      <Link href="/" className="text-xs text-[#533afd] hover:underline inline-block mb-6">
        ← トップに戻る
      </Link>

      {/* ヒーロー */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 mb-3">
          <span className="bg-[#533afd] text-white font-black text-lg px-3 py-1 rounded-lg">BOAT</span>
          <span className="font-extrabold text-xl text-[#061b31]">BANK</span>
        </div>
        <h1 className="text-xl font-bold text-[#061b31] mb-2">使い方ガイド</h1>
        <p className="text-sm text-[#64748d]">競艇の収支管理＆予想マーケットプレイス</p>
        <p className="text-[10px] text-[#94a3b8] mt-2">※ ボートレース公式とは無関係のサービスです</p>
      </div>

      {/* ========== 自分の賭けを記録する ========== */}
      <section className="mb-12">
        <div className="bg-[#533afd]/5 border border-[#533afd]/20 rounded-lg px-4 py-2 mb-6">
          <h2 className="text-base font-bold text-[#533afd]">🎯 賭けを記録して収支を管理する</h2>
        </div>

        <StepCard step={1} title="ホームからレース場を選ぶ" description="トップページの24場グリッドから、今日開催中のレース場をタップします。">
          <MockScreen label="ホーム画面イメージ">
            <div className="grid grid-cols-4 gap-1">
              {["桐生", "戸田", "江戸川", "平和島"].map(v => (
                <div key={v} className="bg-white border border-slate-200 rounded p-1.5 text-center">
                  <div className="h-[2px] bg-emerald-500 rounded-full mb-1" />
                  <span className="text-[10px] font-bold">{v}</span>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-[#64748d] mt-2">💡 上の緑ラインが開催中の目印です</p>
          </MockScreen>
        </StepCard>

        <StepCard step={2} title="「賭けを登録（非公開）」をタップ" description="レース詳細画面の下にある2つのボタンのうち、右側をタップします。これはあなただけの収支記録用です。">
          <MockScreen label="レース詳細画面イメージ">
            <div className="flex gap-2">
              <div className="flex-1 bg-[#533afd] text-white rounded-lg p-2 text-center">
                <p className="text-[10px] font-bold">予想を販売・公開</p>
              </div>
              <div className="flex-1 bg-white border-2 border-[#533afd] rounded-lg p-2 text-center">
                <p className="text-[10px] font-bold text-[#061b31]">👈 賭けを登録（非公開）</p>
              </div>
            </div>
          </MockScreen>
        </StepCard>

        <StepCard step={3} title="マークシートで買い目を選ぶ" description="式別（3連単など）を選び、1着・2着・3着の枠番をタップ。ボートレースと同じ要領で選べます。">
          <MockScreen label="マークシートイメージ">
            <div className="flex gap-1 mb-2">
              {["3連単", "3連複", "2連単", "2連複", "単勝"].map((t, i) => (
                <div key={t} className={`flex-1 py-1 text-[9px] font-bold rounded text-center ${i === 0 ? 'bg-[#533afd] text-white' : 'bg-slate-100 text-slate-400'}`}>{t}</div>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-1 text-center text-[9px]">
              <div className="font-bold text-[#64748d]">枠</div>
              <div className="font-bold text-[#64748d]">1着</div>
              <div className="font-bold text-[#64748d]">2着</div>
              <div className="font-bold text-[#64748d]">3着</div>
              {[1,2,3].map(n => (
                <>
                  <div key={`n${n}`} className={`font-black ${n === 1 ? 'text-white bg-white border' : n === 2 ? 'text-white bg-slate-900' : 'text-white bg-red-600'} rounded p-1`}>{n}</div>
                  <div key={`1-${n}`} className={`rounded p-1 ${n === 1 ? 'bg-[#533afd]/20 text-[#533afd]' : 'border border-slate-200'}`}>{n === 1 ? '●' : '○'}</div>
                  <div key={`2-${n}`} className={`rounded p-1 ${n === 2 ? 'bg-[#533afd]/20 text-[#533afd]' : 'border border-slate-200'}`}>{n === 2 ? '●' : '○'}</div>
                  <div key={`3-${n}`} className={`rounded p-1 ${n === 3 ? 'bg-[#533afd]/20 text-[#533afd]' : 'border border-slate-200'}`}>{n === 3 ? '●' : '○'}</div>
                </>
              ))}
            </div>
            <p className="text-[9px] text-[#64748d] mt-2">💡 同じ枠番を複数着に選べるのでBOXや折り返しもOK</p>
          </MockScreen>
        </StepCard>

        <StepCard step={4} title="金額を入力してカートに追加" description="1点あたりの金額を入力し「カートに追加」をタップ。複数の買い目を追加できます。">
          <MockScreen label="金額入力イメージ">
            <div className="flex items-center gap-1 bg-white rounded border border-[#e5edf5] p-2">
              <span className="text-lg font-bold text-[#061b31]">10</span>
              <span className="text-sm font-bold text-[#64748d]">00円</span>
            </div>
            <p className="text-[9px] text-[#64748d] mt-1">💡 「10」と入力 → 1,000円になります</p>
          </MockScreen>
        </StepCard>

        <StepCard step={5} title="結果は自動判定！" description="レース終了後、数分で結果が自動取得され、的中・返還・不的中が判定されます。マイページのカレンダーで日別の収支を確認できます。">
          <MockScreen label="カレンダーイメージ">
            <div className="grid grid-cols-7 gap-1 text-center text-[9px]">
              {["日","月","火","水","木","金","土"].map(d => <div key={d} className="font-bold text-[#64748d]">{d}</div>)}
              {[1,2,3,4,5,6,7].map(d => (
                <div key={d} className="p-1">
                  <span className="text-[10px]">{d}</span>
                  {d === 3 && <div className="text-[8px] font-bold text-[#533afd]">+5千</div>}
                  {d === 5 && <div className="text-[8px] font-bold text-[#ea2261]">-2千</div>}
                </div>
              ))}
            </div>
          </MockScreen>
        </StepCard>
      </section>

      {/* ========== 予想を販売する ========== */}
      <section className="mb-12">
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-6">
          <h2 className="text-base font-bold text-amber-800">💰 予想を販売してポイントを稼ぐ</h2>
        </div>

        <StepCard step={1} title="「予想を販売・公開」をタップ" description="レース詳細画面の左側のボタンをタップ。「自サイトで販売」か「他サイトへ誘導」を選べます。" />

        <StepCard step={2} title="買い目と価格を設定" description="マークシートで買い目を選び、タイトル・展開予想（任意）・販売価格を設定して公開します。">
          <MockScreen label="販売設定イメージ">
            <div className="space-y-2">
              <div className="bg-white border border-[#e5edf5] rounded p-2">
                <span className="text-[9px] text-[#64748d]">タイトル</span>
                <p className="text-xs font-bold">本命1号艇から手堅く</p>
              </div>
              <div className="bg-white border border-[#e5edf5] rounded p-2 flex items-center gap-1">
                <span className="text-[9px] text-[#64748d]">販売価格</span>
                <span className="text-sm font-bold">1</span>
                <span className="text-xs text-[#64748d]">00 pt</span>
              </div>
            </div>
            <p className="text-[9px] text-[#64748d] mt-2">💡 空欄にすると無料予想になります</p>
          </MockScreen>
        </StepCard>

        <StepCard step={3} title="購入されるとポイントGET" description="他のユーザーがあなたの予想を購入すると、設定した価格分のポイントが入ります。マーケットや検索で表示されます。" />
      </section>

      {/* ========== ポイント ========== */}
      <section className="mb-12">
        <div className="bg-[#f6f8fa] border border-[#e5edf5] rounded-lg px-4 py-2 mb-6">
          <h2 className="text-base font-bold text-[#061b31]">🪙 ポイントの仕組み</h2>
        </div>

        <div className="bg-white border border-[#e5edf5] rounded-lg divide-y divide-[#e5edf5]">
          <div className="p-3 flex justify-between items-center">
            <span className="text-sm text-[#061b31]">新規登録ボーナス</span>
            <span className="text-sm font-bold text-[#533afd]">5,000pt</span>
          </div>
          <div className="p-3 flex justify-between items-center">
            <div>
              <span className="text-sm text-[#061b31]">デイリーポイント</span>
              <p className="text-[10px] text-[#64748d]">毎日0時リセット・持ち越し不可</p>
            </div>
            <span className="text-sm font-bold text-[#533afd]">毎日 300pt</span>
          </div>
          <div className="p-3 flex justify-between items-center">
            <span className="text-sm text-[#061b31]">予想が購入された時</span>
            <span className="text-sm font-bold text-[#533afd]">販売価格分</span>
          </div>
          <div className="p-3">
            <p className="text-[10px] text-[#ea2261] font-bold">⚠️ ポイントは換金できません。サービス内の予想売買専用です。</p>
          </div>
        </div>
      </section>

      {/* ========== 限定ptイベント ========== */}
      <section className="mb-12">
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-6">
          <h2 className="text-base font-bold text-amber-800">🏆 限定ptイベント</h2>
        </div>
        <p className="text-sm text-[#64748d] mb-3 leading-relaxed">
          SG等の特別レース開催時に、全員に限定ポイントが配布されるイベントです。
          限定ptを使って対象レースに賭け、<strong>イベント終了時にポイントを一番増やした人が優勝！</strong>
        </p>
        <div className="bg-[#f8fafc] border border-[#e5edf5] rounded-lg p-3">
          <p className="text-[10px] text-[#64748d]">💡 ランキングページの「限定pt」タブで順位を確認できます</p>
          <p className="text-[10px] text-[#64748d]">💡 途中参加もOK！ログインするだけで自動参加します</p>
        </div>
      </section>

      {/* ========== その他 ========== */}
      <section className="mb-12">
        <div className="bg-[#f6f8fa] border border-[#e5edf5] rounded-lg px-4 py-2 mb-6">
          <h2 className="text-base font-bold text-[#061b31]">📱 その他の機能</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-lg">📊</span>
            <div>
              <p className="text-sm font-bold text-[#061b31]">詳細成績</p>
              <p className="text-xs text-[#64748d]">24場別・モーニング/デイ/ナイター/ミッドナイト別の回収率と利益</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">👥</span>
            <div>
              <p className="text-sm font-bold text-[#061b31]">検索・フォロー</p>
              <p className="text-xs text-[#64748d]">他のユーザーを検索してフォロー。マーケットでフォロー中の予想をチェック</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🏅</span>
            <div>
              <p className="text-sm font-bold text-[#061b31]">ランキング</p>
              <p className="text-xs text-[#64748d]">回収率・獲得pt・限定ptの3種類。場ごとのフィルタも可能</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">📅</span>
            <div>
              <p className="text-sm font-bold text-[#061b31]">収支カレンダー</p>
              <p className="text-xs text-[#64748d]">日付タップでその日のレース別収支を確認。月間サマリーと収益推移グラフ付き</p>
            </div>
          </div>
        </div>
      </section>

      {/* フッター */}
      <div className="text-center pt-6 border-t border-[#e5edf5]">
        <p className="text-xs text-[#64748d] mb-3">わからないことがあればお気軽にお問い合わせください</p>
        <Link href="/" className="inline-block bg-[#533afd] text-white font-bold text-sm px-6 py-2.5 rounded-lg hover:bg-[#4434d4] transition-colors">
          ホームに戻る
        </Link>
      </div>
    </div>
  );
}
