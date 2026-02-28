# BOAT BANK

BOAT BANKは、ボートレースの予想をポートフォリオのように管理・販売できる、モダンな金融アプリ風のWebプラットフォームです。

## 本番公開（Vercelへのデプロイ）の手順

本アプリケージョンは [Next.js](https://nextjs.org) + [Prisma](https://www.prisma.io) + PostgreSQL の構成で構築されており、[Vercel](https://vercel.com) へのデプロイに最適化されています。以下の手順に沿って本番環境を構築してください。

### A. GitHubへのリポジトリ作成とプッシュ

1. プロジェクトのルートディレクトリでGitが初期化されていることを確認します（まだの場合は `git init`）。
2. GitHubに新しいパブリックまたはプライベートのリポジトリを作成します。
3. リポジトリのURLをリモートとして追加し、コードをプッシュします。
   ```bash
   git remote add origin https://github.com/あなたのユーザー名/リポジトリ名.git
   git branch -M main
   git push -u origin main
   ```

### B. Supabase（またはNeon）でのPostgreSQLデータベース作成

SQLiteからPostgreSQLへとスキーマをアップグレードしています。
ここでは無料枠が充実している [Supabase](https://supabase.com/) を例にします。

1. Supabaseで新しいプロジェクトを作成します。
2. 作成後、「Project Settings」 > 「Database」へ進み、**Connection string (URI)** をコピーします。
3. URI内のパスワード部分 `[YOUR-PASSWORD]` を作成時に設定したものに置き換えます。これが `DATABASE_URL` となります。

### C. Vercelへの連携・デプロイと環境変数設定

1. [Vercel](https://vercel.com) にログインし、「Add New...」>「Project」を選択します。
2. Step Aで作成したGitHubリポジトリをインポートします。
3. デプロイ設定画面の「Environment Variables」を開き、`.env.example` を参考に以下の環境変数を設定します。
   - `DATABASE_URL`: Step Bで取得したデータベースのURL
   - `AUTH_SECRET`: `npx auth secret` で生成したランダムな文字列（デプロイ後のセッション暗号化用）
   - `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`: GitHub OAuth設定等で取得したもの（設定している場合）
   - `BOATRACE_API_URL`: ボートレース連携APIのURL
   - `CRON_SECRET`: Vercel Cronでバッチ処理を保護するための任意のパスワード
4. 「Deploy」ボタンをクリックして初回デプロイを開始します。
   *(※ 初回はデータベースのテーブルが存在しないためデプロイ後のアクセス時にエラーになる可能性がありますが、Step Dで解消します)*

### D. 本番データベースへのスキーマ反映（db push）

Vercelにコードが配置されただけではデータベースのテーブルが作成されていません。
ローカルマシンのターミナルから、本番データベースに接続してスキーマを反映（Push）します。

1. ローカルの `.env` の `DATABASE_URL` を、**一時的にSupabaseの本番URLに変更**します。
   *(※ トラブルを防ぐため、元のSQLiteのURLはコメントアウトなどで残しておいてください)*
2. 以下のコマンドを実行して、本番環境のデータベースを構築します。
   ```bash
   npx prisma db push
   ```
   > ⚠️ 注意: `db push` によって新しい（空の）データベースがデプロイ先のPostgreSQLに作成されます。
3. 反映が完了したら、ローカルの `.env` の `DATABASE_URL` を元の開発用（SQLite等）に戻します。

### MVP完成後の運用について

デプロイ完了後は、Vercelのダッシュボードに表示されているドメイン（例: `boat-bank.vercel.app`）にアクセスして動作を確認してください。

以上の設定で、BOAT BANKの金融風UI、認証システム、予想販売エコシステム、評価バッチ処理などすべての機能がインターネット上で動作します！
