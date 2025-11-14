# Mini Games → Gachapon Serials (v2)

採用ゲームは3つ（Aim / Memory / Numbers）。各ゲームのスコアでポイントを貯め、一定ポイントでガチャポン用のシリアルを発行できます。  
ランキングは各ゲーム上位10名。ポイントとシリアルは `data/db.json` に保存されます（サーバー起動時に自動作成）。

## 使い方（ローカル）
1. Node.js 18+ をインストール
2. ターミナルで:
   ```bash
   cd minigames-serials-v2
   npm install
   npm start
   ```
3. ブラウザで http://localhost:3000

## シリアルとポイント
- 1,000ポイントでシリアル1つ発行（デフォルト）。
- コストは `.env` の `SERIAL_POINT_COST=1000` などで変更可能。
- 管理者パスワードは `.env` の `ADMIN_PASSWORD`（未設定時は `admin123`）。

## API（抜粋）
- `POST /api/score` `{ player, game, score }` : スコア保存、ポイント加算（ゲームごと係数あり）
- `GET  /api/leaderboard?game=aim` : ランキング取得（上位10）
- `GET  /api/points?player=ゆう` : 現在ポイント
- `POST /api/serials/generate` `{ player }` : ポイント消費でシリアル発行
- `GET  /api/serials/latest?limit=5&player=...` : 直近シリアル一覧（所有者のみ）
- `GET  /api/serials/admin?limit=50` : 全シリアル（管理者のみ、`X-Admin-Key` ヘッダ）
- 既存ガチャサイト連携: `GET /api/serials/verify?code=...` / `POST /api/serials/consume`

---