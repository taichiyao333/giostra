const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Dummy user database
const users = [
  { line_id: 'U1234', nickname: 'Yusuke', gender: '男', age: 35, job_category: '経営者', location: '港区' },
  { line_id: 'U5678', nickname: 'Kana', gender: '女', age: 28, job_category: 'モデル', location: '渋谷区' }
];

// 1. プロファイル抽出API (Mock)
app.post('/api/ai/extract', (req, res) => {
  const { message, userId } = req.body;
  // ここでOpenAI APIを呼び出すが、プロトタイプではスタブ
  console.log(`[AI Extract Workflow Started] User: ${userId}, Message: "${message}"`);
  
  // Simulated extraction result
  const extracted = {
    job_category: message.includes('会社') ? '会社員' : '不明',
    preferences: message.includes('ワイン') ? { alcohol: 'ワイン' } : null
  };
  
  res.json({ success: true, extracted });
});

// 2. セグメント抽出API (Mock)
app.post('/api/users/filter', (req, res) => {
  const { minAge, maxAge, jobTags } = req.body;
  const filtered = users.filter(u => {
    let match = true;
    if (minAge && u.age < minAge) match = false;
    if (maxAge && u.age > maxAge) match = false;
    if (jobTags && jobTags.length > 0 && !jobTags.includes(u.job_category)) match = false;
    return match;
  });
  
  res.json({ success: true, count: filtered.length, users: filtered });
});

// 3. パーソナライズ配信生成API (Mock)
app.post('/api/ai/generateMessages', (req, res) => {
  const { eventText, targetUsers } = req.body;
  
  // Here we would use OpenAI to generate personalized intros.
  // Prototype stub:
  const previews = targetUsers.map(u => {
    const greeting = `${u.nickname}様、春の暖かさが心地よい季節となりましたね。前回お話しした時から少し日が経ちましたが、お元気でしょうか？`;
    return {
      userId: u.line_id,
      text: `${greeting}\n\n${eventText}`
    };
  });
  
  res.json({ success: true, previews });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`GIOSTRA Backend Prototype running on port ${PORT}`);
});
