// ギャンブラー診断（/shindan）のデータ定義
// 3軸 × 10問 = 30問 → 2^3 = 8タイプ判定
//
// 軸1 style:  D(データ派) ↔ I(直感派)
// 軸2 target: H(本命党)   ↔ A(穴党)
// 軸3 risk:   S(堅実)     ↔ G(一発勝負)

export type Axis = "style" | "target" | "risk";
export type Pole = "D" | "I" | "H" | "A" | "S" | "G";

export interface ShindanQuestion {
    axis: Axis;
    text: string;
    options: { text: string; pole: Pole }[];
}

export interface ShindanType {
    slug: string;
    code: string; // 例: "DHS"
    name: string;
    catch: string;
    color: string;      // テーマカラー
    colorDark: string;  // グラデーション用の濃色
    description: string[];
    strengths: string[];
    weaknesses: string[];
    strategy: string;
    boatbank: string;
    goodPartner: string; // slug
    badPartner: string;  // slug
}

export const QUESTIONS: ShindanQuestion[] = [
    // ---- 軸1: データ派(D) ↔ 直感派(I) ----
    {
        axis: "style",
        text: "買い目を決める時、最初に見るのは？",
        options: [
            { text: "出走表と選手のデータ", pole: "D" },
            { text: "選手の顔つきとその日の雰囲気", pole: "I" },
        ],
    },
    {
        axis: "style",
        text: "レース前の展示航走（試走）は？",
        options: [
            { text: "タイムを必ずチェックする", pole: "D" },
            { text: "見た目の勢いと気配で判断する", pole: "I" },
        ],
    },
    {
        axis: "style",
        text: "予想が当たった時、その理由を…",
        options: [
            { text: "だいたい説明できる", pole: "D" },
            { text: "「来る気がした」としか言えない", pole: "I" },
        ],
    },
    {
        axis: "style",
        text: "負けが続いた時は？",
        options: [
            { text: "冷静に敗因を分析する", pole: "D" },
            { text: "流れが悪い。一旦離れて運気を変える", pole: "I" },
        ],
    },
    {
        axis: "style",
        text: "「なんか今日は3号艇が来る気がする」",
        options: [
            { text: "その感覚、大事にする", pole: "I" },
            { text: "気のせい。根拠がない", pole: "D" },
        ],
    },
    {
        axis: "style",
        text: "レース直前のオッズの動きは？",
        options: [
            { text: "必ず確認する。大事な情報源", pole: "D" },
            { text: "あまり気にしない", pole: "I" },
        ],
    },
    {
        axis: "style",
        text: "初めて行く競艇場では？",
        options: [
            { text: "現地の空気を感じてから決める", pole: "I" },
            { text: "水面の特徴やコース別データを事前に調べる", pole: "D" },
        ],
    },
    {
        axis: "style",
        text: "自分の的中・不的中の記録は？",
        options: [
            { text: "つけている（つけたいと思っている）", pole: "D" },
            { text: "正直、覚えていない", pole: "I" },
        ],
    },
    {
        axis: "style",
        text: "人の予想を見た時、まず気になるのは？",
        options: [
            { text: "「根拠は何？」", pole: "D" },
            { text: "「この人、当ててそうかどうか」", pole: "I" },
        ],
    },
    {
        axis: "style",
        text: "「モーター2連対率」という言葉に…",
        options: [
            { text: "ピンとくる。むしろ大好物", pole: "D" },
            { text: "よくわからない。見たことない", pole: "I" },
        ],
    },

    // ---- 軸2: 本命党(H) ↔ 穴党(A) ----
    {
        axis: "target",
        text: "1号艇が圧倒的1番人気。あなたは？",
        options: [
            { text: "素直に軸にする", pole: "H" },
            { text: "崩れる前提でおいしい目を探す", pole: "A" },
        ],
    },
    {
        axis: "target",
        text: "オッズ1.5倍の鉄板レース。",
        options: [
            { text: "厚めに買って堅く取る", pole: "H" },
            { text: "面白くないので見送るか、裏を狙う", pole: "A" },
        ],
    },
    {
        axis: "target",
        text: "理想の的中スタイルは？",
        options: [
            { text: "誰も買っていない大穴を仕留める", pole: "A" },
            { text: "堅い予想をコツコツ当て続ける", pole: "H" },
        ],
    },
    {
        axis: "target",
        text: "「万舟券（配当100倍超え）」と聞くと？",
        options: [
            { text: "夢はあるけど、現実的じゃない", pole: "H" },
            { text: "血が騒ぐ", pole: "A" },
        ],
    },
    {
        axis: "target",
        text: "「6号艇の一発があるかも」と思ったら？",
        options: [
            { text: "押さえ程度にとどめる", pole: "H" },
            { text: "むしろ本線に据える", pole: "A" },
        ],
    },
    {
        axis: "target",
        text: "的中率と回収率、大事なのは？",
        options: [
            { text: "コツコツ当てたい。的中率", pole: "H" },
            { text: "一発で取り返す。回収率", pole: "A" },
        ],
    },
    {
        axis: "target",
        text: "荒れることで有名な競艇場（戸田・平和島など）は？",
        options: [
            { text: "むしろ大好物", pole: "A" },
            { text: "正直、手を出しにくい", pole: "H" },
        ],
    },
    {
        axis: "target",
        text: "人気薄の選手が「調子いい」とコメント。",
        options: [
            { text: "参考程度に聞いておく", pole: "H" },
            { text: "それ、買う理由になる", pole: "A" },
        ],
    },
    {
        axis: "target",
        text: "順当な結果で終わるレースは？",
        options: [
            { text: "ありがたい。ごちそう", pole: "H" },
            { text: "退屈", pole: "A" },
        ],
    },
    {
        axis: "target",
        text: "友達に自慢したいのは？",
        options: [
            { text: "月間プラス収支の実績", pole: "H" },
            { text: "万舟的中のスクショ", pole: "A" },
        ],
    },

    // ---- 軸3: 堅実(S) ↔ 一発勝負(G) ----
    {
        axis: "risk",
        text: "軍資金1万円。どう使う？",
        options: [
            { text: "数レースに分けて少しずつ", pole: "S" },
            { text: "勝負レースにまとめて張る", pole: "G" },
        ],
    },
    {
        axis: "risk",
        text: "2連勝した直後。次のレースは？",
        options: [
            { text: "波に乗って賭け金を増やす", pole: "G" },
            { text: "調子が良くても賭け金は変えない", pole: "S" },
        ],
    },
    {
        axis: "risk",
        text: "最終レース前で収支マイナス。",
        options: [
            { text: "深追いしない。今日はここまで", pole: "S" },
            { text: "最終レースで取り返しに行く", pole: "G" },
        ],
    },
    {
        axis: "risk",
        text: "買い目の点数は？",
        options: [
            { text: "自信のある目に絞って少なく", pole: "G" },
            { text: "手広く流して取りこぼしを防ぐ", pole: "S" },
        ],
    },
    {
        axis: "risk",
        text: "「ここだ」というレースに出会ったら？",
        options: [
            { text: "それでも予算の範囲内で", pole: "S" },
            { text: "限界まで勝負する", pole: "G" },
        ],
    },
    {
        axis: "risk",
        text: "ギャンブルで一番怖いのは？",
        options: [
            { text: "コツコツ積んだものを一日で失うこと", pole: "S" },
            { text: "チャンスに張れずに後悔すること", pole: "G" },
        ],
    },
    {
        axis: "risk",
        text: "負けた日の帰り道に思うのは？",
        options: [
            { text: "「予算内で遊べたからOK」", pole: "S" },
            { text: "「あそこでもっと張っていれば…」", pole: "G" },
        ],
    },
    {
        axis: "risk",
        text: "臨時収入が入った日。",
        options: [
            { text: "いつもより勝負したくなる", pole: "G" },
            { text: "舟券の予算は普段と同じ", pole: "S" },
        ],
    },
    {
        axis: "risk",
        text: "賭け金の管理は？",
        options: [
            { text: "月の上限を決めている", pole: "S" },
            { text: "その日の気分と流れで決める", pole: "G" },
        ],
    },
    {
        axis: "risk",
        text: "あなたにとってギャンブルは？",
        options: [
            { text: "長く楽しむ趣味", pole: "S" },
            { text: "人生を変えるかもしれない勝負の場", pole: "G" },
        ],
    },
];

