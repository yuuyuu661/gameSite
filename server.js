import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---- Simple JSON "DB" ----
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const defaultDB = {
  players: {},
  leaderboards: {
    aim: [],
    memory: [],
    numbers: [],
    fusion: [],
    block: []
  }
};

function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultDB, null, 2));
      return JSON.parse(JSON.stringify(defaultDB));
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("DB read error:", e);
    return JSON.parse(JSON.stringify(defaultDB));
  }
}

function writeDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// ---- Leaderboards / Points Logic ----
function addScoreToLeaderboard(db, game, player, score, meta) {
  if (!db.leaderboards[game]) db.leaderboards[game] = [];
  const idx = db.leaderboards[game].findIndex(r => r.player === player);

  if (idx >= 0) {
    if (score > db.leaderboards[game][idx].score) {
      db.leaderboards[game][idx].score = score;
      db.leaderboards[game][idx].meta = meta || null;
      db.leaderboards[game][idx].updated_at = Date.now();
    }
  } else {
    db.leaderboards[game].push({
      player,
      score,
      meta: meta || null,
      updated_at: Date.now()
    });
  }

  db.leaderboards[game].sort((a, b) => b.score - a.score);
  db.leaderboards[game] = db.leaderboards[game].slice(0, 10);
}

function awardPoints(db, player, game, score) {
  const multipliers = {
    aim: 2,
    memory: 1,
    numbers: 1,
    fusion: 2,
    block: 1
  };
  const base = Math.max(0, Math.floor(score));
  const add = base * (multipliers[game] || 1);

  if (!db.players[player]) db.players[player] = { points: 0 };
  db.players[player].points += add;
  return add;
}

// ---- API: score ----
app.post("/api/score", (req, res) => {
  const { player, game, score, meta } = req.body || {};
  if (!player || !game || typeof score !== "number") {
    return res.status(400).json({ error: "player, game, score required" });
  }

  const db = readDB();
  addScoreToLeaderboard(db, game, player, score, meta);
  const added = awardPoints(db, player, game, score);
  writeDB(db);

  res.json({ ok: true, addedPoints: added, totalPoints: db.players[player].points });
});

// ---- API: get leaderboard ----
app.get("/api/leaderboard", (req, res) => {
  const { game } = req.query;
  const db = readDB();
  if (game) return res.json({ game, records: db.leaderboards[game] || [] });
  res.json({ leaderboards: db.leaderboards });
});

// ---- API: get points ----
app.get("/api/points", (req,res)=>{
  const { player } = req.query;
  const db = readDB();
  const p = db.players[player]?.points || 0;
  res.json({ player, points: p });
});

// ====================================================
// ★ NEW API: スロットや今後のゲームでポイント増減に使用
// ====================================================
app.post("/api/points/update", (req,res)=>{
  const { player, diff } = req.body || {};
  if (!player || typeof diff !== "number") {
    return res.status(400).json({ error: "player and diff required" });
  }

  const db = readDB();
  if (!db.players[player]) db.players[player] = { points: 0 };

  db.players[player].points += diff;
  if (db.players[player].points < 0) db.players[player].points = 0;

  writeDB(db);
  res.json({ ok: true, points: db.players[player].points });
});

// ---- API: points ranking ----
app.get("/api/points-ranking", (req,res)=>{
  const db = readDB();
  const rank = Object.entries(db.players)
    .map(([player, obj])=>({ player, points: obj.points || 0 }))
    .sort((a,b)=> b.points - a.points)
    .slice(0,10);
  res.json({ ok:true, ranking: rank });
});

// ---- Static single page fallback ----
app.get("*", (req,res)=>{
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ---- Start ----
const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`Server running on http://localhost:${PORT}`));
