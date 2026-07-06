"use client";

import { useEffect, useState } from "react";
import { isNativeApp } from "@/lib/platform";

/**
 * ホーム下部のSEO向けサービス説明。
 * Web（boatbank.jp）では検索対策として残し、アプリ（iOS/Android）では非表示にする。
 * SSR時は表示された状態でHTMLに含まれるため、Googleのクロールには影響しない。
 */
export function HomeSeoSection() {
    const [native, setNative] = useState(false);

    useEffect(() => {
        setNative(isNativeApp());
    }, []);

    if (native) return null;

    return (
        <section className="mt-10 px-4 max-w-2xl mx-auto text-[#334155]">
            <h1 className="text-lg font-black text-[#061b31] mb-3">
                競艇の収支管理アプリ「BOAT BANK」
            </h1>
            <p className="text-xs leading-relaxed mb-5">
                BOAT BANK（ボートバンク）は、競艇（ボートレース）の舟券の収支を自動で記録・管理できるアプリです。買い目と金額を登録するだけで、回収率・的中率・累計収支が自動で計算され、全24場ごとの成績まで一目でわかります。「なんとなく勝っている気がする」を、正確な数字に変える。負けている場所が分かって初めて、勝てる場所で戦えるようになります。基本無料で始められ、iPhone・Android・Webブラウザから使えます。
            </p>

            <h2 className="text-sm font-black text-[#061b31] mb-2">収支管理でできること</h2>
            <ul className="text-xs leading-relaxed mb-5 space-y-1.5 list-disc pl-4">
                <li>24場ごとの<strong>回収率・収支を自動集計</strong>。得意な場・苦手な場が数字で分かる</li>
                <li>月別カレンダーで、日々の収支をプラス・マイナスで<strong>色分け表示</strong></li>
                <li><strong>収益推移グラフ</strong>で、累計収支が右肩上がりか下がりかを一目で把握</li>
                <li><strong>グレード別（一般〜SG）・時間帯別（モーニング〜ミッドナイト）・期間別（通算／年／月）</strong>に絞り込んで、勝てる条件を分析</li>
                <li>回収率・的中率まで公開された予想家の買い目を売買できる予想マーケットプレイス</li>
            </ul>

            <h2 className="text-sm font-black text-[#061b31] mb-2">よくある質問</h2>
            <div className="text-xs leading-relaxed space-y-3">
                <div>
                    <p className="font-bold text-[#061b31]">Q. 競艇の収支を自動で管理できますか？</p>
                    <p>A. はい。買い目と金額を登録すれば、回収率・的中率・累計収支が自動で計算されます。手書きや表計算で集計する必要はありません。</p>
                </div>
                <div>
                    <p className="font-bold text-[#061b31]">Q. 無料で使えますか？</p>
                    <p>A. 収支管理の基本機能は無料でお使いいただけます。24場ごとの詳細分析などが使えるスタンダードプラン（月額）は初月無料でお試しいただけます。</p>
                </div>
                <div>
                    <p className="font-bold text-[#061b31]">Q. スマホアプリはありますか？</p>
                    <p>A. iPhone・Android向けアプリに加え、Webブラウザからもご利用いただけます。</p>
                </div>
            </div>
        </section>
    );
}
