document.addEventListener('DOMContentLoaded', () => {
    // タブ切り替え処理
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // タブボタンのアクティブ状態を切り替え
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // 表示コンテンツを切り替え
            const targetId = btn.getAttribute('data-target');
            tabContents.forEach(content => {
                if (content.id === targetId) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });
        });
    });

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
    
    const userTableBody = document.getElementById('userTableBody');
    const totalUsersStat = document.getElementById('totalUsersStat');

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
                location: locations[Math.floor(Math.random() * locations.length)],
                // 今回追加：過去のイベント参加回数をランダムに付与（0回〜7回）
                past_event_count: Math.floor(Math.random() * 8)
            });
        }
        return users;
    }

    // 初回ロード時に500名のリストを生成
    const allDummyUsers = generateDummyUsers(500);

    // イベント管理用の処理（次回のイベント参加者リスト）
    function setupEventManagement(users) {
        const eventSelect = document.getElementById('eventSelect');
        const eventTableBody = document.getElementById('eventTableBody');
        const eventStats = document.getElementById('eventStats');

        // イベントタブの描画用関数
        function renderEvent(isPast) {
            // ダミーとしてランダムな参加者（35〜55名）を抽出
            const shuffled = [...users].sort(() => 0.5 - Math.random());
            const participantCount = Math.floor(35 + Math.random() * 20);
            const eventParticipants = shuffled.slice(0, participantCount);

            eventTableBody.innerHTML = '';
            let firstTimers = 0;

            // 過去参加回数でソート (初参加を上に)
            eventParticipants.sort((a,b) => a.past_event_count - b.past_event_count);

            eventParticipants.forEach(u => {
                if (u.past_event_count === 0) firstTimers++;

                const statusBadge = u.past_event_count === 0 
                    ? '<span class="badge-new">✨ 初参加</span>' 
                    : `<span class="badge-regular">既面 (常連)</span>`;
                    
                const timesStr = u.past_event_count === 0 ? '0回' : `${u.past_event_count}回`;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${u.nickname}</strong><br><span style="font-size:0.7rem; color:var(--text-sub);">${u.line_id}</span></td>
                    <td>${u.gender} <span style="font-size:0.75rem;">${u.age}歳</span></td>
                    <td><span class="badge" style="padding:2px 6px; font-size:0.7rem;">${u.job_category}</span><br><span style="font-size:0.75rem;">${u.location}</span></td>
                    <td>${statusBadge}</td>
                    <td style="text-align:center; font-weight:bold; color:var(--accent-gold);">${timesStr}</td>
                `;
                eventTableBody.appendChild(tr);
            });
            eventStats.innerHTML = `参加人数: <strong>${eventParticipants.length}名</strong> (うち初参加: <strong style="color:#fca5a5;">${firstTimers}名</strong>)`;
        }

        // 初期描画
        renderEvent(false);

        // セレクトボックス変更時にもう一度ランダム抽出して擬似的に切り替え
        if (eventSelect) {
            eventSelect.addEventListener('change', () => {
                const isPast = eventSelect.value === 'e2';
                renderEvent(isPast);
            });
        }
    }
    setupEventManagement(allDummyUsers);

    // ユーザー一覧タブに500名を表示する処理
    function renderUserTable(users) {
        userTableBody.innerHTML = '';
        users.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="color:var(--text-sub);">${u.line_id}</td>
                <td><strong>${u.nickname}</strong></td>
                <td>${u.gender}</td>
                <td>${u.age}歳</td>
                <td><span class="badge" style="padding:2px 8px; font-size:0.75rem;">${u.job_category}</span></td>
                <td>${u.location}</td>
            `;
            userTableBody.appendChild(tr);
        });
        totalUsersStat.textContent = `全体: ${users.length}名`;
    }
    renderUserTable(allDummyUsers);

    // ----------------------------------------------------
    // 以下、ステップ1＆2（配信設定・プレビュー・抽出関連）の処理
    // ----------------------------------------------------

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

    // フィルタリング処理
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
            
            // UXのヒントを隠して次ステップを表示する
            const demoNote2 = document.getElementById('demo-note-2');
            if (demoNote2 && filteredUsers.length > 0) {
                demoNote2.style.display = 'block';
            }
        }, 600); 
    });

    // AIメッセージ生成のシミュレーション
    generateBtn.addEventListener('click', () => {
        generateBtn.textContent = 'AI生成中...';
        generateBtn.disabled = true;

        const bodyText = eventBody.value;
        const messages = [];

        setTimeout(() => {
            filteredUsers.forEach(u => {
                const greetings = [
                    `${u.nickname}様、春の暖かさが心地よい季節となりましたね。お変わりありませんか？`,
                    `お世話になっております、${u.nickname}様。最近は${u.location}界隈に行かれましたか？`,
                    `${u.nickname}さん、こんにちは！お仕事（${u.job_category}）はお忙しいでしょうか？`,
                    `ご無沙汰しております、${u.nickname}様。素敵な週末をお過ごしですか？`
                ];
                const g = greetings[Math.floor(Math.random() * greetings.length)];
                
                messages.push({
                    text: `${g}\n\n${bodyText}`,
                    ...u
                });
            });

            previewList.innerHTML = '';
            
            const displayLimit = Math.min(messages.length, 20);
            for (let i = 0; i < displayLimit; i++) {
                const msg = messages[i];
                const div = document.createElement('div');
                div.className = 'preview-card';
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

    // 初期状態：イベント本文の入力がないのでAI生成ボタンは無効化、ステップ2説明を非表示
    const demoNote2 = document.getElementById('demo-note-2');
    if (demoNote2) demoNote2.style.display = 'none';
});
