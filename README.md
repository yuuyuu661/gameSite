# Mini Games → Gachapon Serials

ローカルで遊べる6つのミニゲームのスコアでポイントを貯め、一定ポイントでガチャポン用のシリアルを発行できます。  
ランキングはゲームごとに保存され、ポイントとシリアルは `data/db.json` に保存されます（Nodeサーバー起動中に自動作成）。

## 使い方（ローカル）
1. Node.js 18+ をインストール
2. ターミナルで:
   ```bash
   cd minigames-serials
   npm install
   npm start
   ```
3. ブラウザで http://localhost:3000 を開く

## シリアルとポイント
- 1,000ポイントでシリアル1つ発行（デフォルト）。
- コストは `.env` で `SERIAL_POINT_COST=1000` などと設定可能。
- 管理者パスワードは `.env` の `ADMIN_PASSWORD`（未設定時は `admin123`）。

## 構成
- `server.js` : Express API（スコア保存、ランキング、ポイント、シリアル発行）
- `data/db.json` : 永続データ（自動生成）
- `public/` : フロントエンド（トップ、ランキング、各ミニゲーム）

## API（抜粋）
- `POST /api/score` `{ player, game, score }` : スコア保存、ポイント加算（ゲームごと係数あり）
- `GET  /api/leaderboard?game=aim` : ランキング取得（上位50）
- `GET  /api/points?player=ゆう` : 現在ポイント
- `POST /api/serials/generate` `{ player }` : ポイントを消費してシリアル発行
- `GET  /api/serials/latest?limit=5` : 直近シリアル一覧（所有者のみ）
- `GET  /api/serials/admin?limit=50` : 全シリアル（管理者のみ、`X-Admin-Key` ヘッダ）

## 既存ガチャサイト連携イメージ
- このサーバの `/api/serials/verify?code=XXXX-XXXX-XXXX` を既存サイトから叩いて検証可能（200/404）。
- 既存サイトでの「使用済み化」は、そちら側での消費時に `POST /api/serials/consume` を叩く想定（簡易実装付）。

---