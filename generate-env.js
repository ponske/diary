// .envファイルを読み込んでenv.jsを生成するスクリプト
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const envJsPath = path.join(__dirname, 'env.js');

// .envファイルを読み込む
if (!fs.existsSync(envPath)) {
    console.error('.envファイルが見つかりません');
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

// 環境変数をパース
const envVars = {};
lines.forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim();
            envVars[key.trim()] = value;
        }
    }
});

// env.jsファイルを生成
const envJsContent = `// 環境変数設定（自動生成 - このファイルは手動で編集しないでください）
// .envファイルから生成されました
window.FIREBASE_API_KEY = "${envVars.FIREBASE_API_KEY || ''}";
window.FIREBASE_AUTH_DOMAIN = "${envVars.FIREBASE_AUTH_DOMAIN || ''}";
window.FIREBASE_PROJECT_ID = "${envVars.FIREBASE_PROJECT_ID || ''}";
window.FIREBASE_STORAGE_BUCKET = "${envVars.FIREBASE_STORAGE_BUCKET || ''}";
window.FIREBASE_MESSAGING_SENDER_ID = "${envVars.FIREBASE_MESSAGING_SENDER_ID || ''}";
window.FIREBASE_APP_ID = "${envVars.FIREBASE_APP_ID || ''}";
window.FIREBASE_MEASUREMENT_ID = "${envVars.FIREBASE_MEASUREMENT_ID || ''}";
`;

fs.writeFileSync(envJsPath, envJsContent, 'utf8');
console.log('env.jsファイルを生成しました');
