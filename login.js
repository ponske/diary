class LoginPage {
    constructor() {
        this.settingsKey = 'fluffyDiarySettings';
        this.nameInput = document.getElementById('login-name');
        this.submitBtn = document.getElementById('login-submit');

        this.settings = this.loadSettings();
        this.prefill();
        this.attachEvents();
    }

    loadSettings() {
        const stored = localStorage.getItem(this.settingsKey);
        if (!stored) return { title: '日記帳', userName: '' };
        try {
            const parsed = JSON.parse(stored);
            return {
                title: parsed.title || '日記帳',
                userName: parsed.userName || ''
            };
        } catch {
            return { title: '日記帳', userName: '' };
        }
    }

    saveSettings() {
        try {
            localStorage.setItem(
                this.settingsKey,
                JSON.stringify(this.settings)
            );
        } catch (e) {
            console.error('設定の保存に失敗しました:', e);
        }
    }

    prefill() {
        if (this.settings.userName) {
            this.nameInput.value = this.settings.userName;
        }
        document.title = `${this.settings.title || '日記帳'} - ログイン`;
    }

    submit() {
        const name = this.nameInput.value.trim();
        if (!name) {
            alert('なまえを入力してください。');
            this.nameInput.focus();
            return;
        }
        this.settings.userName = name;
        if (!this.settings.title) {
            this.settings.title = '日記帳';
        }
        this.saveSettings();
        window.location.href = 'diary.html';
    }

    attachEvents() {
        this.submitBtn.addEventListener('click', () => this.submit());
        this.nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.submit();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Firebase Auth で未ログインならメールログイン画面へ
    auth.onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        new LoginPage();
    });
});