export const TYPES: ShindanType[] = [
    {
        slug: "shokunin",
        code: "DHS",
        name: "データ職人型",
        catch: "感情を挟まない、静かなる回収率マシーン",
        color: "#2563eb",
        colorDark: "#1e3a8a",
        description: [
            "出走表・モーター成績・コース別データを読み込んでから舟券を買う、生粋の分析派。",
            "「なんとなく」で買うことはほぼなく、当たっても外れても理由を説明できるのが強み。",
            "周りが万舟に沸いていても動じない。あなたの戦場は1レースではなく、月間収支です。",
        ],
        strengths: ["負けにくい買い方ができる", "感情に流されない", "長期的にプラスを狙える思考"],
        weaknesses: ["石橋を叩きすぎて妙味を逃すことがある", "分析に時間をかけすぎて締切に間に合わないことも"],
        strategy: "本命軸の2〜3連単をデータで絞り、点数を抑えて回収率を最大化するスタイルが最適。",
        boatbank: "あなたの武器は「記録」。BOAT BANKの収支管理なら回収率・的中率が全自動で集計されるので、分析家のあなたに一番刺さるはずです。",
        goodPartner: "ishibashi",
        badPartner: "banshou",
    },
    {
        slug: "sniper",
        code: "DHG",
        name: "一撃スナイパー型",
        catch: "狙いを定めたら、外さない。勝負師の目を持つ分析家",
        color: "#334155",
        colorDark: "#0f172a",
        description: [
            "普段は冷静にデータを読み、確信が持てるレースが来るまで撃たないタイプ。",
            "「このレースは獲れる」と判断した瞬間の集中力と張りの太さは全タイプ随一。",
            "数より質。1日1レースしか買わない日があっても、それがあなたの勝ち方です。",
        ],
        strengths: ["勝負どころの見極めが鋭い", "無駄な舟券を買わない", "ここ一番の集中力"],
        weaknesses: ["外した時のダメージが大きい", "確信を待ちすぎてチャンスを見送ることも"],
        strategy: "勝負レースを絞り、本命軸の厚張り。買わない勇気こそ最大の武器。",
        boatbank: "その「狙い撃ち」の腕、公開しないのはもったいない。BOAT BANKで予想を公開すれば、的中実績と回収率が数字で証明されます。",
        goodPartner: "hunter",
        badPartner: "yumeoi",
    },
    {
        slug: "hunter",
        code: "DAS",
        name: "穴ハンター型",
        catch: "オッズの歪みを見逃さない、冷静な一匹狼",
        color: "#16a34a",
        colorDark: "#14532d",
        description: [
            "データを読み込んだ上で、あえて人気薄を狙う玄人スタイル。",
            "「この6号艇、オッズほど弱くない」——そんなオッズと実力のズレを探すのが生きがい。",
            "堅実な資金管理で穴を待ち続けられる忍耐力は、実は全タイプで最も職人気質かもしれません。",
        ],
        strengths: ["妙味のある買い目を見つける嗅覚", "外れても崩れない資金管理", "人と逆を張れる胆力"],
        weaknesses: ["的中率が低く我慢の時間が長い", "たまに深読みしすぎて素直な本命を取りこぼす"],
        strategy: "少額で期待値の高い中穴〜大穴を狙い続けるスタイル。数レース外れても1発で回収するのが本領。",
        boatbank: "穴狙いこそ記録が命。BOAT BANKの収支管理で「我慢が報われているか」を数字で確認しながら戦えます。24場のレース情報もチェックし放題。",
        goodPartner: "sniper",
        badPartner: "nekketsu",
    },
    {
        slug: "kitaichi",
        code: "DAG",
        name: "期待値ギャンブラー型",
        catch: "計算ずくで大勝負。理論派のくせに博打好き",
        color: "#ea580c",
        colorDark: "#7c2d12",
        description: [
            "頭はデータ派、心臓はギャンブラー。期待値がプラスと判断したら大きく張れる合理的リスクテイカー。",
            "「確率20%でもオッズ10倍なら買い」という思考ができる、ある意味最も投資家に近いタイプ。",
            "ただし計算が合っている時のあなたは強いが、熱くなった時のあなたは計算式を忘れがち。",
        ],
        strengths: ["リスクとリターンを天秤にかけられる", "大勝ちの経験値が多い", "決断が速い"],
        weaknesses: ["資金の波が激しい", "負けが込むと「取り返しの計算」を始めてしまう"],
        strategy: "期待値重視の中穴勝負。1日の損切りラインだけは先に決めておくと無敵。",
        boatbank: "その期待値感覚が本物か、BOAT BANKの自動収支管理で答え合わせを。回収率が数字で出るので、理論の検証にはうってつけです。",
        goodPartner: "hunter",
        badPartner: "ishibashi",
    },
    {
        slug: "ishibashi",
        code: "IHS",
        name: "石橋フィーリング型",
        catch: "直感で選んで、慎重に張る。負けない癒し系",
        color: "#0891b2",
        colorDark: "#164e63",
        description: [
            "細かいデータより「今日はこの選手が来そう」という感覚を信じるタイプ。ただし張り方はあくまで慎重。",
            "本命中心・少額で長く楽しむスタイルなので、大負けした記憶がほとんどないはず。",
            "ギャンブルとの距離感が一番健全で、実は周りから羨ましがられる存在です。",
        ],
        strengths: ["大負けしない", "楽しむ心を忘れない", "直感が当たる日は連鎖する"],
        weaknesses: ["せっかくの直感に小さくしか張れない", "記録を取らないので成長が緩やか"],
        strategy: "本命サイドの2連単・3連複を少点数で。直感が冴えている日だけ少し増やすのが吉。",
        boatbank: "まずはBOAT BANKの無料予想で腕試しを。毎日もらえるポイントで遊べるので、あなたの「健全な楽しみ方」とそのまま相性抜群です。",
        goodPartner: "shokunin",
        badPartner: "kitaichi",
    },
    {
        slug: "nekketsu",
        code: "IHG",
        name: "熱血ストレート型",
        catch: "好きな選手に、まっすぐ全力。競艇は情熱だ",
        color: "#dc2626",
        colorDark: "#7f1d1d",
        description: [
            "推し選手・好きな決まり手・「今日は行ける」という気持ち。あなたの舟券には物語があります。",
            "調子に乗った時の爆発力は本物で、勢いに乗ると誰にも止められません。",
            "ただし「熱くなったら倍プッシュ」の癖だけは、財布が泣いているかもしれない。",
        ],
        strengths: ["レースを全力で楽しめる", "勢いに乗った時の爆発力", "推しへの愛と情報量"],
        weaknesses: ["負けると熱くなって深追いしがち", "冷静な日と熱い日の収支差が激しい"],
        strategy: "応援買いは「楽しむ枠」として予算を分けるのがコツ。勝負は勢いのある日に集中。",
        boatbank: "熱いあなたにこそ収支の「見える化」を。BOAT BANKなら今月の収支がひと目でわかるので、熱くなりすぎた日のブレーキになってくれます。",
        goodPartner: "banshou",
        badPartner: "shokunin",
    },
    {
        slug: "yumeoi",
        code: "IAS",
        name: "ロマン積立型",
        catch: "夢は万舟。でも張るのは、ちょっとだけ",
        color: "#db2777",
        colorDark: "#831843",
        description: [
            "毎回コツコツ少額で大穴を買い続ける、夢の積立投資家。",
            "「当たったら旅行に行く」——そんな妄想込みで楽しめるのがあなたの才能です。",
            "外れても痛くない金額しか張らないので、実はダメージ管理の達人。あとは当たる日を待つだけ。",
        ],
        strengths: ["損失が小さく長く続けられる", "夢を楽しむ才能", "当たった時の喜びが人一倍"],
        weaknesses: ["トータルでは負けやすい買い方", "本命で堅く獲るのが苦手"],
        strategy: "大穴少額買いは継続が命。たまにデータも見ると「夢の的中率」が上がります。",
        boatbank: "BOAT BANKなら毎日無料ポイントがもらえるので、夢の大穴チャレンジがノーリスクで続けられます。穴党の予想家をフォローするのも近道。",
        goodPartner: "banshou",
        badPartner: "sniper",
    },
    {
        slug: "banshou",
        code: "IAG",
        name: "万舟ドリーマー型",
        catch: "狙うは常に一攫千金。生粋のロマン砲",
        color: "#ca8a04",
        colorDark: "#713f12",
        description: [
            "直感で大穴に大きく張れる、全タイプ中もっともギャンブラーらしいギャンブラー。",
            "当たれば伝説、外れれば爆死。それでも「次は来る」と思える心臓の強さは天性のものです。",
            "あなたの的中報告はSNSで一番バズるタイプ。ただし財布のHPには常に注意。",
        ],
        strengths: ["夢を掴んだ時のリターンが桁違い", "度胸とメンタルの強さ", "話のネタに事欠かない"],
        weaknesses: ["資金が溶けるスピードも桁違い", "「次で取り返す」が口癖になりがち"],
        strategy: "軍資金を先に分けて「今日はここまで」を徹底するだけで、伝説の的中まで生き残れる確率が跳ね上がります。",
        boatbank: "一撃の夢はそのままに、まずは収支の見える化から。BOAT BANKの収支管理と毎日の無料ポイントで、財布を守りながら夢を追えます。",
        goodPartner: "nekketsu",
        badPartner: "shokunin",
    },
];

/** 回答の配列（各質問で選んだ pole）からタイプを判定する */
export function calcType(poles: Pole[]): ShindanType {
    const count: Record<Pole, number> = { D: 0, I: 0, H: 0, A: 0, S: 0, G: 0 };
    for (const p of poles) count[p]++;
    // 同点の場合は後者（I/A/G）に倒す（診断として面白い側）
    const code =
        (count.D > count.I ? "D" : "I") +
        (count.H > count.A ? "H" : "A") +
        (count.S > count.G ? "S" : "G");
    return TYPES.find(t => t.code === code)!;
}

export function getTypeBySlug(slug: string): ShindanType | undefined {
    return TYPES.find(t => t.slug === slug);
}
