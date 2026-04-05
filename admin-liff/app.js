document.addEventListener('DOMContentLoaded', () => {
    const minAgeInput = document.getElementById('minAge');
    const maxAgeInput = document.getElementById('maxAge');
    const minAgeVal = document.getElementById('minAgeVal');
    const maxAgeVal = document.getElementById('maxAgeVal');
    
    const filterBtn = document.getElementById('filterBtn');
    const generateBtn = document.getElementById('generateBtn');
    const eventBody = document.getElementById('eventBody');
    
    const previewSection = document.getElementById('previewSection');
    const previewList = document.getElementById('previewList');
    const targetCount = document.getElementById('targetCount');
    const sendBtn = document.querySelector('.send-btn');
    
    let filteredUsers = [];

    // スライダー連動
    minAgeInput.addEventListener('input', (e) => {
        if (parseInt(e.target.value) > parseInt(maxAgeInput.value)) {
            maxAgeInput.value = e.target.value;
            maxAgeVal.textContent = e.target.value + '歳';
        }
        minAgeVal.textContent = e.target.value + '歳';
    });

    maxAgeInput.addEventListener('input', (e) => {
        if (parseInt(e.target.value) < parseInt(minAgeInput.value)) {
            minAgeInput.value = e.target.value;
            minAgeVal.textContent = e.target.value + '歳';
        }
        maxAgeVal.textContent = e.target.value + '歳';
    });

    eventBody.addEventListener('input', (e) => {
        generateBtn.disabled = e.target.value.trim().length === 0 || filteredUsers.length === 0;
    });

    // フィルタリング処理（Mock backend呼出のシミュレーション）
    filterBtn.addEventListener('click', async () => {
        filterBtn.textContent = '抽出中...';
        filterBtn.disabled = true;

        const maxAge = maxAgeInput.value;
        const minAge = minAgeInput.value;
        
        const jobTags = Array.from(document.querySelectorAll('.tag-checkbox input:checked')).map(el => el.value);

        try {
            // 現状はバックエンドが立ち上がっていない想定でも動くようにFetch＋フォールバック
            let res;
            try {
                res = await fetch('http://localhost:3000/api/users/filter', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ minAge, maxAge, jobTags })
                });
                const data = await res.json();
                filteredUsers = data.users;
            } catch (err) {
                console.warn("Backend not running, using internal dummy data.");
                // ダミーデータでフォールバック
                filteredUsers = [
                    { line_id: 'U1234', nickname: 'Yusuke', gender: '男', age: 35, job_category: '経営者' },
                    { line_id: 'U5678', nickname: 'Kana', gender: '女', age: 28, job_category: 'モデル' }
                ];
            }

            filterBtn.textContent = `完了: ${filteredUsers.length}名を抽出`;
            setTimeout(() => {
                filterBtn.textContent = 'ターゲットを再抽出する';
                filterBtn.disabled = false;
            }, 2000);

            generateBtn.disabled = eventBody.value.trim().length === 0 || filteredUsers.length === 0;

        } catch (error) {
            console.error(error);
            filterBtn.textContent = 'エラー発生';
            filterBtn.disabled = false;
        }
    });

    // AIメッセージ生成
    generateBtn.addEventListener('click', async () => {
        generateBtn.textContent = 'AI生成中...';
        generateBtn.disabled = true;

        try {
            const bodyText = eventBody.value;
            let previews = [];

            try {
                const res = await fetch('http://localhost:3000/api/ai/generateMessages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ eventText: bodyText, targetUsers: filteredUsers })
                });
                const data = await res.json();
                previews = data.previews;
            } catch (err) {
                console.warn("Backend not running, generating mock messages.");
                previews = filteredUsers.map(u => ({
                    userId: u.line_id,
                    text: `${u.nickname}様、春の暖かさが心地よい季節となりましたね。前回お話しした時から少し日が経ちましたが、お元気でしょうか？\n\n${bodyText}`
                }));
            }

            // 表示更新
            previewList.innerHTML = '';
            previews.forEach(p => {
                const div = document.createElement('div');
                div.className = 'preview-card';
                div.innerHTML = p.text.replace(/\n/g, '<br>');
                previewList.appendChild(div);
            });

            targetCount.textContent = `対象: ${previews.length}名`;
            previewSection.style.display = 'block';

            // スクロール
            previewSection.scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            console.error(error);
            alert("生成に失敗しました。");
        } finally {
            generateBtn.textContent = 'AI個別メッセージ再生成';
            generateBtn.disabled = false;
        }
    });

    // 送信シミュレーション
    sendBtn.addEventListener('click', () => {
        const confirmSend = confirm(`${filteredUsers.length}名へ送信しますか？`);
        if (confirmSend) {
            sendBtn.textContent = '送信中...';
            sendBtn.disabled = true;
            setTimeout(() => {
                alert('送信完了しました！');
                sendBtn.textContent = 'LINEで一斉送信する';
                sendBtn.disabled = false;
            }, 1000);
        }
    });
});
