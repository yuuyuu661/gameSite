
const API = {
  async post(path, body){
    const res = await fetch(path, {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body)});
    if(!res.ok) throw await res.json().catch(()=>({error:"request_failed"}));
    return res.json();
  },
  async get(path){ const res = await fetch(path); if(!res.ok) throw await res.json().catch(()=>({error:"request_failed"})); return res.json(); }
};

export function getPlayer(){ return localStorage.getItem("playerName") || ""; }
export function setPlayer(name){ localStorage.setItem("playerName", name); }
export async function getPoints(player){ return API.get(`/api/points?player=${encodeURIComponent(player)}`); }
export async function submitScore(game, score, meta){
  const player = getPlayer();
  if(!player){ alert("先にプレイヤー名を設定してください"); return { ok:false }; }
  return API.post("/api/score", { player, game, score: Number(score), meta });
}; }
  return API.post("/api/score", { player, game, score: Number(score) });
}
export async function latestSerials(player, limit=5){
  return API.get(`/api/serials/latest?player=${encodeURIComponent(player)}&limit=${limit}`);
}
export async function generateSerial(player){
  return API.post("/api/serials/generate", { player });
}
export async function getLeaderboard(game){
  return API.get(`/api/leaderboard?game=${encodeURIComponent(game)}`);
}
