// 日記データの管理（Firebase Firestore を利用）
class DiaryManager {
    constructor(user) {
        this.user = user;
        this.uid = user.uid;
        this.entries = [];
        this.editingId = null;
        this.init();
    }

    async init() {
        // 今日の日付をデフォルトに設定
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('diary-date').value = today;

        // イベントリスナーの設定
        document.getElementById('save-btn').addEventListener('click', () => this.saveEntry());
        document.getElementById('clear-btn').addEventListener('click', () => this.clearForm());
        document.getElementById('clear-all-btn').addEventListener('click', () => this.clearAllEntries());
        
        // 参照モーダルのイベント
        const viewCloseBtn = document.getElementById('diary-view-close-btn');
        if (viewCloseBtn) {
            viewCloseBtn.addEventListener('click', () => this.closeViewModal());
        }
        const viewModal = document.getElementById('diary-view-modal');
        if (viewModal) {
            viewModal.addEventListener('click', (e) => {
                if (e.target === viewModal) {
                    this.closeViewModal();
                }
            });
        }

        // エンターキーで保存（Ctrl+Enter）
        document.getElementById('diary-content').addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.saveEntry();
            }
        });

        // Firestore から初期データ読み込み
        await this.loadEntriesFromFirestore();

        // 以前の localStorage データが残っていれば一度だけ移行
        await this.migrateFromLocalIfNeeded();

        this.renderEntries();
        this.attachCalendarClickEvents();
    }

    async loadEntriesFromFirestore() {
        try {
            const snapshot = await db
                .collection('users')
                .doc(this.uid)
                .collection('entries')
                .orderBy('date', 'desc')
                .get();

            this.entries = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (e) {
            console.error('日記データの読み込みに失敗しました:', e);
            this.entries = [];
        }
    }

    /**
     * 以前のローカル保存（localStorage）の日記を
     * Firestore に一度だけ移行する
     */
    async migrateFromLocalIfNeeded() {
        try {
            const migratedFlagKey = `fluffyDiaryMigrated_${this.uid}`;
            if (localStorage.getItem(migratedFlagKey)) {
                return; // すでに移行済み
            }

            const stored = localStorage.getItem('fluffyDiaryEntries');
            if (!stored) return;

            let localEntries;
            try {
                localEntries = JSON.parse(stored);
            } catch {
                return;
            }
            if (!Array.isArray(localEntries) || localEntries.length === 0) return;

            // すでに Firestore にデータがある場合は重複を避ける
            if (this.entries.length > 0) {
                localStorage.setItem(migratedFlagKey, '1');
                return;
            }

            const batch = db.batch();
            const colRef = db.collection('users').doc(this.uid).collection('entries');

            localEntries.forEach((e) => {
                const id = e.id || colRef.doc().id;
                const nowIso = new Date().toISOString();
                const docRef = colRef.doc(id);
                batch.set(docRef, {
                    id,
                    date: e.date,
                    content: e.content,
                    createdAt: e.createdAt || nowIso,
                    updatedAt: e.updatedAt || nowIso
                });
            });

            await batch.commit();

            // Firestore から再読み込み
            await this.loadEntriesFromFirestore();

            // 二重移行を防ぐためフラグを立てる
            localStorage.setItem(migratedFlagKey, '1');
        } catch (e) {
            console.error('ローカル日記データの移行に失敗しました:', e);
        }
    }

    async saveEntry() {
        const dateInput = document.getElementById('diary-date');
        const contentInput = document.getElementById('diary-content');

        const date = dateInput.value;
        const content = contentInput.value.trim();

        if (!date) {
            alert('日付を選択してください 📅');
            dateInput.focus();
            return;
        }

        if (!content) {
            alert('日記の内容を入力してください ✍️');
            contentInput.focus();
            return;
        }

        const nowIso = new Date().toISOString();

        let id = this.editingId || null;
        let createdAt = nowIso;

        if (this.editingId) {
            // 既存エントリの createdAt を保持
            const existing = this.entries.find(e => e.id === this.editingId);
            if (existing && existing.createdAt) {
                createdAt = existing.createdAt;
            }
        } else {
            // 同じ日付のエントリーがあるかチェック
            const existing = this.entries.find(e => e.date === date);
            if (existing) {
                if (confirm('この日付の日記が既に存在します。上書きしますか？')) {
                    id = existing.id;
                    createdAt = existing.createdAt || nowIso;
                } else {
                    return;
                }
            }
        }

        if (!id) {
            id = db.collection('users').doc(this.uid)
                .collection('entries').doc().id;
        }

        const entry = {
            id,
            date,
            content,
            createdAt,
            updatedAt: nowIso
        };

        try {
            await db.collection('users')
                .doc(this.uid)
                .collection('entries')
                .doc(id)
                .set(entry);

            // ローカル配列を更新
            const index = this.entries.findIndex(e => e.id === id);
            if (index !== -1) {
                this.entries[index] = entry;
            } else {
                this.entries.push(entry);
            }

            // 日付でソート（新しい順）
            this.entries.sort((a, b) => new Date(b.date) - new Date(a.date));

            this.editingId = null;
            document.getElementById('save-btn').textContent = '保存する';
            this.clearForm();
            this.renderEntries();
            
            // カレンダーの日付セルにクリックイベントを追加
            this.attachCalendarClickEvents();
        } catch (e) {
            console.error('日記の保存に失敗しました:', e);
            alert('日記の保存に失敗しました。通信状況を確認してください。');
        }

        // 保存成功のフィードバック
        const saveBtn = document.getElementById('save-btn');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = '保存しました！';
        saveBtn.style.background = 'linear-gradient(135deg, #90EE90 0%, #98FB98 100%)';
        setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.style.background = '';
        }, 2000);
    }

    clearForm() {
        document.getElementById('diary-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('diary-content').value = '';
        this.editingId = null;
        document.getElementById('save-btn').textContent = '保存する';
    }

    editEntry(id) {
        const entry = this.entries.find(e => e.id === id);
        if (!entry) return;

        document.getElementById('diary-date').value = entry.date;
        document.getElementById('diary-content').value = entry.content;
        this.editingId = id;
        document.getElementById('save-btn').textContent = '更新する';

        // エディタにスクロール
        document.querySelector('.diary-editor').scrollIntoView({ behavior: 'smooth', block: 'start' });
        document.getElementById('diary-content').focus();
    }

    async deleteEntry(id) {
        if (!confirm('この日記を削除しますか？この操作は元に戻せません。')) {
            return;
        }
        try {
            await db.collection('users')
                .doc(this.uid)
                .collection('entries')
                .doc(id)
                .delete();

            this.entries = this.entries.filter(e => e.id !== id);
            this.renderEntries();
            this.attachCalendarClickEvents();
        } catch (e) {
            console.error('日記の削除に失敗しました:', e);
            alert('日記の削除に失敗しました。通信状況を確認してください。');
        }
    }

    attachCalendarClickEvents() {
        // カレンダーの日付セルにクリックイベントを追加
        const calendarDays = document.querySelectorAll('.diary-calendar-day-has-entry');
        calendarDays.forEach(dayEl => {
            const dateStr = dayEl.getAttribute('data-date');
            if (dateStr) {
                const entry = this.entries.find(e => e.date === dateStr);
                if (entry) {
                    dayEl.style.cursor = 'pointer';
                    dayEl.addEventListener('click', () => {
                        this.viewEntry(entry.id);
                    });
                }
            }
        });
    }

    async clearAllEntries() {
        if (this.entries.length === 0) {
            alert('削除する日記がありません 📝');
            return;
        }

        if (!confirm(`すべての日記（${this.entries.length}件）を削除しますか？この操作は元に戻せません。`)) {
            return;
        }

        try {
            const batch = db.batch();
            const colRef = db.collection('users').doc(this.uid).collection('entries');
            const snapshot = await colRef.get();
            snapshot.forEach(doc => batch.delete(doc.ref));
            await batch.commit();

            this.entries = [];
            this.renderEntries();
            this.clearForm();
            this.attachCalendarClickEvents();
        } catch (e) {
            console.error('すべての日記の削除に失敗しました:', e);
            alert('削除に失敗しました。通信状況を確認してください。');
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString + 'T00:00:00');
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
        const weekday = weekdays[date.getDay()];
        
        return `${year}年${month}月${day}日（${weekday}）`;
    }

    renderEntries() {
        const container = document.getElementById('diary-entries');
        
        if (this.entries.length === 0) {
            container.innerHTML = '<div class="empty-message">まだ日記がありません。<br>今日の気持ちを綴ってみませんか？💕</div>';
            return;
        }

        // 日記を日付でマッピング
        const entriesByDate = {};
        this.entries.forEach(entry => {
            entriesByDate[entry.date] = entry;
        });

        // カレンダー形式で表示
        container.innerHTML = this.renderCalendar(entriesByDate);
    }

    renderCalendar(entriesByDate) {
        // 日記がある日付の範囲を取得
        const dates = Object.keys(entriesByDate).sort();
        if (dates.length === 0) {
            return '<div class="empty-message">まだ日記がありません。<br>今日の気持ちを綴ってみませんか？💕</div>';
        }

        const firstDate = new Date(dates[0] + 'T00:00:00');
        const lastDate = new Date(dates[dates.length - 1] + 'T00:00:00');
        
        // 月ごとにグループ化
        const months = [];
        let currentMonth = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
        const endMonth = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 0);

        while (currentMonth <= endMonth) {
            const year = currentMonth.getFullYear();
            const month = currentMonth.getMonth();
            const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
            
            // その月の最初の日と最後の日を取得
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            
            // その月の日記がある日を取得
            const monthEntries = dates.filter(date => {
                const d = new Date(date + 'T00:00:00');
                return d.getFullYear() === year && d.getMonth() === month;
            });

            if (monthEntries.length > 0) {
                months.push({
                    year,
                    month,
                    monthKey,
                    firstDay,
                    lastDay,
                    entries: monthEntries
                });
            }

            // 次の月へ
            currentMonth = new Date(year, month + 1, 1);
        }

        // 各月のカレンダーを生成
        return months.map(monthData => this.renderMonthCalendar(monthData, entriesByDate)).join('');
    }

    renderMonthCalendar(monthData, entriesByDate) {
        const { year, month, firstDay, lastDay, entries } = monthData;
        const monthLabel = `${year}年${month + 1}月`;
        
        // 週の開始日（日曜日）を取得
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - startDate.getDay());
        
        // 週の終了日（土曜日）を取得
        const endDate = new Date(lastDay);
        endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

        // カレンダーの日付を生成
        const calendarDays = [];
        const currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
            const dateStr = this.formatDateString(currentDate);
            const isCurrentMonth = currentDate.getMonth() === month;
            const hasEntry = entries.includes(dateStr);
            const entry = hasEntry ? entriesByDate[dateStr] : null;
            
            // 日記の最初の内容を取得（改行や空白を削除して、最大30文字）
            let previewText = '';
            if (entry && entry.content) {
                previewText = entry.content
                    .replace(/\n/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .substring(0, 45);
                if (entry.content.length > 30) {
                    previewText += '...';
                }
            }
            
            calendarDays.push({
                date: new Date(currentDate),
                dateStr,
                isCurrentMonth,
                hasEntry,
                entry,
                previewText
            });
            
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // 週ごとにグループ化
        const weeks = [];
        for (let i = 0; i < calendarDays.length; i += 7) {
            weeks.push(calendarDays.slice(i, i + 7));
        }

        let html = `
            <div class="diary-calendar-month">
                <h3 class="diary-calendar-month-title">${monthLabel}</h3>
                <div class="diary-calendar-weekdays">
                    <div class="diary-calendar-weekday">日</div>
                    <div class="diary-calendar-weekday">月</div>
                    <div class="diary-calendar-weekday">火</div>
                    <div class="diary-calendar-weekday">水</div>
                    <div class="diary-calendar-weekday">木</div>
                    <div class="diary-calendar-weekday">金</div>
                    <div class="diary-calendar-weekday">土</div>
                </div>
                <div class="diary-calendar-weeks">
        `;

        weeks.forEach(week => {
            html += '<div class="diary-calendar-week">';
            week.forEach(day => {
                const dayClass = [
                    'diary-calendar-day',
                    day.isCurrentMonth ? 'diary-calendar-day-current-month' : 'diary-calendar-day-other-month',
                    day.hasEntry ? 'diary-calendar-day-has-entry' : ''
                ].filter(Boolean).join(' ');
                
                html += `
                    <div class="${dayClass}" data-date="${day.dateStr}">
                        <div class="diary-calendar-day-number">${day.date.getDate()}</div>
                        ${day.hasEntry ? `<div class="diary-calendar-day-preview">${this.escapeHtml(day.previewText)}</div>` : ''}
                    </div>
                `;
            });
            html += '</div>';
        });

        html += `
                </div>
            </div>
        `;

        return html;
    }

    formatDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    viewEntry(id) {
        const entry = this.entries.find(e => e.id === id);
        if (!entry) return;

        const modal = document.getElementById('diary-view-modal');
        const dateEl = document.getElementById('diary-view-date');
        const contentEl = document.getElementById('diary-view-content');
        const editBtn = document.getElementById('diary-view-edit-btn');
        const deleteBtn = document.getElementById('diary-view-delete-btn');

        if (dateEl) dateEl.textContent = `📅 ${this.formatDate(entry.date)}`;
        if (contentEl) contentEl.innerHTML = this.escapeHtml(entry.content).replace(/\n/g, '<br>');
        
        // 編集・削除ボタンのイベントを設定
        if (editBtn) {
            editBtn.onclick = () => {
                this.closeViewModal();
                this.editEntry(id);
            };
        }
        if (deleteBtn) {
            deleteBtn.onclick = () => {
                this.closeViewModal();
                this.deleteEntry(id);
            };
        }

        if (modal) {
            modal.classList.add('is-open');
            modal.setAttribute('aria-hidden', 'false');
        }
    }

    closeViewModal() {
        const modal = document.getElementById('diary-view-modal');
        if (modal) {
            modal.classList.remove('is-open');
            modal.setAttribute('aria-hidden', 'true');
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML.replace(/\n/g, '<br>');
    }
}

