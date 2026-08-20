// ============================================================
//  ここだけ自分の Supabase プロジェクトの値に書き換えてください
// ============================================================

// Project ID（プロジェクトの識別子。20文字くらいの英数字）
// ダッシュボードを開いているときのURLにも入っています
//   https://supabase.com/dashboard/project/★ここ★
const SUPABASE_PROJECT_ID = "wzhaelzrmktfusumplka";

// Publishable key（sb_publishable_... で始まる文字列）
// 取得場所：Supabase ダッシュボード → Settings → API Keys
// ※ 古いプロジェクトでは「anon public」キーと表示されます
const SUPABASE_KEY = "sb_publishable_IWuYAtv8emGejEYn-UouVw_bFxOm_ri";

// このキーはブラウザに配られる公開鍵です。秘密ではありません。
// データを守っているのは鍵ではなく、setup.sql で設定した RLS（行レベルセキュリティ）です。
// 逆に「secret key（sb_secret_...）」は絶対にここに貼らないでください。
