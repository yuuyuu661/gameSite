
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { customAlphabet } from "nanoid";
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
  players: {}, // player -> { points: number, serials: [code] }
  leaderboards: {
    aim: [],
    memory: [],
    numbers: [],
    fusion: []
  },
  serials: [] // { code, owner, created_at, used: false, used_at: null }
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

// ---- Utils ----
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const SERIAL_POINT_COST = parseInt(process.env.SERIAL_POINT_COST || "1000", 10);

// NanoID-based serial like XXXX-XXXX-XXXX (A-Z0-9)
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const nano12 = customAlphabet(alphabet, 12);
function createSerial() {
  const raw = nano12();
  return `${raw.slice(0,4)}-${raw.slice(4,8)}-${raw.slice(8,12)}`;
}

function addScoreToLeaderboard(db, game, player, score, meta) {
  if (!db.leaderboards[game]) db.leaderboards[game] = [];
  const existingIndex = db.leaderboards[game].findIndex(r => r.player === player);
  if (existingIndex >= 0) {
    if (score > db.leaderboards[game][existingIndex].score) {
      db.leaderboards[game][existingIndex].score = score;
      db.leaderboards[game][existingIndex].meta = meta || null;
      db.leaderboards[game][existingIndex].updated_at = Date.now();
    }
  } else {
    db.leaderboards[game].push({ player, score, meta: meta || null, updated_at: Date.now() });
  }
  db.leaderboards[game].sort((a,b)=> b.score - a.score);
  db.leaderboards[game] = db.leaderboards[game].slice(0,10);
}
function awardPoints(db, player, game, score) {
  const multipliers = {
    aim: 2,
    memory: 1,
    numbers: 1,
    fusion: 2
  };
  const base = Math.max(0, Math.floor(score));
  const add = base * (multipliers[game] || 1);
  if (!db.players[player]) db.players[player] = { points: 0, serials: [] };
  db.players[player].points += add;
  return add;
}

// ---- API ----
app.post("/api/score", (req, res) => {
  const { player, game, score, meta } = req.body || {};
  if (!player || !game || typeof score !== "number") {
    return res.status(400).json({ error: "player, game, score are required" });
  }
  const db = readDB();
  addScoreToLeaderboard(db, game, player, score, meta);
  const added = awardPoints(db, player, game, score);
  writeDB(db);
  res.json({ ok: true, addedPoints: added, totalPoints: db.players[player].points });
});

app.get("/api/leaderboard", (req,res)=>{
  const { game } = req.query;
  const db = readDB();
  if (game) {
    return res.json({ game, records: db.leaderboards[game] || [] });
  }
  res.json({ leaderboards: db.leaderboards });
});

app.get("/api/points", (req,res)=>{
  const { player } = req.query;
  const db = readDB();
  const p = (db.players[player] && db.players[player].points) || 0;
  res.json({ player, points: p });
});

app.post("/api/serials/generate", (req,res)=>{
  const { player } = req.body || {};
  if (!player) return res.status(400).json({ error: "player required" });
  const db = readDB();
  if (!db.players[player]) db.players[player] = { points: 0, serials: [] };
  if (db.players[player].points < SERIAL_POINT_COST) {
    return res.status(400).json({ error: "not_enough_points", need: SERIAL_POINT_COST, current: db.players[player].points });
  }
  // create a unique serial
  let code = "";
  do {
    code = createSerial();
  } while (db.serials.find(s => s.code === code));
  db.players[player].points -= SERIAL_POINT_COST;
  db.serials.push({ code, owner: player, created_at: Date.now(), used: false, used_at: null });
  db.players[player].serials.push(code);
  writeDB(db);
  res.json({ ok: true, code, remainingPoints: db.players[player].points });
});

app.get("/api/serials/latest", (req,res)=>{
  const { player, limit="5" } = req.query;
  const lim = Math.min(parseInt(limit,10)||5, 100);
  const db = readDB();
  if (!player) return res.status(400).json({ error: "player required" });
  const owned = db.serials.filter(s => s.owner === player).sort((a,b)=> b.created_at - a.created_at).slice(0, lim);
  res.json({ player, serials: owned });
});

// Admin list
app.get("/api/serials/admin", (req,res)=>{
  const key = req.get("X-Admin-Key") || req.query.key;
  if (key !== ADMIN_PASSWORD) return res.status(403).json({ error: "forbidden" });
  const { limit="50" } = req.query;
  const lim = Math.min(parseInt(limit,10)||50, 500);
  const db = readDB();
  const list = [...db.serials].sort((a,b)=> b.created_at - a.created_at).slice(0, lim);
  res.json({ serials: list });
});

// Verify (for external site)
app.get("/api/serials/verify", (req,res)=>{
  const { code } = req.query;
  const db = readDB();
  const hit = db.serials.find(s => s.code === code && !s.used);
  if (!hit) return res.status(404).json({ ok:false });
  res.json({ ok:true, code, owner: hit.owner, created_at: hit.created_at });
});

// Consume (for external site)
app.post("/api/serials/consume", (req,res)=>{
  const { code } = req.body || {};
  const db = readDB();
  const idx = db.serials.findIndex(s => s.code === code && !s.used);
  if (idx < 0) return res.status(404).json({ ok:false, error:"not_found_or_used" });
  db.serials[idx].used = true;
  db.serials[idx].used_at = Date.now();
  writeDB(db);
  res.json({ ok:true });
});


// Pokemon Fusion random fetch (external site)
app.get("/api/fusion/random", async (req, res) => {
  try {
    const resp = await fetch("https://pokemon.alexonsager.net/ja");
    const html = await resp.text();

    // 画像URL（1番目の fused 画像）
    const imgMatch = html.match(/https:\/\/images\.alexonsager\.net\/pokemon\/fused\/[0-9\/\.]+\.png/);
    const image = imgMatch ? imgMatch[0] : null;

    // 左右のポケモン名（最初の2つの<select>からざっくり取得）
    const selectMatches = [...html.matchAll(/<select[\s\S]*?<\/select>/g)];
    let leftName = "";
    let rightName = "";

    function extractName(block) {
      if (!block) return "";
      const m =
        block.match(/<option[^>]*selected[^>]*>([^<]+)<\/option>/i) ||
        block.match(/<option[^>]*>([^<]+)<\/option>/i);
      return m ? m[1].trim() : "";
    }

    if (selectMatches.length >= 2) {
      leftName = extractName(selectMatches[0][0]);
      rightName = extractName(selectMatches[1][0]);
    }

    if (!image || !leftName || !rightName) {
      return res.status(500).json({ ok: false, error: "parse_failed" });
    }

    res.json({ ok: true, fusion: { image, leftName, rightName } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "fetch_failed" });
  }
});

// Fallback to SPA-ish static
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
