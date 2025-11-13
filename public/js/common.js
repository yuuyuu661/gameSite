// public/js/common.js

const API = {
  async get(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`GET ${path} ${res.status}`);
    return res.json();
  },
  async post(path, body) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    });
    if (!res.ok) throw new Error(`POST ${path} ${res.status}`);
    return res.json();
  },
};

// 端末ごとに保存する「表示用の名前」と「内部ID」
const DISPLAY_NAME_KEY = "minigames_display_name";
const DEVICE_TAG_KEY   = "minigames_device_tag"; // 端末固有タグ

export function getDisplayName() {
  return localStorage.getItem(DISPLAY_NAME_KEY) || "";
}

export function setDisplayName(name) {
  localStorage.setItem(DISPLAY_NAME_KEY, name || "");
}

function getOrCreateDeviceTag() {
  let t = localStorage.getItem(DEVICE_TAG_KEY);
  if (!t) {
    t = Math.random().toString(36).slice(2, 10);
    localStorage.setItem(DEVICE_TAG_KEY, t);
  }
  return t;
}

// サーバーに送る「内部用プレイヤーID」
// 見た目は同じでも、中にゼロ幅スペース＋IDをくっつける
function getInternalPlayerId() {
  const name = getDisplayName();
  if (!name) return "";
  const tag = getOrCreateDeviceTag();
  return name + "\u200b" + tag; // ユーザーからは見えない文字を挟む
}

// --- API ラッパー ---

export async function submitScore(game, score, meta) {
  const player = getInternalPlayerId();
  if (!player) {
    alert("先にプレイヤー名を設定してください");
    return { ok: false };
  }
  return API.post("/api/score", {
    player,
    game,
    score: Number(score) || 0,
    meta: meta || null,
  });
}

export async function getLeaderboard(game) {
  // サーバー側は player をそのまま表示するが、
  // ゼロ幅スペースは見えないので見た目は今まで通り
  return API.get(`/api/leaderboard?game=${encodeURIComponent(game)}`);
}

export async function generateSerial() {
  const player = getInternalPlayerId();
  if (!player) {
    alert("先にプレイヤー名を設定してください");
    return { ok: false };
  }
  return API.post("/api/serials/generate", { player });
}

export async function latestSerials(limit = 5) {
  const player = getInternalPlayerId();
  if (!player) {
    return { serials: [] };
  }
  return API.get(
    `/api/serials/latest?player=${encodeURIComponent(player)}&limit=${limit}`
  );
}

export async function getPoints() {
  const player = getInternalPlayerId();
  if (!player) {
    return { points: 0 };
  }
  return API.get(`/api/points?player=${encodeURIComponent(player)}`);
}
