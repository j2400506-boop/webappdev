# ハンズオン②：Vercel + Supabase で「繋ぐだけ」体験

ハンズオン①でS3に置いた占いページを、**データベースに繋がったアプリ**にします。

|  | ハンズオン① (AWS S3) | ハンズオン② (Vercel + Supabase) |
|---|---|---|
| 名前を変えるには | HTMLを書き換えて再アップロード | 画面のフォームに入力するだけ |
| 他の人の結果 | 見えない | 一覧に出る |
| 用意したサーバー | なし（静的配信） | なし（DBすら立てていない） |
| 公開の手順 | バケット作成→権限設定→アップロード | Gitリポジトリを繋ぐだけ |

**作業はすべてブラウザだけで完結します。** ローカルに Node.js も git もインストールしません。

---

## 事前準備（講義の前日までに）

アカウントを3つ作っておいてください。すべて無料です。

1. **GitHub** — https://github.com/signup
2. **Vercel** — https://vercel.com/signup → **「Continue with GitHub」** でログイン
3. **Supabase** — https://supabase.com/dashboard → **「Continue with GitHub」** でログイン

GitHubさえ作れば、残り2つはGitHubログインで数クリックです。
メール認証まで済ませておいてください（当日ここで詰まると時間が溶けます）。

---

## 手順1：Supabase でデータベースを作る

1. ダッシュボードで **New project**
2. 入力するのは3つだけ
   - **Name**: `fortune`（何でもOK）
   - **Database Password**: 自動生成でOK（今回は使いません）
   - **Region**: `Northeast Asia (Tokyo)`
3. **Create new project** → 1〜2分待つ

> この間に何が起きているか：PostgreSQLサーバーが1台立ち上がり、REST API・認証・管理画面まで用意されています。
> 自分でやるなら、サーバー調達 → OSセットアップ → PostgreSQLインストール → 設定 → バックアップ設計、の作業です。

### テーブルを作る

1. 左メニューの **SQL Editor** を開く
2. [`setup.sql`](setup.sql) の中身を全部コピーして貼り付け
3. **Run**（`Success. No rows returned` と出れば成功）

左メニューの **Table Editor** に `fortunes` テーブルができているのを確認してください。

### 値を2つ控える

次の2つをコピーしてメモ帳などに貼っておきます。

| 名前 | どこにあるか | 見た目 |
|---|---|---|
| **Project ID** | いま開いているダッシュボードのURLの `project/` の直後（**Settings** → **General** にも出ています） | `xxxxxxxxxxxxxxxxxxxx` |
| **Publishable key** | 左メニュー **Settings** → **API Keys** | `sb_publishable_xxxxx...`（古い画面では `anon` `public` と表示） |

Project ID は、ブラウザのアドレス欄のこの部分です。

```
https://supabase.com/dashboard/project/xxxxxxxxxxxxxxxxxxxx
                                       ~~~~~~~~~~~~~~~~~~~~ ここ
```

> ⚠️ **secret key（`sb_secret_...`）/ service_role キーは使いません。** これは全データを無制限に読み書きできる管理者キーです。ブラウザに置いたら一発でアウトです。

---

## 手順2：GitHub にリポジトリを用意する

https://github.com/whashimoto129/gunma-dev-handson を開き、緑色の **Use this template** → **Create a new repository** を押します。

- **Repository name**: `fortune-app`（何でもOK）
- **Public** のまま
- **Create repository**

自分のアカウントの下にファイル一式のコピーができます。

---

## 手順3：Vercel にデプロイする

1. Vercel ダッシュボードで **Add New...** → **Project**
2. さっき作ったリポジトリの **Import** を押す
3. 設定は**何も触らずに** **Deploy**

30秒ほどで紙吹雪が舞い、`https://<リポジトリ名>-xxxx.vercel.app` というURLが発行されます。

**開いてみてください。赤いエラーメッセージが出ます。これは正常です。**
まだ `config.js` に Supabase の情報を書いていないからです。

> ここまでで体感してほしいこと：ビルド・サーバー準備・CDN配信・HTTPS証明書の発行が、**Gitリポジトリを選んだだけ**で全部終わっています。

---

## 手順4：Supabase と繋ぐ

GitHub のリポジトリに戻り、`config.js` を開いて鉛筆アイコン（Edit）をクリック。
2箇所を手順1で控えた値に書き換えます。

```js
const SUPABASE_PROJECT_ID = "xxxxxxxxxxxxxxxxxxxx";
const SUPABASE_KEY = "sb_publishable_xxxxx...";
```

**Commit changes** を押します。

Vercel のダッシュボードを見てください。**何もしていないのにビルドが走り始めます。**
これが「Gitにpushしたら自動で本番反映される」という、いま当たり前になっている流れです。