// マスタメンテ設定の管理
class MasterSettings {
    constructor() {
        this.storageKey = 'fluffyDiarySettings';
        this.titleElement = document.getElementById('page-title');
        this.userNameDisplay = document.getElementById('user-name-display');
        this.masterPanel = document.getElementById('master-panel');
        this.masterOpenBtn = document.getElementById('master-btn');
        this.masterCloseBtn = document.getElementById('master-close-btn');
        this.masterCancelBtn = document.getElementById('master-cancel-btn');
        this.masterSaveBtn = document.getElementById('master-save-btn');
        this.inputTitle = document.getElementById('master-page-title');
        this.inputUserName = document.getElementById('master-user-name');

        this.settings = this.loadSettings();
        this.applySettings();
        this.attachEvents();
    }

    loadSettings() {
        const stored = localStorage.getItem(this.storageKey);
        if (!stored) return { title: '日記帳', userName: '' };
        try {
            const parsed = JSON.parse(stored);
            return {
                title: parsed.title || '日記帳',
                userName: parsed.userName || ''
            };
        } catch (e) {
            console.error('マスタ設定の読み込みに失敗しました:', e);
            return { title: '日記帳', userName: '' };
        }
    }

    saveSettings() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
        } catch (e) {
            console.error('マスタ設定の保存に失敗しました:', e);
        }
    }

    applySettings() {
        if (this.titleElement) {
            this.titleElement.textContent = this.settings.title || '日記帳';
        }
        document.title = this.settings.title || '日記帳';

        if (this.userNameDisplay) {
            if (this.settings.userName && this.settings.userName.trim() !== '') {
                this.userNameDisplay.textContent = `なまえ：${this.settings.userName.trim()}`;
            } else {
                this.userNameDisplay.textContent = '';
            }
        }
    }

    openPanel() {
        if (!this.masterPanel) return;
        this.inputTitle.value = this.settings.title || '日記帳';
        this.inputUserName.value = this.settings.userName || '';
        this.masterPanel.classList.add('is-open');
        this.masterPanel.setAttribute('aria-hidden', 'false');
        this.inputTitle.focus();
    }

    closePanel() {
        if (!this.masterPanel) return;
        this.masterPanel.classList.remove('is-open');
        this.masterPanel.setAttribute('aria-hidden', 'true');
    }

    attachEvents() {
        if (this.masterOpenBtn) {
            this.masterOpenBtn.addEventListener('click', () => this.openPanel());
        }
        if (this.masterCloseBtn) {
            this.masterCloseBtn.addEventListener('click', () => this.closePanel());
        }
        if (this.masterCancelBtn) {
            this.masterCancelBtn.addEventListener('click', () => this.closePanel());
        }
        if (this.masterSaveBtn) {
            this.masterSaveBtn.addEventListener('click', () => {
                const newTitle = this.inputTitle.value.trim();
                const newName = this.inputUserName.value.trim();
                this.settings.title = newTitle || '日記帳';
                this.settings.userName = newName;
                this.saveSettings();
                this.applySettings();
                this.closePanel();
            });
        }
        if (this.masterPanel) {
            this.masterPanel.addEventListener('click', (e) => {
                if (e.target === this.masterPanel) {
                    this.closePanel();
                }
            });
        }
    }
}

// アプリケーションの初期化
let diaryManager;
let masterSettings;
document.addEventListener('DOMContentLoaded', () => {
    // Firebase Auth で未ログインならメールログイン画面へ
    auth.onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        diaryManager = new DiaryManager(user);
        masterSettings = new MasterSettings();

        // ナビゲーションボタンはリンク（<a>タグ）に変更したため、イベントリスナーは不要
    });
});

