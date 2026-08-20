-- ============================================================
--  Supabase セットアップ用 SQL
--  ダッシュボード左メニュー「SQL Editor」に貼り付けて Run するだけ
-- ============================================================

-- 1) テーブルを1つ作る
--    これだけで REST API（/rest/v1/fortunes）も自動で生えてきます
create table public.fortunes (
  id         bigint generated always as identity primary key,
  name       text not null check (char_length(name) between 1 and 20),
  luck       text not null check (luck in ('大吉', '中吉', '小吉', '吉', '末吉', '凶')),
  created_at timestamptz not null default now()
);

-- 2) RLS（行レベルセキュリティ）を有効にする
--    有効にした時点では「誰も何もできない」状態。ここが出発点です。
alter table public.fortunes enable row level security;

-- 3) 必要な操作だけを、必要な相手に許可する = 最小権限の原則
--    anon = ログインしていない匿名ユーザー（＝今回のブラウザからのアクセス）

-- 読む（SELECT）：許可する
create policy "誰でも一覧を読める"
  on public.fortunes
  for select
  to anon
  using (true);

-- 書き込む（INSERT）：許可する
create policy "誰でも1件追加できる"
  on public.fortunes
  for insert
  to anon
  with check (true);

-- 書き換える（UPDATE）と 消す（DELETE）：
--   ポリシーを「作らない」ことで禁止されます。
--   ブラウザに配っている公開鍵では、他人の結果を改ざん・削除できません。


-- ============================================================
--  確認用
-- ============================================================

-- 中身を見る
-- select * from public.fortunes order by created_at desc;

-- 全部消してやり直す
-- delete from public.fortunes;

-- テーブルごと作り直す（先頭からもう一度実行する場合）
-- drop table if exists public.fortunes;
