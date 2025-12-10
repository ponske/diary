class SignupPage {
    constructor() {
        this.settingsKey = 'fluffyDiarySettings';
        this.flagKey = 'fluffyDiaryRegistered';
        this.nameInput = document.getElementById('signup-name');
        this.submitBtn = document.getElementById('signup-submit');

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
            localStorage.setItem(this.settingsKey, JSON.stringify(this.settings));
            localStorage.setItem(this.flagKey, '1');
        } catch (e) {
            console.error('設定の保存に失敗しました:', e);
        }
    }

    prefill() {
        if (this.settings.userName) {
            this.nameInput.value = this.settings.userName;
        }
        document.title = `${this.settings.title || '日記帳'} - 新規登録`;
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
        // 登録が終わったらログイン画面へ
        window.location.href = 'login.html';
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
    new SignupPage();
});





