document.addEventListener('DOMContentLoaded', () => {
    // タブ切り替え処理
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

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
                past_event_count: Math.floor(Math.random() * 8)
            });
        }
        return users;
    }

    const allDummyUsers = generateDummyUsers(500);

    // デモ用: 2人のユーザーが過去に何回会ったか（ハッシュで適当に計算）
    function getMeetingCount(u1, u2) {
        if (u1.past_event_count === 0 || u2.past_event_count === 0) return 0;
        const id1 = parseInt(u1.line_id.replace('U', ''));
        const id2 = parseInt(u2.line_id.replace('U', ''));
        const hash = (id1 + id2) % 10;
        
        // 確率分布: 60%会ってない, 20%は1回, 10%は2回, 10%は3回
        if (hash < 6) return 0;
        if (hash < 8) return 1;
        if (hash < 9) return 2;
        return 3;
    }

    // イベント管理用の処理
    function setupEventManagement(users) {
        const eventSelect = document.getElementById('eventSelect');
        const eventTableBody = document.getElementById('eventTableBody');
        const eventStats = document.getElementById('eventStats');
        const mutualUserSelect = document.getElementById('mutualUserSelect');
        const mutualResult = document.getElementById('mutualResult');

        let currentEventParticipants = [];

        function renderEvent(isPast) {
            // ランダムに35〜55人抽出
            const shuffled = [...users].sort(() => 0.5 - Math.random());
            const participantCount = Math.floor(35 + Math.random() * 20);
            currentEventParticipants = shuffled.slice(0, participantCount);

            eventTableBody.innerHTML = '';
            let firstTimers = 0;

            // 過去参加回数でソート (初参加を上に)
            currentEventParticipants.sort((a,b) => a.past_event_count - b.past_event_count);

            currentEventParticipants.forEach(u => {
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
            eventStats.innerHTML = `参加人数: <strong>${currentEventParticipants.length}名</strong> (うち初参加: <strong style="color:#fca5a5;">${firstTimers}名</strong>)`;

            // ▼ 追加：遭遇チェックプルダウンの更新 ▼
            mutualUserSelect.innerHTML = '<option value="">参加者を選択してください...</option>';
            currentEventParticipants.forEach(u => {
                const opt = document.createElement('option');
                opt.value = u.line_id;
                opt.textContent = `${u.nickname} (${u.gender}/${u.age}歳 - ${u.job_category})`;
                mutualUserSelect.appendChild(opt);
            });
            mutualResult.style.display = 'none';
        }

        // 初期描画
        renderEvent(false);

        // イベント切替時の再生成
        if (eventSelect) {
            eventSelect.addEventListener('change', () => {
                const isPast = eventSelect.value === 'e2';
                renderEvent(isPast);
            });
        }

        // ▼ 追加：相互遭遇履歴の計算と表示 ▼
        if (mutualUserSelect) {
            mutualUserSelect.addEventListener('change', (e) => {
                const selectedId = e.target.value;
                if (!selectedId) {
                    mutualResult.style.display = 'none';
                    return;
                }

                const targetUser = currentEventParticipants.find(u => u.line_id === selectedId);
                const results = [];

                currentEventParticipants.forEach(otherUser => {
                    if (otherUser.line_id === targetUser.line_id) return;
                    const count = getMeetingCount(targetUser, otherUser);
                    if (count > 0) {
                        results.push({ user: otherUser, count });
                    }
                });

                // 多い順にソート
                results.sort((a,b) => b.count - a.count);

                let html = `<h4 style="color:var(--accent-gold); margin-bottom:12px; font-size:1rem; border-bottom:1px solid rgba(212,175,55,0.3); padding-bottom:6px;">
                                [${targetUser.nickname}] 様と他の参加者の遭遇履歴
                            </h4>`;
                
                if (results.length === 0) {
                    html += `<p style="font-size:0.9rem; color:var(--text-sub);">他の参加者とは全員「初対面」です！</p>`;
                } else {
                    html += `<ul style="list-style:none; padding:0; font-size:0.85rem;">`;
                    results.forEach(r => {
                        // 2回以上会っていると警告色
                        const isWarning = r.count >= 2;
                        const bgStyle = isWarning ? 'background:rgba(239, 68, 68, 0.1); border-left:3px solid #ef4444;' : 'border-left:3px solid var(--accent-gold);';
                        const textStyle = isWarning ? 'color:#ef4444; font-weight:bold;' : 'color:var(--text-main); font-weight:bold;';
                        const alertIcon = isWarning ? '⚠️要注意 (NGペア可能性)' : '';

                        html += `
                            <li style="margin-bottom:8px; padding:8px 12px; border-radius:4px; background:rgba(255,255,255,0.05); ${bgStyle}">
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <span>${r.user.nickname} 様 (${r.user.gender}/${r.user.job_category})</span>
                                    <span style="${textStyle}">遭遇 ${r.count} 回 ${alertIcon}</span>
                                </div>
                            </li>
                        `;
                    });
                    const noMetCount = currentEventParticipants.length - 1 - results.length;
                    html += `
                        <li style="margin-top:12px; padding:8px 12px; color:var(--text-sub);">
                            ※他 ${noMetCount}名 の参加者とは初対面です。
                        </li>
                    </ul>`;
                }

                mutualResult.innerHTML = html;
                mutualResult.style.display = 'block';
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
    // 配信設定・プレビュー・抽出処理
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

    eventBody.addEventListener('input', () => checkGenerateReady());
    if (document.getElementById('msgTitle')) {
        document.getElementById('msgTitle').addEventListener('input', () => checkGenerateReady());
    }

    function checkGenerateReady() {
        const hasBody = eventBody && eventBody.value.trim().length > 0;
        const hasTitle = !document.getElementById('msgTitle') || document.getElementById('msgTitle').value.trim().length > 0;
        generateBtn.disabled = !hasBody || !hasTitle || filteredUsers.length === 0;
    }

    // 全員タグのトグル処理：全員をオンにすると他のタグを無効化
    const tagAllInput = document.getElementById('tagAll');
    const otherTagInputs = document.querySelectorAll('.tag-checkbox:not(.tag-all) input[type="checkbox"]');
    if (tagAllInput) {
        tagAllInput.addEventListener('change', () => {
            otherTagInputs.forEach(cb => {
                cb.disabled = tagAllInput.checked;
                cb.closest('.tag-checkbox').classList.toggle('tag-other-disabled', tagAllInput.checked);
                if (tagAllInput.checked) cb.checked = false;
            });
        });
    }

    // 配信タイミングのラジオ切り替えによる日時指定入力の表示切り替え
    const scheduleInput = document.getElementById('scheduleTime');
    document.querySelectorAll('input[name="sendTiming"]').forEach(radio => {
        radio.addEventListener('change', () => {
            if (scheduleInput) scheduleInput.style.display = radio.value === 'schedule' ? 'block' : 'none';
        });
    });

    filterBtn.addEventListener('click', () => {
        filterBtn.textContent = '抽出中...';
        filterBtn.disabled = true;

        const maxAge = parseInt(maxAgeInput.value);
        const minAge = parseInt(minAgeInput.value);

        // 全員タグがオンなら年齢以外のフィルターは無効
        const isAll = tagAllInput && tagAllInput.checked;
        const jobTags = isAll ? [] : Array.from(document.querySelectorAll('.tag-checkbox:not(.tag-all) input:checked')).map(el => el.value);

        // API通信の代わりにsetTimeoutで処理時間を擬似的に演出
        setTimeout(() => {
            filteredUsers = allDummyUsers.filter(u => {
                if (u.age < minAge || u.age > maxAge) return false;
                // 全員またはタグなしの場合は年齢のみで絞り込み
                if (!isAll && jobTags.length > 0 && !jobTags.includes(u.job_category)) return false;
                return true;
            });

            filterBtn.textContent = `完了: ${filteredUsers.length}名を抽出`;
            
            // 少し待ってから元のテキストに戻す
            setTimeout(() => {
                filterBtn.textContent = 'ターゲットを再抽出する';
                filterBtn.disabled = false;
            }, 1000);

            checkGenerateReady();
            
            const demoNote2 = document.getElementById('demo-note-2');
            if (demoNote2 && filteredUsers.length > 0) demoNote2.style.display = 'block';
        }, 600); 
    });

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

    const demoNote2 = document.getElementById('demo-note-2');
    if (demoNote2) demoNote2.style.display = 'none';
});
