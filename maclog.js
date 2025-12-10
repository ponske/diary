// MacLog - マクロ栄養素ログアプリのメインロジック
class MacLogApp {
    constructor(user) {
        this.user = user;
        this.uid = user.uid;
        this.targets = null;
        this.foods = [];
        this.cookings = [];
        this.allFoods = []; // 履歴検索用
        this.currentMode = 'direct'; // 'direct' or 'calc'
        this.init();
    }

    async init() {
        // 今日の日付をデフォルトに設定
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('food-date').value = today;
        document.getElementById('cooking-date').value = today;
        document.getElementById('history-date-filter').value = today;

        // イベントリスナーの設定
        this.setupEventListeners();

        // データの読み込み
        await this.loadTargets();
        await this.loadFoods();
        await this.loadCookings();
        await this.loadAllFoods(); // 履歴検索用

        // UIの更新
        this.updateRemainingNutrients();
        this.renderHistory();
    }

    setupEventListeners() {
        // タブ切り替え
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // フォーム送信
        document.getElementById('record-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.recordFood();
        });

        document.getElementById('cooking-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.recordCooking();
        });

        document.getElementById('target-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.setTarget();
        });

        // 目標カロリーの自動計算
        ['target-protein', 'target-fat', 'target-carb'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => {
                this.updateTargetCalorieDisplay();
            });
        });

        // 履歴フィルター
        document.getElementById('history-date-filter').addEventListener('change', () => {
            this.renderHistory();
        });

        document.getElementById('filter-today-btn').addEventListener('click', () => {
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('history-date-filter').value = today;
            this.renderHistory();
        });

        // 入力モード切り替え
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.dataset.mode;
                this.switchInputMode(mode);
            });
        });

        // 履歴検索（直接入力モード）
        document.getElementById('food-name').addEventListener('input', (e) => {
            this.searchHistory(e.target.value, 'direct');
        });

        // 履歴検索（計算モード）
        document.getElementById('calc-food-name').addEventListener('input', (e) => {
            this.searchHistory(e.target.value, 'calc');
        });

        // 計算モードの計算処理
        ['calc-base-amount', 'calc-base-protein', 'calc-base-fat', 'calc-base-carb', 'calc-consumed-amount'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => {
                this.calculateNutrients();
            });
        });

        // 計算結果を適用
        document.getElementById('apply-calc-result').addEventListener('click', () => {
            this.applyCalcResult();
        });

        // ドロップダウン外をクリックで閉じる
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.autocomplete-wrapper')) {
                document.querySelectorAll('.history-dropdown').forEach(dropdown => {
                    dropdown.classList.remove('show');
                });
            }
        });
    }

    switchTab(tabName) {
        // タブボタンのアクティブ状態を更新
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // タブコンテンツの表示を更新
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`tab-${tabName}`).classList.add('active');
    }

    // PFCからカロリーを計算（タンパク質4kcal/g、脂質9kcal/g、炭水化物4kcal/g）
    calculateCalorie(protein, fat, carb) {
        return (protein * 4) + (fat * 9) + (carb * 4);
    }

    // 目標カロリーの表示を更新
    updateTargetCalorieDisplay() {
        const protein = parseFloat(document.getElementById('target-protein').value) || 0;
        const fat = parseFloat(document.getElementById('target-fat').value) || 0;
        const carb = parseFloat(document.getElementById('target-carb').value) || 0;
        const calorie = this.calculateCalorie(protein, fat, carb);
        document.getElementById('target-calorie-display').textContent = calorie.toFixed(1);
    }

    // 目標を設定
    async setTarget() {
        const protein = parseFloat(document.getElementById('target-protein').value);
        const fat = parseFloat(document.getElementById('target-fat').value);
        const carb = parseFloat(document.getElementById('target-carb').value);

        if (isNaN(protein) || isNaN(fat) || isNaN(carb)) {
            alert('すべての値を入力してください。');
            return;
        }

        const calorie = this.calculateCalorie(protein, fat, carb);

        try {
            await db.collection('users').doc(this.uid).collection('calorieTargets').doc('current').set({
                protein,
                fat,
                carb,
                calorie,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            this.targets = { protein, fat, carb, calorie };
            this.updateRemainingNutrients();
            alert('目標を設定しました！');
            document.getElementById('target-form').reset();
            this.updateTargetCalorieDisplay();
        } catch (error) {
            console.error('目標の設定に失敗しました:', error);
            alert('目標の設定に失敗しました。');
        }
    }

    // 目標を読み込み
    async loadTargets() {
        try {
            const doc = await db.collection('users').doc(this.uid).collection('calorieTargets').doc('current').get();
            if (doc.exists) {
                this.targets = doc.data();
            }
        } catch (error) {
            console.error('目標の読み込みに失敗しました:', error);
        }
    }

    // 食べたものを記録
    async recordFood() {
        // 現在のモードに応じて値を取得
        let name, protein, fat, carb;
        
        if (this.currentMode === 'calc') {
            // 計算モードの場合、計算結果を使用
            const calcResultBox = document.getElementById('calc-result-box');
            if (calcResultBox.style.display === 'none') {
                alert('計算結果を適用してください。');
                return;
            }
            name = document.getElementById('calc-food-name').value.trim();
            const proteinText = document.getElementById('calc-result-protein').textContent;
            const fatText = document.getElementById('calc-result-fat').textContent;
            const carbText = document.getElementById('calc-result-carb').textContent;
            protein = parseFloat(proteinText.replace('g', ''));
            fat = parseFloat(fatText.replace('g', ''));
            carb = parseFloat(carbText.replace('g', ''));
        } else {
            // 直接入力モード
            name = document.getElementById('food-name').value.trim();
            protein = parseFloat(document.getElementById('food-protein').value);
            fat = parseFloat(document.getElementById('food-fat').value);
            carb = parseFloat(document.getElementById('food-carb').value);
        }

        const date = document.getElementById('food-date').value;

        if (!name || isNaN(protein) || isNaN(fat) || isNaN(carb)) {
            alert('すべての項目を入力してください。');
            return;
        }

        const calorie = this.calculateCalorie(protein, fat, carb);

        try {
            await db.collection('users').doc(this.uid).collection('foods').add({
                name,
                protein,
                fat,
                carb,
                calorie,
                date,
                type: 'food',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // フォームをリセット
            document.getElementById('record-form').reset();
            document.getElementById('food-date').value = new Date().toISOString().split('T')[0];
            document.getElementById('calc-result-box').style.display = 'none';
            
            // 直接入力モードに戻す
            this.switchInputMode('direct');

            // データを再読み込み
            await this.loadFoods();
            await this.loadAllFoods(); // 履歴検索用も更新
            this.updateRemainingNutrients();
            this.renderHistory();
            alert('登録しました！');
        } catch (error) {
            console.error('登録に失敗しました:', error);
            alert('登録に失敗しました。');
        }
    }

    // 手料理を記録
    async recordCooking() {
        const name = document.getElementById('cooking-name').value.trim();
        const protein = parseFloat(document.getElementById('cooking-protein').value);
        const fat = parseFloat(document.getElementById('cooking-fat').value);
        const carb = parseFloat(document.getElementById('cooking-carb').value);
        const date = document.getElementById('cooking-date').value;

        if (!name || isNaN(protein) || isNaN(fat) || isNaN(carb)) {
            alert('すべての項目を入力してください。');
            return;
        }

        const calorie = this.calculateCalorie(protein, fat, carb);

        try {
            await db.collection('users').doc(this.uid).collection('foods').add({
                name,
                protein,
                fat,
                carb,
                calorie,
                date,
                type: 'cooking',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // フォームをリセット
            document.getElementById('cooking-form').reset();
            document.getElementById('cooking-date').value = new Date().toISOString().split('T')[0];

            // データを再読み込み
            await this.loadCookings();
            this.updateRemainingNutrients();
            this.renderHistory();
            alert('登録しました！');
        } catch (error) {
            console.error('登録に失敗しました:', error);
            alert('登録に失敗しました。');
        }
    }

    // 食べたものを読み込み
    async loadFoods() {
        try {
            const snapshot = await db
                .collection('users')
                .doc(this.uid)
                .collection('foods')
                .where('type', '==', 'food')
                .orderBy('createdAt', 'desc')
                .get();

            this.foods = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('食べ物データの読み込みに失敗しました:', error);
            this.foods = [];
        }
    }

    // 手料理を読み込み
    async loadCookings() {
        try {
            const snapshot = await db
                .collection('users')
                .doc(this.uid)
                .collection('foods')
                .where('type', '==', 'cooking')
                .orderBy('createdAt', 'desc')
                .get();

            this.cookings = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('手料理データの読み込みに失敗しました:', error);
            this.cookings = [];
        }
    }

    // 今日の残り栄養素を計算して表示
    updateRemainingNutrients() {
        if (!this.targets) {
            document.getElementById('remaining-protein').textContent = '-';
            document.getElementById('remaining-fat').textContent = '-';
            document.getElementById('remaining-carb').textContent = '-';
            document.getElementById('remaining-calorie').textContent = '-';
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        const allFoods = [...this.foods, ...this.cookings].filter(f => f.date === today);

        const consumed = allFoods.reduce((acc, food) => {
            acc.protein += food.protein || 0;
            acc.fat += food.fat || 0;
            acc.carb += food.carb || 0;
            acc.calorie += food.calorie || 0;
            return acc;
        }, { protein: 0, fat: 0, carb: 0, calorie: 0 });

        const remaining = {
            protein: Math.max(0, this.targets.protein - consumed.protein),
            fat: Math.max(0, this.targets.fat - consumed.fat),
            carb: Math.max(0, this.targets.carb - consumed.carb),
            calorie: Math.max(0, this.targets.calorie - consumed.calorie)
        };

        document.getElementById('remaining-protein').textContent = remaining.protein.toFixed(1);
        document.getElementById('remaining-fat').textContent = remaining.fat.toFixed(1);
        document.getElementById('remaining-carb').textContent = remaining.carb.toFixed(1);
        document.getElementById('remaining-calorie').textContent = remaining.calorie.toFixed(1);
    }

    // 履歴を表示
    async renderHistory() {
        const filterDate = document.getElementById('history-date-filter').value;
        const historyList = document.getElementById('history-list');

        // すべてのデータを読み込み
        try {
            const snapshot = await db
                .collection('users')
                .doc(this.uid)
                .collection('foods')
                .orderBy('createdAt', 'desc')
                .get();

            const allItems = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // 日付でフィルター
            const filteredItems = filterDate
                ? allItems.filter(item => item.date === filterDate)
                : allItems;

            if (filteredItems.length === 0) {
                historyList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">🍽️</div>
                        <div class="empty-state-text">${filterDate ? 'この日付の記録はありません。' : '記録がありません。'}</div>
                    </div>
                `;
                return;
            }

            historyList.innerHTML = filteredItems.map(item => {
                const typeClass = item.type === 'cooking' ? 'cooking' : 'food';
                const typeLabel = item.type === 'cooking' ? '手料理' : '食べ物';
                return `
                    <div class="history-item">
                        <div class="history-item-header">
                            <div>
                                <span class="history-item-name">${this.escapeHtml(item.name)}</span>
                                <span class="history-item-type ${typeClass}">${typeLabel}</span>
                            </div>
                            <div class="history-item-date">${item.date}</div>
                        </div>
                        <div class="history-item-nutrients">
                            <div class="history-nutrient">
                                <div class="history-nutrient-label">タンパク質</div>
                                <div class="history-nutrient-value">${(item.protein || 0).toFixed(1)}g</div>
                            </div>
                            <div class="history-nutrient">
                                <div class="history-nutrient-label">脂質</div>
                                <div class="history-nutrient-value">${(item.fat || 0).toFixed(1)}g</div>
                            </div>
                            <div class="history-nutrient">
                                <div class="history-nutrient-label">炭水化物</div>
                                <div class="history-nutrient-value">${(item.carb || 0).toFixed(1)}g</div>
                            </div>
                            <div class="history-nutrient">
                                <div class="history-nutrient-label">カロリー</div>
                                <div class="history-nutrient-value">${(item.calorie || 0).toFixed(1)}kcal</div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('履歴の読み込みに失敗しました:', error);
            historyList.innerHTML = '<div class="empty-state"><div class="empty-state-text">履歴の読み込みに失敗しました。</div></div>';
        }
    }

    // HTMLエスケープ
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // すべての食べ物を読み込み（履歴検索用）
    async loadAllFoods() {
        try {
            const snapshot = await db
                .collection('users')
                .doc(this.uid)
                .collection('foods')
                .orderBy('createdAt', 'desc')
                .limit(100)
                .get();

            this.allFoods = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('履歴データの読み込みに失敗しました:', error);
            this.allFoods = [];
        }
    }

    // 入力モード切り替え
    switchInputMode(mode) {
        this.currentMode = mode;
        
        // ボタンの状態を更新
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

        // フォームの表示を切り替え
        document.getElementById('direct-mode').style.display = mode === 'direct' ? 'block' : 'none';
        document.getElementById('calc-mode').style.display = mode === 'calc' ? 'block' : 'none';

        // フォームの必須属性を更新
        if (mode === 'direct') {
            document.getElementById('food-name').required = true;
            document.getElementById('food-protein').required = true;
            document.getElementById('food-fat').required = true;
            document.getElementById('food-carb').required = true;
            document.getElementById('calc-food-name').required = false;
            document.getElementById('calc-base-amount').required = false;
            document.getElementById('calc-base-protein').required = false;
            document.getElementById('calc-base-fat').required = false;
            document.getElementById('calc-base-carb').required = false;
            document.getElementById('calc-consumed-amount').required = false;
        } else {
            document.getElementById('food-name').required = false;
            document.getElementById('food-protein').required = false;
            document.getElementById('food-fat').required = false;
            document.getElementById('food-carb').required = false;
            document.getElementById('calc-food-name').required = true;
            document.getElementById('calc-base-amount').required = true;
            document.getElementById('calc-base-protein').required = true;
            document.getElementById('calc-base-fat').required = true;
            document.getElementById('calc-base-carb').required = true;
            document.getElementById('calc-consumed-amount').required = true;
        }
    }

    // 履歴検索
    searchHistory(query, mode) {
        const dropdownId = mode === 'direct' ? 'history-dropdown' : 'calc-history-dropdown';
        const dropdown = document.getElementById(dropdownId);
        
        if (!query || query.trim().length === 0) {
            dropdown.classList.remove('show');
            return;
        }

        const lowerQuery = query.toLowerCase();
        
        // 名前でフィルターし、重複を排除（最新のものを優先）
        const nameMap = new Map();
        this.allFoods
            .filter(food => food.name.toLowerCase().includes(lowerQuery))
            .forEach(food => {
                const lowerName = food.name.toLowerCase();
                if (!nameMap.has(lowerName)) {
                    nameMap.set(lowerName, food);
                }
            });
        
        const matches = Array.from(nameMap.values()).slice(0, 5); // 最大5件まで表示

        if (matches.length === 0) {
            dropdown.classList.remove('show');
            return;
        }

        dropdown.innerHTML = matches.map(food => {
            const typeLabel = food.type === 'cooking' ? '手料理' : '食べ物';
            return `
                <div class="history-dropdown-item" data-food-id="${food.id}" data-mode="${mode}">
                    <div class="history-dropdown-item-name">${this.escapeHtml(food.name)}</div>
                    <div class="history-dropdown-item-info">
                        P:${(food.protein || 0).toFixed(1)}g F:${(food.fat || 0).toFixed(1)}g C:${(food.carb || 0).toFixed(1)}g | ${typeLabel}
                    </div>
                </div>
            `;
        }).join('');

        dropdown.classList.add('show');

        // クリックイベントを設定
        dropdown.querySelectorAll('.history-dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                const foodId = item.dataset.foodId;
                const food = this.allFoods.find(f => f.id === foodId);
                if (food) {
                    this.selectHistoryFood(food, mode);
                    dropdown.classList.remove('show');
                }
            });
        });
    }

    // 履歴から食べ物を選択
    selectHistoryFood(food, mode) {
        if (mode === 'direct') {
            document.getElementById('food-name').value = food.name;
            document.getElementById('food-protein').value = food.protein || 0;
            document.getElementById('food-fat').value = food.fat || 0;
            document.getElementById('food-carb').value = food.carb || 0;
        } else {
            // 計算モードの場合、基準量とPFCを設定
            // 履歴の値は実際の摂取量なので、基準量は100gとして設定
            document.getElementById('calc-food-name').value = food.name;
            document.getElementById('calc-base-amount').value = 100;
            document.getElementById('calc-base-protein').value = food.protein || 0;
            document.getElementById('calc-base-fat').value = food.fat || 0;
            document.getElementById('calc-base-carb').value = food.carb || 0;
            // 摂取量は空のまま（ユーザーが入力）
            document.getElementById('calc-consumed-amount').value = '';
            this.calculateNutrients();
        }
    }

    // 栄養素を計算
    calculateNutrients() {
        const baseAmount = parseFloat(document.getElementById('calc-base-amount').value) || 0;
        const baseProtein = parseFloat(document.getElementById('calc-base-protein').value) || 0;
        const baseFat = parseFloat(document.getElementById('calc-base-fat').value) || 0;
        const baseCarb = parseFloat(document.getElementById('calc-base-carb').value) || 0;
        const consumedAmount = parseFloat(document.getElementById('calc-consumed-amount').value) || 0;

        if (baseAmount <= 0 || consumedAmount <= 0) {
            document.getElementById('calc-result-box').style.display = 'none';
            return;
        }

        // 比例計算
        const ratio = consumedAmount / baseAmount;
        const resultProtein = baseProtein * ratio;
        const resultFat = baseFat * ratio;
        const resultCarb = baseCarb * ratio;
        const resultCalorie = this.calculateCalorie(resultProtein, resultFat, resultCarb);

        // 結果を表示
        document.getElementById('calc-result-protein').textContent = resultProtein.toFixed(1) + 'g';
        document.getElementById('calc-result-fat').textContent = resultFat.toFixed(1) + 'g';
        document.getElementById('calc-result-carb').textContent = resultCarb.toFixed(1) + 'g';
        document.getElementById('calc-result-calorie').textContent = resultCalorie.toFixed(1) + 'kcal';
        document.getElementById('calc-result-box').style.display = 'block';
    }

    // 計算結果を適用
    applyCalcResult() {
        const proteinText = document.getElementById('calc-result-protein').textContent;
        const fatText = document.getElementById('calc-result-fat').textContent;
        const carbText = document.getElementById('calc-result-carb').textContent;
        
        // 単位を削除して数値を抽出
        const protein = parseFloat(proteinText.replace('g', ''));
        const fat = parseFloat(fatText.replace('g', ''));
        const carb = parseFloat(carbText.replace('g', ''));

        if (isNaN(protein) || isNaN(fat) || isNaN(carb)) {
            alert('計算結果が正しくありません。');
            return;
        }

        // 直接入力モードのフィールドに値を設定
        document.getElementById('food-name').value = document.getElementById('calc-food-name').value;
        document.getElementById('food-protein').value = protein.toFixed(1);
        document.getElementById('food-fat').value = fat.toFixed(1);
        document.getElementById('food-carb').value = carb.toFixed(1);

        // 直接入力モードに切り替え
        this.switchInputMode('direct');
    }
}

// アプリケーションの初期化
let macLogApp;
document.addEventListener('DOMContentLoaded', () => {
    // Firebase Auth で未ログインならログイン画面へ
    auth.onAuthStateChanged((user) => {
        if (!user) {
            // diary-appのログイン画面にリダイレクト
            window.location.href = 'index.html';
            return;
        }

        // ユーザー名を表示
        const userNameDisplay = document.getElementById('user-name-display');
        if (userNameDisplay && user.email) {
            userNameDisplay.textContent = `ログイン中: ${user.email}`;
        }

        macLogApp = new MacLogApp(user);
    });
});


