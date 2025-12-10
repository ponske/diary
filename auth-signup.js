class EmailSignupPage {
    constructor() {
        this.emailInput = document.getElementById('signup-email');
        this.passwordInput = document.getElementById('signup-password');
        this.passwordInput2 = document.getElementById('signup-password2');
        this.submitBtn = document.getElementById('signup-submit');
        this.errorEl = document.getElementById('signup-error');

        this.attachEvents();
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
        const password2 = this.passwordInput2.value;

        if (!email || !password || !password2) {
            this.showError('すべての項目を入力してください。');
            return;
        }
        if (password !== password2) {
            this.showError('パスワードが一致しません。');
            return;
        }
        if (password.length < 6) {
            this.showError('パスワードは6文字以上にしてください。');
            return;
        }

        try {
            this.errorEl.textContent = '';
            await auth.createUserWithEmailAndPassword(email, password);
            // 登録完了後はメールログイン画面へ
            window.location.href = 'index.html';
        } catch (e) {
            console.error(e);
            let msg = '登録に失敗しました。';
            if (e.code === 'auth/email-already-in-use') {
                msg = 'このメールアドレスはすでに登録されています。ログインしてください。';
            } else if (e.code === 'auth/invalid-email') {
                msg = 'メールアドレスの形式が正しくありません。';
            } else if (e.code === 'auth/weak-password') {
                msg = 'パスワードが弱すぎます。もう少し長く・複雑にしてください。';
            }
            this.showError(msg);
        }
    }

    attachEvents() {
        this.submitBtn.addEventListener('click', () => this.submit());
        this.passwordInput2.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.submit();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new EmailSignupPage();
});






