require('dotenv').config();
const express = require('express');
const cors = require('cors');
const line = require('@line/bot-sdk');

// -----------------------------------------------------------
// LINE SDK の設定
// -----------------------------------------------------------
const lineConfig = {
  channelId: process.env.LINE_CHANNEL_ID,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: lineConfig.channelAccessToken,
});

const app = express();
app.use(cors());

// -----------------------------------------------------------
// インメモリDB（プロトタイプ用）
// 本番環境では Firebase / PostgreSQL に切り替える
// -----------------------------------------------------------
const usersDB = new Map(); // line_id をキーにした顧客データストア

// -----------------------------------------------------------
// Webhook エンドポイント
// LINEサーバーからのWebhookを受け取る
// -----------------------------------------------------------
app.post(
  '/api/webhook',
  line.middleware({ channelSecret: lineConfig.channelSecret }),
  async (req, res) => {
    const events = req.body.events;
    await Promise.all(events.map(handleEvent));
    res.status(200).json({ status: 'ok' });
  }
);

app.use(express.json());

// -----------------------------------------------------------
// イベントハンドラ（イベント種別ごとに処理を分岐）
// -----------------------------------------------------------
async function handleEvent(event) {
  const userId = event.source.userId;

  // ① 友達追加（follow）イベント
  if (event.type === 'follow') {
    return handleFollow(userId);
  }

  // ② ブロック（unfollow）イベント
  if (event.type === 'unfollow') {
    console.log(`[Unfollow] userId=${userId}`);
    if (usersDB.has(userId)) {
      usersDB.get(userId).is_blocked = true;
    }
    return;
  }

  // ③ テキストメッセージ
  if (event.type === 'message' && event.message.type === 'text') {
    return handleMessage(event, userId);
  }

  return null;
}

// -----------------------------------------------------------
// ① 友達追加ハンドラ
// LINEプロフィールを取得してDBに自動登録する
// -----------------------------------------------------------
async function handleFollow(userId) {
  console.log(`[Follow] New follower: userId=${userId}`);

  try {
    // LINE API からユーザーのプロフィールを取得
    const profile = await client.getProfile(userId);

    // 新規ユーザーのレコードを作成してDBへ保存
    const newUser = {
      line_id: userId,
      nickname: profile.displayName,         // LINEの表示名
      picture_url: profile.pictureUrl || null, // プロフィール画像URL
      gender: null,                            // チャットから後でAIが抽出
      age: null,                               // 〃
      job_category: null,                      // 〃
      location: null,                          // 〃
      preferences: {},                         // 〃
      past_event_count: 0,
      is_blocked: false,
      registered_at: new Date().toISOString(), // 友達追加日時を記録
      last_interaction: new Date().toISOString(),
    };

    usersDB.set(userId, newUser);
    console.log(`[DB] New user registered:`, newUser);

    // ──────────────────────────────────────────────────────
    // ウェルカムメッセージを送信
    // GIOSTRAとしてのホスピタリティ感ある歓迎文を送る
    // ──────────────────────────────────────────────────────
    await client.pushMessage({
      to: userId,
      messages: [
        {
          type: 'text',
          text: [
            `${profile.displayName} 様、\nGIOSTRAにご登録いただきありがとうございます 🥂`,
            ``,
            `上質なひとときと、素敵な出会いをご提供できるよう、`,
            `専任のコンシェルジュとしてサポートさせていただきます。`,
            ``,
            `いくつかお教えいただけますか？`,
            `・ご年齢 / お仕事`,
            `・お住まいのエリア`,
            `・お好みのお酒など`,
            ``,
            `お気軽にメッセージをどうぞ ✉️`,
          ].join('\n'),
        },
      ],
    });

    return;
  } catch (err) {
    console.error('[Follow] Error fetching profile or sending welcome:', err.message);
  }
}

// -----------------------------------------------------------
// ③ テキストメッセージハンドラ
// 会話からプロファイルを自動抽出してDBを更新する
// -----------------------------------------------------------
async function handleMessage(event, userId) {
  const userMessage = event.message.text;
  console.log(`[Message] userId=${userId}, text="${userMessage}"`);

  // 既存ユーザーがいなければ先にDBへ登録（フォローイベントを逃した場合の保険）
  if (!usersDB.has(userId)) {
    try {
      const profile = await client.getProfile(userId);
      usersDB.set(userId, {
        line_id: userId,
        nickname: profile.displayName,
        picture_url: profile.pictureUrl || null,
        gender: null, age: null, job_category: null, location: null, preferences: {},
        past_event_count: 0, is_blocked: false,
        registered_at: new Date().toISOString(),
        last_interaction: new Date().toISOString(),
      });
    } catch (e) {
      console.error('[Message] Could not fetch profile:', e.message);
    }
  }

  // AIプロファイル抽出（キーワードベースのスタブ → 本番でOpenAIに差し替え）
  const extracted = extractProfileStub(userMessage, userId);

  // DBの該当ユーザーを更新
  if (usersDB.has(userId)) {
    const user = usersDB.get(userId);
    if (extracted.job_category) user.job_category = extracted.job_category;
    if (extracted.location) user.location = extracted.location;
    if (extracted.gender) user.gender = extracted.gender;
    if (extracted.age) user.age = extracted.age;
    if (extracted.alcohol_preference) user.preferences.alcohol = extracted.alcohol_preference;
    user.last_interaction = new Date().toISOString();
    console.log(`[DB] User updated:`, user);
  }

  // 返信
  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [{
      type: 'text',
      text: `ありがとうございます 🙏\nお教えいただいた内容をプロフィールに反映しました。\n今後のイベントご案内にお役立てします ✨`,
    }],
  });
}

