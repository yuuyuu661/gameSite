import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// --------------------
// DB 初期設定
// --------------------
const defaultDB = {
  players: [],
  leaderboard: {
    aim: [],
    memory: [],
    numbers: [],
    fusion: [],
    block: []     // ★ 追加済み
  }
};

const dbFile = path.join(__dirname, "database.json");
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, defaultDB);
await db.read();
db.data ||= defaultDB;
await db.write();

// --------------------
// 静的ファイル
// --------------------
app.use(express.static(path.join(__dirname, "public")));

// --------------------
// スコア保存
// --------------------
app.post("/api/score", async (req, res) => {
  const { name, score, gameId } = req.body;

  if (!name || typeof score !== "number" || !gameId) {
    return res.status(400).json({ error: "Invalid data" });
  }

  const validGames = ["aim", "memory", "numbers", "fusion", "block"];  // ★ block 追加

  if (!validGames.includes(gameId)) {
    return res.status(400).json({ error: "Unknown gameId" });
  }

  const now = Date.now();

  db.data.leaderboard[gameId].push({
    name,
    score,
    time: now
  });

  // スコア高い順にソートして10件に絞る
  db.data.leaderboard[gameId].sort((a, b) => b.score - a.score);
  db.data.leaderboard[gameId] = db.data.leaderboard[gameId].slice(0, 10);

  await db.write();

  res.json({ success: true });
});

// --------------------
// ランキング取得
// --------------------
app.get("/api/leaderboard/:gameId", async (req, res) => {
  const { gameId } = req.params;

  const validGames = ["aim", "memory", "numbers", "fusion", "block"];  // ★ block 追加

  if (!validGames.includes(gameId)) {
    return res.status(400).json({ error: "Unknown gameId" });
  }

  res.json(db.data.leaderboard[gameId] || []);
});

// --------------------
// すべてのページへのフォールバック
// --------------------
app.get("*", (req, res) => {
  const filePath = path.join(__dirname, "public", req.path);

  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }

  return res.sendFile(path.join(__dirname, "public", "index.html"));
});

// --------------------
const PORT = 3000;
app.listen(PORT, () => console.log("Server started on port", PORT));
