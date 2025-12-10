class EmailLoginPage {
    constructor() {
        this.emailInput = document.getElementById('login-email');
        this.passwordInput = document.getElementById('login-password');
        this.submitBtn = document.getElementById('login-submit');
        this.errorEl = document.getElementById('login-error');

        this.attachEvents();

        // すでにログイン済みなら、なまえログイン画面へ
        auth.onAuthStateChanged((user) => {
            if (user) {
                window.location.href = 'login.html';
            }
        });
    }

    showError(message) {
        if (this.errorEl) {
            this.errorEl.textContent = message;
        } else {
            alert(message);
        }
    }

    async submit() {
        const email = this.emailInput.value.trim();
        const password = this.passwordInput.value;

        if (!email || !password) {
            this.showError('メールアドレスとパスワードを入力してください。');
            return;
        }

        try {
            this.errorEl.textContent = '';
            await auth.signInWithEmailAndPassword(email, password);
            
            // ログイン後の遷移先を確認
            const redirectTo = sessionStorage.getItem('redirectAfterLogin');
            if (redirectTo) {
                sessionStorage.removeItem('redirectAfterLogin');
                window.location.href = redirectTo;
            } else {
                window.location.href = 'login.html';
            }
        } catch (e) {
            console.error(e);
            let msg = 'ログインに失敗しました。';
            if (e.code === 'auth/user-not-found') {
                msg = 'このメールアドレスのユーザーが見つかりません。新規登録してください。';
            } else if (e.code === 'auth/wrong-password') {
                msg = 'パスワードが正しくありません。';
            } else if (e.code === 'auth/invalid-email') {
                msg = 'メールアドレスの形式が正しくありません。';
            }
            this.showError(msg);
        }
    }

    attachEvents() {
        this.submitBtn.addEventListener('click', () => this.submit());
        this.passwordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.submit();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new EmailLoginPage();
});



