// remindodo: Firebase Firestore を使ったToDo管理
// コレクション構造: users/{uid}/todos/{todoId}

// Firebaseのauthとdbを取得（グローバルから）
const auth = window.auth || (typeof firebase !== 'undefined' ? firebase.auth() : null);
const db = window.db || (typeof firebase !== 'undefined' ? firebase.firestore() : null);

class RemindodoManager {
    constructor(user) {
        this.user = user;
        this.uid = user.uid;
        this.todos = [];
        this.editingId = null;
        this.timers = new Map(); // id -> intervalId
        this.priorityMode = false;
        this.nextPriorityNumber = 1;

        this.init();
    }

    async init() {
        // 要素取得
        this.textInput = document.getElementById('todo-text');
        this.remindAtInput = document.getElementById('todo-remind-at');
        this.trackTimeCheckbox = document.getElementById('todo-track-time');
        this.addBtn = document.getElementById('add-todo-btn');
        this.clearFormBtn = document.getElementById('clear-todo-form-btn');
        this.clearAllBtn = document.getElementById('clear-all-todos-btn');
        this.reorderBtn = document.getElementById('reorder-todos-btn');
        this.priorityModeBtn = document.getElementById('priority-mode-btn');
        this.goDiaryBtn = document.getElementById('go-diary-btn');
        this.listContainer = document.getElementById('todo-entries');
        this.priorityContainer = document.getElementById('priority-entries');

        this.attachEvents();

        // Firestore から初期データ読み込み
        await this.loadTodosFromFirestore();
        this.renderTodos();
    }

