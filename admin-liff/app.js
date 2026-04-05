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

    // ダミーユーザー500名の自動生成
    function generateDummyUsers(count) {
        const namesM = ['Takuya', 'Kenji', 'Yusuke', 'Hiroshi', 'Sho', 'Daiki', 'Naoto', 'Taichi', 'Ryo', 'Kazuki'];
        const namesF = ['Kana', 'Yui', 'Misaki', 'Saki', 'Aoi', 'Rio', 'Miku', 'Miyu', 'Sayaka', 'Erika'];
        const jobs = ['経営者', '医療', 'モデル', 'CA', '会社員', '弁護士'];
        const locations = ['港区', '渋谷区', '新宿区', '中央区', '目黒区', '世田谷区', '銀座'];
        const users = [];

        for (let i = 0; i < count; i++) {
            const isMale = Math.random() > 0.5;
            const nameList = isMale ? namesM : namesF;
            users.push({
                line_id: `U${Math.floor(10000 + Math.random() * 90000)}`,
                nickname: nameList[Math.floor(Math.random() * nameList.length)],
                gender: isMale ? '男' : '女',
                age: Math.floor(20 + Math.random() * 41), // 20歳 - 60歳でランダム
                job_category: jobs[Math.floor(Math.random() * jobs.length)],
                location: locations[Math.floor(Math.random() * locations.length)]
            });
        }
        return users;
    }

    // 初回ロード時に500名のリストを生成
    const allDummyUsers = generateDummyUsers(500);

    // スライダーの連動と表示更新
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

    // フィルタリング処理（500名のダミーデータから指定条件で抽出）
    filterBtn.addEventListener('click', () => {
        filterBtn.textContent = '抽出中...';
        filterBtn.disabled = true;

        const maxAge = parseInt(maxAgeInput.value);
        const minAge = parseInt(minAgeInput.value);
        
        const jobTags = Array.from(document.querySelectorAll('.tag-checkbox input:checked')).map(el => el.value);

        // API通信の代わりにsetTimeoutで処理時間を擬似的に演出
        setTimeout(() => {
            filteredUsers = allDummyUsers.filter(u => {
                if (u.age < minAge || u.age > maxAge) return false;
                if (jobTags.length > 0 && !jobTags.includes(u.job_category)) return false;
                return true;
            });

            filterBtn.textContent = `完了: ${filteredUsers.length}名を抽出`;
            
            // 少し待ってから元のテキストに戻す
            setTimeout(() => {
                filterBtn.textContent = 'ターゲットを再抽出する';
                filterBtn.disabled = false;
            }, 1000);

            generateBtn.disabled = eventBody.value.trim().length === 0 || filteredUsers.length === 0;
        }, 600); 
    });

    // AIメッセージ生成のシミュレーション
    generateBtn.addEventListener('click', () => {
        generateBtn.textContent = 'AI生成中...';
        generateBtn.disabled = true;

        const bodyText = eventBody.value;
        const messages = [];

        // API通信の代わりにsetTimeoutでAIの思考時間を演出
        setTimeout(() => {
            filteredUsers.forEach(u => {
                // ペルソナに合わせた挨拶のバリエーションをランダムに割り当て
                const greetings = [
                    `${u.nickname}様、春の暖かさが心地よい季節となりましたね。お変わりありませんか？`,
                    `お世話になっております、${u.nickname}様。最近は${u.location}界隈に行かれましたか？`,
                    `${u.nickname}さん、こんにちは！お仕事（${u.job_category}）はお忙しいでしょうか？`,
                    `ご無沙汰しております、${u.nickname}様。素敵な週末をお過ごしですか？`
                ];
                const g = greetings[Math.floor(Math.random() * greetings.length)];
                
                messages.push({
                    text: `${g}\n\n${bodyText}`,
                    ...u // ユーザー情報もプレビュー表示用に付加
                });
            });

            // プレビューの表示更新
            previewList.innerHTML = '';
            
            // 高負荷を防ぐため画面には最大20件まで表示
            const displayLimit = Math.min(messages.length, 20);
            for (let i = 0; i < displayLimit; i++) {
                const msg = messages[i];
                const div = document.createElement('div');
                div.className = 'preview-card';
                // 属性情報と生成テキストを整形して表示
                div.innerHTML = `
                    <div style="font-size:0.8rem; color:var(--accent-gold); margin-bottom:8px;">
                        [${msg.gender} / ${msg.age}歳 / ${msg.job_category} / ${msg.location}]
                    </div>
                    ${msg.text.replace(/\n/g, '<br>')}
                `;
                previewList.appendChild(div);
            }

            if (messages.length > displayLimit) {
                 const div = document.createElement('div');
                 div.style.textAlign = 'center';
                 div.style.marginTop = '15px';
                 div.style.color = 'var(--text-sub)';
                 div.style.fontSize = '0.9rem';
                 div.innerText = `...他 ${messages.length - displayLimit} 名に個別生成されたメッセージが配信されます`;
                 previewList.appendChild(div);
            }

            targetCount.textContent = `対象: ${messages.length}名`;
            previewSection.style.display = 'block';

            // プレビュー部分へスクロール
            previewSection.scrollIntoView({ behavior: 'smooth' });

            generateBtn.textContent = 'AI個別メッセージ再生成';
            generateBtn.disabled = false;
        }, 1200); 
    });

    // 一斉送信シミュレーション
    sendBtn.addEventListener('click', () => {
        const confirmSend = confirm(`AIが生成した個別メッセージを${filteredUsers.length}名に送信しますか？`);
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