// -----------------------------------------------------------
// AIプロファイル抽出スタブ（本番ではOpenAI APIに差し替え）
// -----------------------------------------------------------
function extractProfileStub(message, userId) {
  const result = { userId, job_category: null, location: null, gender: null, age: null, alcohol_preference: null };

  // 職業
  if (/医者|医師|クリニック|病院|看護/.test(message)) result.job_category = '医療';
  else if (/社長|経営|代表|CEO|オーナー/.test(message)) result.job_category = '経営者';
  else if (/モデル|撮影|ファッション/.test(message)) result.job_category = 'モデル';
  else if (/弁護士|法律|司法/.test(message)) result.job_category = '弁護士';
  else if (/CA|客室乗務員|スチュワーデス/.test(message)) result.job_category = 'CA';

  // 居住地
  if (/港区|六本木|麻布|白金|赤坂/.test(message)) result.location = '港区';
  else if (/渋谷|代官山|恵比寿/.test(message)) result.location = '渋谷区';
  else if (/新宿|歌舞伎町|西新宿/.test(message)) result.location = '新宿区';
  else if (/銀座|丸の内|有楽町/.test(message)) result.location = '銀座';

  // 性別
  if (/女性|女の子|彼女|ガール/.test(message)) result.gender = '女';
  else if (/男性|男の子|彼氏|ボーイ/.test(message)) result.gender = '男';

  // 年齢
  const ageMatch = message.match(/(\d{2})\s*歳/);
  if (ageMatch) result.age = parseInt(ageMatch[1]);

  // お酒の好み
  if (/ワイン|シャンパン|スパークリング/.test(message)) result.alcohol_preference = 'ワイン系';
  else if (/ウイスキー|バーボン|スコッチ/.test(message)) result.alcohol_preference = 'ウイスキー系';
  else if (/カクテル|モヒート|カンパリ/.test(message)) result.alcohol_preference = 'カクテル系';

  return result;
}

// -----------------------------------------------------------
// 管理画面API: ユーザー全件取得（友達登録済みのリアルDB）
// -----------------------------------------------------------
app.get('/api/users', (req, res) => {
  const users = Array.from(usersDB.values());
  res.json({ success: true, count: users.length, users });
});

// -----------------------------------------------------------
// 管理画面API: セグメント抽出
// -----------------------------------------------------------
app.post('/api/users/filter', (req, res) => {
  const { minAge, maxAge, jobTags, isAll } = req.body;
  const allUsers = Array.from(usersDB.values()).filter(u => !u.is_blocked);

  const filtered = allUsers.filter(u => {
    if (minAge && u.age && u.age < minAge) return false;
    if (maxAge && u.age && u.age > maxAge) return false;
    if (!isAll && jobTags && jobTags.length > 0 && !jobTags.includes(u.job_category)) return false;
    return true;
  });
  res.json({ success: true, count: filtered.length, users: filtered });
});

// -----------------------------------------------------------
// 管理画面API: AI個別メッセージ生成
// -----------------------------------------------------------
app.post('/api/ai/generateMessages', (req, res) => {
  const { eventText, targetUsers } = req.body;
  const previews = (targetUsers || []).map(u => {
    const greeting = `${u.nickname}様、季節の変わり目いかがお過ごしでしょうか。`;
    return { userId: u.line_id, text: `${greeting}\n\n${eventText}` };
  });
  res.json({ success: true, previews });
});

// -----------------------------------------------------------
// ヘルスチェック
// -----------------------------------------------------------
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    line_channel_id: lineConfig.channelId,
    registered_users: usersDB.size,
    webhook_url: '/api/webhook',
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   GIOSTRA Backend - TEST MODE        ║
  ║   Port     : ${PORT}                    ║
  ║   Webhook  : POST /api/webhook       ║
  ║   Users DB : GET  /api/users         ║
  ║   Health   : GET  /health            ║
  ╚══════════════════════════════════════╝
  `);
});