    attachEvents() {
        if (this.addBtn) {
            this.addBtn.addEventListener('click', () => this.saveTodo());
        }
        if (this.clearFormBtn) {
            this.clearFormBtn.addEventListener('click', () => this.clearForm());
        }
        if (this.clearAllBtn) {
            this.clearAllBtn.addEventListener('click', () => this.clearAllTodos());
        }
        if (this.reorderBtn) {
            this.reorderBtn.addEventListener('click', () => this.reorderTodos());
        }
        if (this.priorityModeBtn) {
            this.priorityModeBtn.addEventListener('click', () => this.togglePriorityMode());
        }
        if (this.goDiaryBtn) {
            this.goDiaryBtn.addEventListener('click', () => {
                window.location.href = 'diary.html';
            });
        }
        if (this.textInput) {
            this.textInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    this.saveTodo();
                }
            });
        }
    }

    async loadTodosFromFirestore() {
        try {
            console.log('ToDoデータを読み込み中... UID:', this.uid);
            const snapshot = await db
                .collection('users')
                .doc(this.uid)
                .collection('todos')
                .orderBy('createdAt', 'desc')
                .get();

            console.log('取得したToDo数:', snapshot.docs.length);
            this.todos = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log('ToDoデータの読み込み完了:', this.todos.length, '件');
        } catch (e) {
            console.error('ToDoデータの読み込みに失敗しました:', e);
            console.error('エラー詳細:', e.code, e.message);
            this.todos = [];
        }
    }

    clearForm() {
        if (this.textInput) this.textInput.value = '';
        if (this.remindAtInput) this.remindAtInput.value = '';
        if (this.trackTimeCheckbox) this.trackTimeCheckbox.checked = false;
        this.editingId = null;
        if (this.addBtn) this.addBtn.textContent = 'タスクを追加';
    }

    async saveTodo() {
        const text = (this.textInput?.value || '').trim();
        const remindAtRaw = this.remindAtInput?.value || '';
        const trackTime = !!(this.trackTimeCheckbox && this.trackTimeCheckbox.checked);

        if (!text) {
            alert('タスクの内容を入力してください ✏️');
            this.textInput?.focus();
            return;
        }

        let remindAt = null;
        if (remindAtRaw) {
            // datetime-local の文字列を ISO 形式へ
            const dt = new Date(remindAtRaw);
            if (!isNaN(dt.getTime())) {
                remindAt = dt.toISOString();
            }
        }

        const nowIso = new Date().toISOString();

        let id = this.editingId || null;
        let createdAt = nowIso;

        if (this.editingId) {
            // 既存の createdAt を保持
            const existing = this.todos.find(t => t.id === this.editingId);
            if (existing && existing.createdAt) {
                createdAt = existing.createdAt;
            }
        } else {
            id = db.collection('users').doc(this.uid)
                .collection('todos').doc().id;
        }

        const todo = {
            id,
            text,
            done: false,
            remindAt: remindAt || null,
            trackTime,
            startedAt: null,
            priority: null,
            createdAt,
            updatedAt: nowIso
        };

        try {
            await db.collection('users')
                .doc(this.uid)
                .collection('todos')
                .doc(id)
                .set(todo);

            const index = this.todos.findIndex(t => t.id === id);
            if (index !== -1) {
                this.todos[index] = todo;
            } else {
                this.todos.unshift(todo);
            }

            this.editingId = null;
            if (this.addBtn) this.addBtn.textContent = 'タスクを追加';
            this.clearForm();
            this.renderTodos();
        } catch (e) {
            console.error('ToDoの保存に失敗しました:', e);
            alert('ToDoの保存に失敗しました。通信状況を確認してください。');
        }
    }

    async toggleDone(id) {
        const target = this.todos.find(t => t.id === id);
        if (!target) return;

        const nowIso = new Date().toISOString();
        const newDone = !target.done;
        
        // doneになったときに優先度を外す
        const updateData = {
            done: newDone,
            updatedAt: nowIso
        };
        
        if (newDone && typeof target.priority === 'number') {
            updateData.priority = null;
        }

        // 楽観的更新：先にUIを更新
        const oldDone = target.done;
        const oldPriority = target.priority;
        target.done = newDone;
        target.updatedAt = nowIso;
        if (newDone && typeof target.priority === 'number') {
            target.priority = null;
        }
        this.renderTodos();

        try {
            await db.collection('users')
                .doc(this.uid)
                .collection('todos')
                .doc(id)
                .update(updateData);
        } catch (e) {
            console.error('完了状態の更新に失敗しました:', e);
            // エラー時は元に戻す
            target.done = oldDone;
            target.priority = oldPriority;
            this.renderTodos();
            alert('完了状態の更新に失敗しました。通信状況を確認してください。');
        }
    }

    async deleteTodo(id) {
        if (!confirm('このタスクを削除しますか？')) return;
        try {
            await db.collection('users')
                .doc(this.uid)
                .collection('todos')
                .doc(id)
                .delete();

            this.todos = this.todos.filter(t => t.id !== id);
            this.stopTimer(id);
            this.renderTodos();
        } catch (e) {
            console.error('ToDoの削除に失敗しました:', e);
            alert('ToDoの削除に失敗しました。通信状況を確認してください。');
        }
    }

    async clearAllTodos() {
        if (this.todos.length === 0) {
            alert('削除するタスクがありません 📝');
            return;
        }
        if (!confirm(`すべてのタスク（${this.todos.length}件）を削除しますか？`)) {
            return;
        }
        try {
            const batch = db.batch();
            const colRef = db.collection('users').doc(this.uid).collection('todos');
            const snapshot = await colRef.get();
            snapshot.forEach(doc => batch.delete(doc.ref));
            await batch.commit();

            this.todos = [];
            this.stopAllTimers();
            this.renderTodos();
        } catch (e) {
            console.error('すべてのToDoの削除に失敗しました:', e);
            alert('削除に失敗しました。通信状況を確認してください。');
        }
    }

    // タイマー関連
    formatDuration(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        const s = String(totalSeconds % 60).padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    startTimerDisplay(id, startedAtIso) {
        const row = document.querySelector(`[data-todo-id="${id}"]`);
        if (!row) return;
        const displayEl = row.querySelector('.todo-timer-display');
        const buttonEl = row.querySelector('.todo-timer-toggle');
        if (!displayEl || !buttonEl) return;

        buttonEl.textContent = 'タイマー停止';

        const startedAt = new Date(startedAtIso);
        const update = () => {
            const now = new Date();
            const diff = now - startedAt;
            displayEl.textContent = `経過時間：${this.formatDuration(diff)}`;
        };

        update();
        const existing = this.timers.get(id);
        if (existing) {
            clearInterval(existing);
        }
        const intervalId = setInterval(update, 1000);
        this.timers.set(id, intervalId);
    }

    stopTimerDisplay(id) {
        const row = document.querySelector(`[data-todo-id="${id}"]`);
        if (!row) return;
        const displayEl = row.querySelector('.todo-timer-display');
        const buttonEl = row.querySelector('.todo-timer-toggle');
        if (!displayEl || !buttonEl) return;

        buttonEl.textContent = 'タイマー開始';
        displayEl.textContent = '経過時間：00:00:00';
    }

    stopTimer(id) {
        const timerId = this.timers.get(id);
        if (timerId) {
            clearInterval(timerId);
            this.timers.delete(id);
        }
    }

    stopAllTimers() {
        this.timers.forEach((intervalId) => clearInterval(intervalId));
        this.timers.clear();
    }

    async toggleTimer(id) {
        const target = this.todos.find(t => t.id === id);
        if (!target || !target.trackTime) return;

        const nowIso = new Date().toISOString();

        const newStartedAt = target.startedAt ? null : nowIso;

        try {
            await db.collection('users')
                .doc(this.uid)
                .collection('todos')
                .doc(id)
                .update({
                    startedAt: newStartedAt,
                    updatedAt: nowIso
                });

            target.startedAt = newStartedAt;
            target.updatedAt = nowIso;

            if (newStartedAt) {
                this.startTimerDisplay(id, newStartedAt);
            } else {
                this.stopTimer(id);
                this.stopTimerDisplay(id);
            }
        } catch (e) {
            console.error('タイマー状態の更新に失敗しました:', e);
            alert('タイマーの更新に失敗しました。通信状況を確認してください。');
        }
    }

    // リマインド表示（段階1: 画面内のみ）
    isOverdue(todo) {
        if (!todo.remindAt || todo.done) return false;
        const remindAt = new Date(todo.remindAt);
        if (isNaN(remindAt.getTime())) return false;
        return new Date() >= remindAt;
    }

    togglePriorityMode() {
        this.priorityMode = !this.priorityMode;
        // nextPriorityNumberは使わない（既存の番号の最大値+1を計算する方式に変更）

        // モード開始時に一旦優先度をリセットしない（既存の優先度を保持）

        if (this.priorityModeBtn) {
            this.priorityModeBtn.textContent = this.priorityMode ? '順番モードを終了' : '順番を付ける';
        }

        this.renderTodos();
    }

    // 優先度を削除する関数（優先度モード外でも使用可能）
    async removePriority(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo || typeof todo.priority !== 'number') return;

        try {
            await db.collection('users')
                .doc(this.uid)
                .collection('todos')
                .doc(id)
                .update({
                    priority: null,
                    updatedAt: new Date().toISOString()
                });

            todo.priority = null;
            this.renderTodos();
        } catch (e) {
            console.error('優先度の削除に失敗しました:', e);
            alert('順番の削除に失敗しました。通信状況を確認してください。');
        }
    }

    async assignPriority(id) {
        if (!this.priorityMode) return;
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;
        
        // doneのタスクには優先度を付けない
        if (todo.done) return;
        
        // すでに番号が付いている場合は何もしない（doneになったときだけ外す）
        if (typeof todo.priority === 'number') {
            return;
        }

        // 次の番号を計算（既存の番号の最大値+1）
        const existingPriorities = this.todos
            .filter(t => typeof t.priority === 'number')
            .map(t => t.priority)
            .sort((a, b) => b - a);
        const number = existingPriorities.length > 0 ? existingPriorities[0] + 1 : 1;
        
        // 楽観的更新：先にUIを更新
        const oldPriority = todo.priority;
        todo.priority = number;
        this.renderTodos();

        try {
            await db.collection('users')
                .doc(this.uid)
                .collection('todos')
                .doc(id)
                .update({
                    priority: number,
                    updatedAt: new Date().toISOString()
                });
        } catch (e) {
            console.error('優先度の更新に失敗しました:', e);
            // エラー時は元に戻す
            todo.priority = oldPriority;
            this.renderTodos();
        }
    }

    // 未完了タスクを上、完了タスクを下に並べ替える
    reorderTodos() {
        const notDone = [];
        const done = [];
        this.todos.forEach(todo => {
            if (todo.done) {
                done.push(todo);
            } else {
                notDone.push(todo);
            }
        });

        // それぞれのグループ内は作成日時の新しい順
        const sortByCreatedDesc = (a, b) => {
            const aTime = a.createdAt || '';
            const bTime = b.createdAt || '';
            return aTime < bTime ? 1 : aTime > bTime ? -1 : 0;
        };
        notDone.sort(sortByCreatedDesc);
        done.sort(sortByCreatedDesc);

        this.todos = [...notDone, ...done];
        this.renderTodos();
    }

    formatRemindAt(todo) {
        if (!todo.remindAt) return '';
        const d = new Date(todo.remindAt);
        if (isNaN(d.getTime())) return '';
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const day = d.getDate();
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return `${y}年${m}月${day}日 ${hh}:${mm} にお知らせ`;
    }

    renderTodos() {
        if (!this.listContainer) return;

        if (this.todos.length === 0) {
            this.listContainer.innerHTML = '<div class="empty-message">まだタスクがありません。<br>「やりたいこと」をひとつ書いてみませんか？💕</div>';
            return;
        }

        const html = this.todos.map(todo => {
            const overdue = this.isOverdue(todo);
            const remindText = this.formatRemindAt(todo);
            const timerVisible = todo.trackTime;
            const timerButtonLabel = todo.startedAt ? 'タイマー停止' : 'タイマー開始';
            const cardClasses = ['diary-entry', 'todo-entry'];
            if (overdue) cardClasses.push('todo-entry-overdue');
            if (todo.done) cardClasses.push('todo-entry-done');

            return `
                <div class="${cardClasses.join(' ')}" data-todo-id="${todo.id}">
                    <div class="entry-header">
                        <div class="entry-date">
                            ${todo.priority ? `<span class="todo-priority-badge">${todo.priority}</span>` : ''}
                            <button type="button" class="todo-toggle-btn" data-todo-action="toggle-done">
                                <span class="todo-text">${this.escapeHtml(todo.text)}</span>
                            </button>
                        </div>
                        <div class="entry-actions">
                            ${timerVisible ? `
                                <button class="btn-edit todo-timer-toggle" data-todo-action="toggle-timer">
                                    ${timerButtonLabel}
                                </button>
                            ` : ''}
                            <button class="btn-delete" data-todo-action="delete">🗑️ 削除</button>
                        </div>
                    </div>
                    <div class="entry-content">
                        ${remindText ? `<div class="todo-remind-text">${this.escapeHtml(remindText)}</div>` : ''}
                        ${timerVisible ? `<div class="todo-timer-display">経過時間：00:00:00</div>` : ''}
                        ${overdue ? `<div class="todo-remind-badge">そろそろやる時間かも… ⏰</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        this.listContainer.innerHTML = html;

        // イベント委譲をセット（一度だけ登録する）
        // 注意: addEventListenerは重複登録されるため、一度だけ登録する必要がある
        // ただし、innerHTMLでDOMが再作成されるため、イベント委譲を使用している
        if (!this.listenersAttached) {
            this.listenersAttached = true;
            
            this.listContainer.addEventListener('click', (e) => {
            const target = e.target;
            if (!(target instanceof HTMLElement)) return;
            const entryEl = target.closest('[data-todo-id]');
            if (!entryEl) return;
            const id = entryEl.getAttribute('data-todo-id');
            if (!id) return;

            const actionEl = target.closest('[data-todo-action]');
            const action = actionEl ? actionEl.getAttribute('data-todo-action') : null;

            if (action === 'delete') {
                this.deleteTodo(id);
            } else if (action === 'toggle-timer') {
                this.toggleTimer(id);
            } else if (action === 'toggle-done') {
                // 優先度モード中はdoneの切り替えを無効化
                if (!this.priorityMode) {
                    this.toggleDone(id);
                }
            } else if (!action && this.priorityMode) {
                // ボタン以外の領域がクリックされたときに優先度を付与
                this.assignPriority(id);
            }
            });
            
            this.listContainer.addEventListener('change', (e) => {
            const target = e.target;
            if (!(target instanceof HTMLInputElement)) return;
            if (target.getAttribute('data-todo-action') !== 'toggle-done') return;
            
            // 優先度モード中はdoneの切り替えを無効化
            if (this.priorityMode) return;

            const entryEl = target.closest('[data-todo-id]');
            if (!entryEl) return;
            const id = entryEl.getAttribute('data-todo-id');
            if (!id) return;

            this.toggleDone(id);
            });
        }

        // タイマー表示の初期化（再描画時のみ）
        // 注意: タイマーは既に動作している可能性があるため、重複起動を避ける
        const existingTimerIds = Array.from(this.timers.keys());
        const todosWithTimers = this.todos.filter(t => t.trackTime && t.startedAt);
        const newTimerIds = todosWithTimers.map(t => t.id);
        
        // 不要になったタイマーを停止
        existingTimerIds.forEach(timerId => {
            if (!newTimerIds.includes(timerId)) {
                this.stopTimer(timerId);
            }
        });
        
        // 新しいタイマーを開始（まだ開始されていないもののみ）
        todosWithTimers.forEach(todo => {
            if (!this.timers.has(todo.id)) {
                this.startTimerDisplay(todo.id, todo.startedAt);
            }
        });

        this.renderPriorityList();
    }

    renderPriorityList() {
        if (!this.priorityContainer) return;

        const prioritized = this.todos
            .filter(t => !t.done && typeof t.priority === 'number')
            .sort((a, b) => (a.priority || 0) - (b.priority || 0));

        if (prioritized.length === 0) {
            this.priorityContainer.innerHTML = '<p class="priority-empty">まだ順番がついたタスクはありません。</p>';
            return;
        }

        const html = prioritized.map(todo => `
            <li class="priority-item">
                <span class="priority-number">${todo.priority}</span>
                <span class="priority-text">${this.escapeHtml(todo.text)}</span>
            </li>
        `).join('');

        this.priorityContainer.innerHTML = html;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// マスタメンテのタイトル・なまえ表示は diary と共通ロジックを使わず、
// ここでは user.displayName があれば軽く表示するだけにしている

document.addEventListener('DOMContentLoaded', () => {
    // authオブジェクトの取得（グローバルから）
    const getAuth = () => {
        if (window.auth) {
            return window.auth;
        }
        if (typeof firebase !== 'undefined' && firebase.auth) {
            return firebase.auth();
        }
        return null;
    };
    
    const auth = getAuth();
    
    if (!auth) {
        console.error('Firebase Authが初期化されていません');
        // 少し待ってから再試行
        setTimeout(() => {
            const retryAuth = getAuth();
            if (retryAuth) {
                setupAuthHandlers(retryAuth);
            } else {
                console.error('Firebase Authの初期化に失敗しました');
            }
        }, 1000);
        return;
    }
    
    setupAuthHandlers(auth);
});

function setupAuthHandlers(auth) {
    // ログアウトボタンのイベントリスナー
    const logoutBtn = document.getElementById('logout-btn');
    console.log('ログアウトボタン:', logoutBtn);
    console.log('authオブジェクト:', auth);
    
    if (logoutBtn) {
        // 既存のイベントリスナーを削除（重複防止）
        const newLogoutBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
        
        newLogoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('ログアウトボタンがクリックされました');
            try {
                const currentAuth = window.auth || (typeof firebase !== 'undefined' ? firebase.auth() : null);
                if (!currentAuth) {
                    throw new Error('Firebase Authが利用できません');
                }
                console.log('ログアウト実行中...', currentAuth);
                await currentAuth.signOut();
                console.log('ログアウト成功');
                window.location.href = 'index.html';
            } catch (error) {
                console.error('ログアウトエラー:', error);
                alert('ログアウトに失敗しました: ' + (error.message || error));
            }
        });
    } else {
        console.error('ログアウトボタンが見つかりません');
    }

    auth.onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = 'index.html';
            return;
        }

        // 名前表示（メールのローカル部でもよい）
        const userNameDisplay = document.getElementById('user-name-display');
        if (userNameDisplay) {
            let name = user.displayName;
            if (!name && user.email) {
                name = user.email.split('@')[0];
            }
            userNameDisplay.textContent = name ? `こんにちは、${name} さん` : '';
        }

        // 現在のユーザー情報をコンソールに表示（デバッグ用）
        console.log('現在のユーザー:', {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
        });

        window.remindodoManager = new RemindodoManager(user);
    });
}