1分ほどでデプロイが終わったら、さっきのURLをリロード。
名前を入れて **占う** → 結果が出て、下の一覧に並べば成功です。

**隣の人のURLも開いてみてください。** 自分のDBには自分の結果しか入っていないはずです。

---

## 確認してみよう

### ① データが本当にDBに入っているか

Supabase の **Table Editor** → `fortunes` を開くと、いま占った結果が行として入っています。
ブラウザのフォーム入力が、そのままPostgreSQLの1行になっています。

### ② 通信の中身を見る

ブラウザで **F12 → Network タブ** を開いた状態で「占う」を押すと、
`fortunes` への **POST** と **GET** が飛んでいるのが見えます。

このアプリはライブラリを一切使っていません。やっているのは `fetch()` でURLを叩くことだけです（[`app.js`](app.js) を見てみてください）。

### ③ 最小権限を破ってみる

DevToolsの **Console** タブで、削除を試してみてください。

```js
fetch(`${ENDPOINT}?id=eq.1`, { method: "DELETE", headers: HEADERS }).then(r => console.log(r.status));
```

`401` が返り、データは消えません。
[`setup.sql`](setup.sql) で **SELECT と INSERT のポリシーだけを書き、DELETE のポリシーを書かなかった**からです。

公開鍵をブラウザに置いても平気なのは、鍵を隠しているからではなく、**その鍵でできることを絞ってあるから**です。これが講義で出てきた**最小権限の原則**の実物です。

---

## 発展：AIエージェントからDBを覗く（時間があれば）

Supabase には公式のMCPサーバーがあり、Claude などのAIアシスタントから直接DBを操作できます。
接続時に `--read-only=true` を付けると、**読み取り専用**になります。

```bash
npx -y @supabase/mcp-server-supabase@latest --read-only=true --project-ref=<プロジェクトID>
```

「AIに権限を渡すときこそ、渡す権限を絞る」——さっきのRLSと同じ考え方が、そのままAI時代のツール接続にも出てきます。

---

## うまくいかないとき

| 症状 | 原因と対処 |
|---|---|
| 赤いエラーが消えない | `config.js` の貼り付けミス。`"` で囲めているか、値を消し忘れていないか確認 |
| 「読み込めませんでした」だけ出る<br>（Console に `ERR_NAME_NOT_RESOLVED`） | Project ID の綴り違い。ダッシュボードのURLの `project/` の直後と1文字ずつ照らす |
| `401` `Invalid API key` | キーの貼り間違い。Publishable key（`sb_publishable_`）を使っているか確認 |
| `404` `relation ... does not exist` | `setup.sql` の実行忘れ。SQL Editor で実行したか確認 |
| `violates row-level security policy` | ポリシーの作成失敗。`setup.sql` を最後まで実行できているか確認 |
| Vercelに変更が反映されない | Vercelの **Deployments** タブを確認。ビルド中か、失敗していないか |
| 画面が古いまま | スーパーリロード（Windows: `Ctrl+Shift+R` / Mac: `Cmd+Shift+R`） |

---

## 講義のあと

- Supabaseの無料プロジェクトは、**1週間APIアクセスがないと自動で一時停止**します。消えるわけではなく、ダッシュボードから再開できます。
- 無料枠はアクティブなプロジェクト2つまでです。次に何か作りたくなったら、このプロジェクトを消してから作ってください。
- Vercelのアプリはずっと公開されたままです。不要なら **Settings → Delete Project** で削除できます。

---

<details>
<summary>講師向けメモ</summary>

- **配布用リポジトリ**：https://github.com/whashimoto129/gunma-dev-handson （このファイル一式をルートに配置）。**Settings → General → Template repository にチェック**を入れておくこと。これが入っていないと学生の画面に「Use this template」ボタンが出ず、手順2が破綻する。
- **講義資料側のリポジトリ**：`gunma/handson2/` が編集元。変更したら配布用リポジトリにも反映する。
- **フレームワークプリセット**：静的ファイルのみなので Vercel は "Other" として素通しでデプロイする。ビルドコマンドの設定は不要。
- **所要時間の目安**：Supabaseプロジェクト作成の待ち時間が1〜2分あるので、手順1を先に走らせてから手順2〜3の説明をすると待ちが埋まる。全体で25〜30分。
- **一番詰まるポイント**：アカウント作成（→事前課題で潰す）と、キーの貼り間違い。エラーメッセージはHTTPステータスと本文をそのまま画面に出すようにしてあるので、机間指導のときはそこを読ませる。
- **DB共有版にしたい場合**：講師のプロジェクトのURL/キーを配れば、全員の結果が1つの一覧に並ぶ。盛り上がるが、`name` に何を入れられても表示は `textContent` なのでスクリプトは動かない。ただし不適切な文字列は残るので、`delete from public.fortunes;` をすぐ打てるようにしておく。

</details>
