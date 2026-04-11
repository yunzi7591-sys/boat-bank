# BOAT BANK

競艇（ボートレース）のガチ予想マーケットプレイス＆収支管理アプリ。

## 技術スタック
- Next.js 16 (App Router, Turbopack) / React 19 / TypeScript 5
- Prisma 6 + SQLite (dev) / Tailwind CSS 4 / shadcn/ui 3
- NextAuth v5 Beta / Zustand 5 / Framer Motion 12
- デプロイ: Vercel (https://boatbank.jp/)

## エージェントチーム

以下のスラッシュコマンドで各専門エージェントを呼び出せます:

| コマンド | ロール | 担当領域 |
|---------|--------|---------|
| `/pm` | PM/テックリード | 要件定義、タスク分解、コードレビュー、全体統括 |
| `/backend` | DB/バックエンド | スキーマ設計、API/Server Actions、認証 |
| `/frontend` | UI/UXフロントエンド | コンポーネント設計、デザイン、レスポンシブ |
| `/data` | データエンジニア | スクレイピング、データ変換、パイプライン |
| `/qa` | QA/セキュリティ | テスト、脆弱性チェック、パフォーマンス |

### 使い方
```
/pm 次に実装すべき機能を提案して
/frontend マイページのダッシュボードを改善して
/backend 予想の購入フローのServer Actionを実装して
/data オッズデータの取得ロジックを追加して
/qa 認証周りのセキュリティレビューをして
```

## プロジェクト構成
```
src/
├── app/          # ページ (App Router)
├── actions/      # Server Actions
├── components/   # UIコンポーネント
│   ├── ui/       # shadcn/uiプリミティブ
│   ├── betting/  # ベッティングUI
│   ├── dashboard/# ダッシュボード
│   ├── market/   # マーケットフィード
│   └── predictions/ # 予想表示
├── lib/          # ユーティリティ
├── store/        # Zustand ストア
└── auth.ts       # NextAuth設定
prisma/
└── schema.prisma # データモデル
```

## デザイン方針
- DESIGN.md (Stripeベース) を参照
- カラー: slate-950 (ダーク), emerald (アクセント)
- モバイルファースト (max-w-md)
- 角丸: rounded-xl ~ rounded-2xl

## 開発コマンド
```bash
npm run dev        # 開発サーバー起動
npx prisma studio  # DB GUI
npx prisma db push # スキーマ反映
npx next build     # ビルド確認
```
