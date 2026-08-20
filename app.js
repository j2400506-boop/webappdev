// ============================================================
//  みんなの占い - Supabase の REST API を直接呼ぶだけのアプリ
//  ライブラリもビルドも使っていません。fetch() だけです。
// ============================================================

// Project ID のつもりでURLを丸ごと貼ってしまっても動くように、ID部分だけを取り出しておく
//   https://supabase.com/dashboard/project/<ID>/... も https://<ID>.supabase.co も受け付ける
const PROJECT_ID = SUPABASE_PROJECT_ID.trim()
  .replace(/^https?:\/\/(.*\/dashboard\/project\/)?/, "")
  .replace(/[./].*$/, "");
const API_KEY = SUPABASE_KEY.trim();

// Supabase はテーブルを作ると、そのまま REST API になります。
// fortunes テーブル → https://<Project ID>.supabase.co/rest/v1/fortunes
const BASE_URL = `https://${PROJECT_ID}.supabase.co`;
const ENDPOINT = `${BASE_URL}/rest/v1/fortunes`;

const HEADERS = {
  apikey: API_KEY,
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
};

const FORTUNES = [
  { luck: "大吉", message: "素晴らしい1日になるでしょう！" },
  { luck: "中吉", message: "落ち着いて進めれば、うまくいきます。" },
  { luck: "小吉", message: "小さな幸せに気づける日です。" },
  { luck: "吉", message: "いつもどおりが一番の日です。" },
  { luck: "末吉", message: "後半に運が上向いてきます。" },
  { luck: "凶", message: "無理せず、早めに休みましょう。" },
];

// 同じ名前なら毎回同じ結果になるように、名前から番号を決めます
function fortuneFor(name) {
  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + char.codePointAt(0)) % 100000;
  }
  return FORTUNES[hash % FORTUNES.length];
}

const form = document.getElementById("fortune-form");
const nameInput = document.getElementById("name");
const submitButton = document.getElementById("submit");
const result = document.getElementById("result");
const errorBox = document.getElementById("error");
const list = document.getElementById("list");

function showError(html) {
  errorBox.innerHTML = html;
  errorBox.hidden = false;
}

// 設定忘れをその場で気づけるようにしておく
function isConfigured() {
  return /^[a-zA-Z0-9-]{12,}$/.test(PROJECT_ID) && API_KEY.length > 20 && !API_KEY.includes("貼り付け");
}

// --- 書き込み：POST でテーブルに1行追加する ---
async function saveFortune(name, luck) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ name, luck }),
  });
  if (!response.ok) {
    throw new Error(`保存に失敗しました（${response.status}）: ${await response.text()}`);
  }
}

// --- 読み込み：GET で新しい順に20件取ってくる ---
async function fetchFortunes() {
  const query = "select=name,luck,created_at&order=created_at.desc&limit=20";
  const response = await fetch(`${ENDPOINT}?${query}`, { headers: HEADERS });
  if (!response.ok) {
    throw new Error(`取得に失敗しました（${response.status}）: ${await response.text()}`);
  }
  return response.json();
}

function showPlaceholder(text) {
  list.textContent = "";
  const empty = document.createElement("li");
  empty.className = "empty";
  empty.textContent = text;
  list.append(empty);
}

function renderList(rows) {
  list.textContent = "";

  if (rows.length === 0) {
    showPlaceholder("まだ誰も占っていません。最初の1人になろう！");
    return;
  }

  for (const row of rows) {
    const item = document.createElement("li");

    const luck = document.createElement("span");
    luck.className = "luck";
    luck.textContent = row.luck;

    // 他の人が入力した文字列なので、textContent で「文字として」表示する
    // （innerHTML で埋め込むと、名前欄に書かれた HTML やスクリプトが動いてしまう）
    const who = document.createElement("span");
    who.className = "who";
    who.textContent = row.name;

    const when = document.createElement("span");
    when.className = "when";
    when.textContent = new Date(row.created_at).toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });

    item.append(luck, who, when);
    list.append(item);
  }
}

async function reloadList() {
  try {
    renderList(await fetchFortunes());
  } catch (e) {
    showPlaceholder("読み込めませんでした");
    showError(`一覧を読み込めませんでした。<br>${e.message}`);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = nameInput.value.trim();
  if (name === "") return;

  errorBox.hidden = true;
  submitButton.disabled = true;
  submitButton.textContent = "占い中...";

  const { luck, message } = fortuneFor(name);

  try {
    await saveFortune(name, luck);

    document.getElementById("result-name").textContent = name;
    document.getElementById("result-luck").textContent = luck;
    document.getElementById("result-message").textContent = message;
    result.hidden = false;

    nameInput.value = "";
    await reloadList();
  } catch (e) {
    showError(`保存できませんでした。<br>${e.message}`);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "占う";
  }
});

if (isConfigured()) {
  reloadList();
} else {
  showPlaceholder("Supabase に繋ぐと、ここに結果が並びます");
  submitButton.disabled = true;
  showError(
    "<code>config.js</code> がまだ設定されていません。<br>" +
      "Supabase ダッシュボードのURLから <b>Project ID</b> を、<b>Settings → API Keys</b> から <b>Publishable key</b> をコピーして、" +
      "<code>config.js</code> に貼り付けてください。"
  );
}
