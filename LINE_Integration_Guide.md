# LINE公式アカウント連携ガイド (実装手順)

本ドキュメントは、構築したGIOSTRAプロトタイプを実際の「LINE公式アカウント」および「LINE Frontend Framework (LIFF)」と繋ぎ込む際の実装ステップを解説します。

## 1. LINE Developersの設定準備
開発にあたり、まずはLINE Developersコンソール上で以下の2つの「チャネル」を作成します。

### A. Messaging APIチャネル（Bot機能）
* **役割**: エンドユーザーとのチャット(メッセージの送受信)を担当。
* **取得するもの**:
  * `Channel Secret` (Webhookの署名検証用)
  * `Channel Access Token` (メッセージ配信APIの呼び出し用)
* **設定すること**:
  * **Webhook URL**: バックエンドサーバーのURL (`https://your-domain.com/api/webhook` 等)を登録。

### B. LINE Loginチャネル（LIFF機能）
* **役割**: 管理者用ダッシュボード（今回作成したフロントエンド）をLINE内でシームレスに開くために使用。
* **取得するもの**:
  * `LIFF ID` (フロントエンドのJSで初期化に使用)
* **設定すること**:
  * **エンドポイントURL**: 作成したフロントエンド群 (`index.html`等)をホスティングしたURLを設定。

---

## 2. バックエンド (Node.js) の連携実装
プロトタイプにある `backend/server.js` を拡張し、LINE SDK (`@line/bot-sdk`) を導入します。

### ① Webhookの受信とプロファイル自動抽出
エンドユーザーからLINEでメッセージが送られてきた時、LINEサーバーからNode.jsへデータ(Webhook)が飛びます。
1. **受信**: 「週末空いてる？」等の自然言語テキストと、ユーザーの `line_id` を受信。
2. **AI処理**: そのテキストをOpenAIに渡し、「性別・職業・居住地・等」をJSONで抽出。
3. **DB保存**: Firebase等のデータベースにある該当 `line_id` のレコードを更新。

### ② 一斉（個別カスタマイズ）配信処理
今回作成した管理画面で「一斉送信」を押した際の処理です。
1. 管理画面（LIFF）から「各ユーザー宛の生成済み個別メッセージ」と「対象者のline_id」のリストがNode.jsへ送られる。
2. Node.js側でループ処理、またはマルチキャストAPIを利用して対象の `line_id` 宛にPush Message APIを実行。
3. お客様のLINEへ個別のメッセージが実際に届きます。

---

## 3. フロントエンド (LIFF) の連携実装
プロトタイプにある `admin-liff/app.js` を拡張します。

### LIFF SDKの導入
1. HTMLの `<head>` にLIFF SDK (`https://static.line-scdn.net/liff/edge/2/sdk.js`) を読み込む。
2. JSの先頭で `liff.init({ liffId: "取得したLIFF ID" })` を実行。
3. これにより、管理画面を開いた人が**誰なのか（管理者のLINEプロファイルやアクセストークン）**を取得でき、セキュアに「管理者のみがAPIを叩ける」状態を作ります。

---

## 4. 今後の本番実装のイメージ（フロー図）

**[ユーザー側]**  
(LINEでチャット送信) → **[Node.js (Webhook)]** → (OpenAIで情報抽出) → **[DB]** に蓄積

**[管理者側]**  
(LINEメニューから管理画面を開く) → **[LIFF]** → (DBから最新500名を取得して表示) → (対象を絞り込んでAI文章作成) → **[Node.js (Push API)]** → (お客様のLINEへメッセージ到達)

---

## 5. 次のステップ（開発アプローチ）
これから実際のコードへの落とし込みを始める場合は、以下の順番で進めるのがスムーズです。
1. **インフラの用意**: Node.jsを動かす環境（Render, Heroku等）や、LIFF用HTMLを置く場所（Vercel, Firebase Hosting等）を用意する。
   * ※開発中は `ngrok` を使ってローカル環境でLINE Webhookを受け取るのが一般的です。
2. **LINE Developers設定**: 上記のチャネルを発行する。
3. **Bot疎通確認**: LINE公式アカウントに「こんにちは」と送ったら、Node.jsを経由して「オウム返し」または「OpenAIとのチャット」ができる基礎部分を作る。
