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

const PLAYER_KEY = "minigames_player_name";

export function getPlayer() {
  return localStorage.getItem(PLAYER_KEY) || "";
}

export function setPlayer(name) {
  localStorage.setItem(PLAYER_KEY, name || "");
}

export async function submitScore(game, score, meta) {
  const player = getPlayer();
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
  return API.get(`/api/leaderboard/${encodeURIComponent(game)}`);
}

export async function generateSerial(cost) {
  // 必要に応じて cost を引数に使う
  return API.post("/api/serials/generate", {});
}

export async function getLatestSerials() {
  return API.get("/api/serials/latest");
}

export async function getPoints() {
  return API.get("/api/points");
}
