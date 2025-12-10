// kakeevo: 家計簿（支出）管理
// Firestore コレクション構造: users/{uid}/expenses/{expenseId}
// firebase-config.jsで初期化されたwindow.dbとwindow.authを使用

class KakeevoManager {
    constructor(user) {
        this.user = user;
        this.uid = user.uid;
        this.expenses = [];

        this.init();
    }

    async init() {
        // 要素取得
        this.dateInput = document.getElementById('expense-date');
        this.timeInput = document.getElementById('expense-time');
        this.amountInput = document.getElementById('expense-amount');
        this.categorySelect = document.getElementById('expense-category');
        this.shopInput = document.getElementById('expense-shop');
        this.memoInput = document.getElementById('expense-memo');
        this.addBtn = document.getElementById('add-expense-btn');
        this.clearBtn = document.getElementById('clear-expense-form-btn');
        this.goDiaryBtn = document.getElementById('go-diary-from-kakeevo-btn');

        this.currentMonthLabel = document.getElementById('kakeevo-current-month');
        this.totalAmountEl = document.getElementById('kakeevo-total-amount');
        this.topCategoryEl = document.getElementById('kakeevo-top-category');
        this.listContainer = document.getElementById('kakeevo-expenses');
        
        // 3か月分の円グラフ用のcanvas要素
        this.chartCanvasCurrent = document.getElementById('kakeevo-chart-current');
        this.chartCanvasLast = document.getElementById('kakeevo-chart-last');
        this.chartCanvas2Months = document.getElementById('kakeevo-chart-2months');
        this.chartCurrent = null;
        this.chartLast = null;
        this.chart2Months = null;
        
        // 3か月分のデータ
        this.expensesCurrent = [];
        this.expensesLast = [];
        this.expenses2Months = [];

        this.setDefaultDate();
        this.updateMonthLabel();
        this.attachEvents();

        await this.loadAllMonthsExpenses();
        this.render();
    }

    setDefaultDate() {
        if (!this.dateInput) return;
        const today = new Date().toISOString().split('T')[0];
        this.dateInput.value = today;
    }

    updateMonthLabel() {
        if (!this.currentMonthLabel) return;
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth() + 1;
        this.currentMonthLabel.textContent = `${y}年${m}月`;
    }

    attachEvents() {
        if (this.addBtn) {
            this.addBtn.addEventListener('click', () => this.saveExpense());
        }
        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => this.clearForm());
        }
        if (this.goDiaryBtn) {
            this.goDiaryBtn.addEventListener('click', () => {
                window.location.href = 'diary.html';
            });
        }
        const bindEnterToSave = (input) => {
            if (!input) return;
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.saveExpense();
                }
            });
        };

        bindEnterToSave(this.amountInput);
        bindEnterToSave(this.shopInput);
        bindEnterToSave(this.memoInput);
    }

    getMonthRange(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        // ローカル時間で月の開始日と終了日を計算
        const start = new Date(year, month, 1);
        // 月の最終日を取得（翌月の0日 = 今月の最終日）
        const end = new Date(year, month + 1, 0);
        return { start, end };
    }

    // 日付をYYYY-MM-DD形式の文字列に変換（ローカル時間を使用）
    formatDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    async loadMonthExpenses(targetDate) {
        // dbが初期化されているか確認
        const db = window.db;
        if (!db) {
            console.error('Firestoreが初期化されていません');
            return [];
        }

        try {
            const { start, end } = this.getMonthRange(targetDate);
            // ローカル時間で日付文字列を生成（toISOString()はUTCなので使わない）
            const startStr = this.formatDateString(start);
            const endStr = this.formatDateString(end);

            // デバッグ: 取得範囲をログ出力
            console.log(`データ取得範囲: ${startStr} から ${endStr} まで (${targetDate.getFullYear()}年${targetDate.getMonth() + 1}月)`);

            // 複合インデックスを避けるため、dateのみでソートし、createdAtでのソートはクライアント側で行う
            // endStrは月の最終日なので、date <= endStr で最終日までを含める
            const snapshot = await db
                .collection('users')
                .doc(this.uid)
                .collection('expenses')
                .where('date', '>=', startStr)
                .where('date', '<=', endStr)
                .orderBy('date', 'desc')
                .get();

            // デバッグ: 取得したデータの日付を確認
            const dates = snapshot.docs.map(doc => doc.data().date).filter(Boolean);
            if (dates.length > 0) {
                const minDate = dates.reduce((a, b) => a < b ? a : b);
                const maxDate = dates.reduce((a, b) => a > b ? a : b);
                console.log(`取得データ: ${snapshot.docs.length}件 (日付範囲: ${minDate} ～ ${maxDate})`);
            } else {
                console.log(`取得データ: 0件`);
            }

            // クライアント側でdateとcreatedAtの両方でソート（日付順：古い順）
            return snapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                .sort((a, b) => {
                    // まずdateで比較（古い順）
                    if (a.date !== b.date) {
                        return a.date.localeCompare(b.date); // asc（古い順）
                    }
                    // dateが同じ場合はcreatedAtで比較（古い順）
                    const aTime = a.createdAt || '';
                    const bTime = b.createdAt || '';
                    return aTime.localeCompare(bTime); // asc（古い順）
                });
        } catch (e) {
            console.error('支出データの読み込みに失敗しました:', e);
            return [];
        }
    }

    async loadAllMonthsExpenses() {
        const now = new Date();
        
        // 今月
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        this.expensesCurrent = await this.loadMonthExpenses(currentMonth);
        this.expenses = this.expensesCurrent; // 今月のデータをメインのexpensesにも設定
        
        // 先月
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        this.expensesLast = await this.loadMonthExpenses(lastMonth);
        
        // 2か月前
        const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        this.expenses2Months = await this.loadMonthExpenses(twoMonthsAgo);
    }

    async loadCurrentMonthExpenses() {
        // 後方互換性のため残しておく
        await this.loadAllMonthsExpenses();
    }

    clearForm() {
        this.setDefaultDate();
        if (this.timeInput) this.timeInput.value = '';
        if (this.amountInput) this.amountInput.value = '';
        if (this.shopInput) this.shopInput.value = '';
        if (this.memoInput) this.memoInput.value = '';
        if (this.categorySelect) this.categorySelect.value = '食費';
    }

    async saveExpense() {
        // dbが初期化されているか確認
        const db = window.db;
        if (!db) {
            console.error('Firestoreが初期化されていません');
            alert('データベースの初期化に失敗しています。ページを再読み込みしてください。');
            return;
        }

        const date = this.dateInput?.value || '';
        const time = this.timeInput?.value || '';
        const amountStr = this.amountInput?.value || '';
        const category = this.categorySelect?.value || '';
        const shop = (this.shopInput?.value || '').trim();
        const memo = (this.memoInput?.value || '').trim();

        if (!date) {
            alert('日付を選択してください 📅');
            this.dateInput?.focus();
            return;
        }

        const amount = Number(amountStr);
        if (!amountStr || isNaN(amount) || amount <= 0) {
            alert('0より大きい金額を入力してください 💰');
            this.amountInput?.focus();
            return;
        }

        if (!category) {
            alert('カテゴリを選択してください 🧺');
            this.categorySelect?.focus();
            return;
        }

        const nowIso = new Date().toISOString();
        const id = db.collection('users').doc(this.uid)
            .collection('expenses').doc().id;

        const expense = {
            id,
            date,
            amount,
            category,
            time: time || null,
            shop,
            memo,
            createdAt: nowIso,
            updatedAt: nowIso
        };

        try {
            console.log('支出をFirestore Databaseに保存します:', expense);
            console.log('保存先パス: users/' + this.uid + '/expenses/' + id);
            
            // Firestore Databaseに保存
            await db.collection('users')
                .doc(this.uid)
                .collection('expenses')
                .doc(id)
                .set(expense);

            console.log('✓ 支出のFirestore Databaseへの保存が完了しました');
            console.log('保存されたデータ:', expense);

            // Firestoreから再読み込みして、確実に保存されたデータを表示
            await this.loadAllMonthsExpenses();
            this.render();
            this.clearForm();
            
            console.log('✓ データの再読み込みが完了しました');
        } catch (e) {
            console.error('✗ 支出の保存に失敗しました:', e);
            console.error('エラー詳細:', {
                message: e.message,
                code: e.code,
                stack: e.stack
            });
            alert(`支出の保存に失敗しました: ${e.message || '不明なエラー'}\n\nエラーコード: ${e.code || 'N/A'}\n\nFirebase ConsoleでFirestoreの設定を確認してください。`);
        }
    }

    computeSummary() {
        let total = 0;
        const byCategory = {};

        for (const e of this.expenses) {
            const amt = Number(e.amount) || 0;
            total += amt;
            if (!byCategory[e.category]) {
                byCategory[e.category] = 0;
            }
            byCategory[e.category] += amt;
        }

        let topCategory = '-';
        let topAmount = 0;
        Object.entries(byCategory).forEach(([cat, amt]) => {
            if (amt > topAmount) {
                topAmount = amt;
                topCategory = `${cat}（¥${amt.toLocaleString()}）`;
            }
        });

        return { total, topCategory, byCategory };
    }

    formatDate(dateStr, timeStr) {
        const d = new Date(dateStr + 'T00:00:00');
        if (isNaN(d.getTime())) return dateStr;
        const m = d.getMonth() + 1;
        const day = d.getDate();
        const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
        const w = weekdays[d.getDay()];
        const base = `${m}月${day}日（${w}）`;
        if (timeStr) {
            return `${base} ${timeStr}`;
        }
        return base;
    }

    computeCategorySummary(expenses) {
        const byCategory = {};
        for (const e of expenses) {
            const amt = Number(e.amount) || 0;
            if (!byCategory[e.category]) {
                byCategory[e.category] = 0;
            }
            byCategory[e.category] += amt;
        }
        return byCategory;
    }

    renderChartStats(byCategory, totalAmount, statsElementId) {
        if (!totalAmount || totalAmount === 0) {
            const statsEl = document.getElementById(statsElementId);
            if (statsEl) {
                statsEl.innerHTML = '';
            }
            return;
        }

        // 家賃光熱費通信費のパーセンテージ
        const utilityAmount = byCategory['家賃光熱費通信費'] || 0;
        const utilityPercentage = totalAmount > 0 ? ((utilityAmount / totalAmount) * 100).toFixed(1) : 0;

        // 食費（食費+昼ごはん/おやつ）のパーセンテージ
        const foodAmount = (byCategory['食費'] || 0) + (byCategory['昼ごはん/おやつ'] || 0);
        const foodPercentage = totalAmount > 0 ? ((foodAmount / totalAmount) * 100).toFixed(1) : 0;

        const statsEl = document.getElementById(statsElementId);
        if (statsEl) {
            // 棒グラフで表示
            let html = '<div class="kakeevo-bar-chart">';
            
            if (utilityAmount > 0) {
                html += `
                    <div class="kakeevo-bar-item">
                        <div class="kakeevo-bar-label">家賃・ユーティリティ</div>
                        <div class="kakeevo-bar-container">
                            <div class="kakeevo-bar-fill kakeevo-bar-utility" style="width: ${utilityPercentage}%"></div>
                            <span class="kakeevo-bar-value">${utilityPercentage}%</span>
                        </div>
                    </div>
                `;
            }
            
            if (foodAmount > 0) {
                html += `
                    <div class="kakeevo-bar-item">
                        <div class="kakeevo-bar-label">食費</div>
                        <div class="kakeevo-bar-container">
                            <div class="kakeevo-bar-fill kakeevo-bar-food" style="width: ${foodPercentage}%"></div>
                            <span class="kakeevo-bar-value">${foodPercentage}%</span>
                        </div>
                    </div>
                `;
            }
            
            html += '</div>';
            statsEl.innerHTML = html;
        }
    }

    renderCommonLegend() {
        const legendEl = document.getElementById('kakeevo-legend');
        if (!legendEl) return;

        // カテゴリごとの色を定義（統一された色マッピング）
        const categoryColors = {
            '食費': '#FF69B4',
            '日用品': '#FF1493',
            '交通': '#FFB6C1',
            '昼ごはん/おやつ': '#FF69B4', // 食費と同じ色
            '家賃光熱費通信費': '#FFA07A',
            'サブすく': '#FF7F50',
            '趣味（サーバー）': '#FF6347',
            'ジム': '#FF4500',
            '外食/交友': '#FF8C00',
            '美容': '#DA70D6',
            '衣服類': '#9370DB',
            '雑誌': '#20B2AA',
            '旅行': '#4169E1',
            '保険医療': '#32CD32',
            '自由医療': '#00CED1',
            'セルフメディケーション': '#98FB98'
        };

        // カテゴリのリスト（重複を避ける）
        const categories = [
            '食費', '昼ごはん/おやつ', '日用品', '交通', '衣服類', '美容',
            '外食/交友', '家賃光熱費通信費', '趣味（サーバー）', 'ジム',
            '雑誌', '旅行', '保険医療', '自由医療', 'セルフメディケーション', 'サブすく'
        ];

        let html = '<div class="kakeevo-legend-grid">';
        categories.forEach(cat => {
            const color = categoryColors[cat] || '#CCCCCC';
            html += `
                <div class="kakeevo-legend-item">
                    <span class="kakeevo-legend-color" style="background-color: ${color}"></span>
                    <span class="kakeevo-legend-text">${cat}</span>
                </div>
            `;
        });
        html += '</div>';
        legendEl.innerHTML = html;
    }

    renderChart(canvas, chartInstance, byCategory, monthLabel, totalAmount) {
        if (!canvas) {
            console.warn('Canvas要素が見つかりません');
            return null;
        }
        
        if (typeof Chart === 'undefined') {
            console.error('Chart.jsが読み込まれていません');
            return null;
        }

        const categories = Object.keys(byCategory);
        const amounts = Object.values(byCategory);
        const total = totalAmount || amounts.reduce((a, b) => a + b, 0);

        // カテゴリごとの色を定義（統一された色マッピング）
        // 食費と昼ごはん/おやつは同じ色、家賃光熱費通信費は統一色
        const categoryColors = {
            '食費': '#FF69B4',
            '日用品': '#FF1493',
            '交通': '#FFB6C1',
            '昼ごはん/おやつ': '#FF69B4', // 食費と同じ色
            '家賃光熱費通信費': '#FFA07A',
            'サブすく': '#FF7F50',
            '趣味（サーバー）': '#FF6347',
            'ジム': '#FF4500',
            '外食/交友': '#FF8C00',
            '美容': '#DA70D6',
            '衣服類': '#9370DB',
            '雑誌': '#20B2AA',
            '旅行': '#4169E1',
            '保険医療': '#32CD32',
            '自由医療': '#00CED1',
            'セルフメディケーション': '#98FB98'
        };

        const defaultColors = [
            '#FF69B4', '#FF1493', '#FFB6C1', '#FFC0CB', '#FFA07A',
            '#FF7F50', '#FF6347', '#FF4500', '#FF8C00', '#FFA500'
        ];

        // データがない場合でも空のグラフを表示
        if (categories.length === 0) {
            if (chartInstance) {
                chartInstance.destroy();
            }
            // 空のグラフを表示
            return new Chart(canvas, {
                type: 'doughnut',
                data: {
                    labels: ['データなし'],
                    datasets: [{
                        data: [1],
                        backgroundColor: ['#E0E0E0'],
                        borderWidth: 0
                    }]
                },
                options: {
                    cutout: '60%',
                    responsive: true,
                    maintainAspectRatio: false, // 固定サイズを維持
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            enabled: false
                        },
                        title: {
                            display: true,
                            text: monthLabel,
                            font: {
                                size: 14,
                                weight: 'bold'
                            },
                            color: '#c46d96'
                        },
                        // 中央に合計金額を表示
                        datalabels: {
                            display: false
                        }
                    }
                },
                plugins: [{
                    id: 'centerText',
                    beforeDraw: function(chart) {
                        const ctx = chart.ctx;
                        const centerX = chart.chartArea.left + (chart.chartArea.right - chart.chartArea.left) / 2;
                        const centerY = chart.chartArea.top + (chart.chartArea.bottom - chart.chartArea.top) / 2;
                        
                        ctx.save();
                        ctx.font = 'bold 20px "M PLUS Rounded 1c", sans-serif';
                        ctx.fillStyle = '#ff1493';
                        ctx.strokeStyle = '#fff';
                        ctx.lineWidth = 3;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.strokeText('¥0', centerX, centerY);
                        ctx.fillText('¥0', centerX, centerY);
                        ctx.restore();
                    }
                }]
            });
        }

        const chartData = {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: categories.map(cat => categoryColors[cat] || defaultColors[categories.indexOf(cat) % defaultColors.length]),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        };

        const chartOptions = {
            cutout: '60%', // ドーナツ型にする（60%の穴を開ける）
            responsive: true,
            maintainAspectRatio: false, // 固定サイズを維持
            layout: {
                padding: {
                    bottom: 0 // 凡例のためのパディングを削除
                }
            },
            plugins: {
                legend: {
                    display: false // 凡例は共通で表示するため非表示
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ¥${value.toLocaleString()} (${percentage}%)`;
                        }
                    }
                },
                title: {
                    display: true,
                    text: monthLabel,
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    color: '#c46d96',
                    padding: {
                        bottom: 10
                    }
                }
            }
        };

        // 中央に合計金額を表示するプラグイン
        const centerTextPlugin = {
            id: 'centerText',
            beforeDraw: function(chart) {
                const ctx = chart.ctx;
                const centerX = chart.chartArea.left + (chart.chartArea.right - chart.chartArea.left) / 2;
                const centerY = chart.chartArea.top + (chart.chartArea.bottom - chart.chartArea.top) / 2;
                
                ctx.save();
                // フォントサイズを少し小さくし、白い縁取りを追加して読みやすくする
                ctx.font = 'bold 22px "M PLUS Rounded 1c", sans-serif';
                ctx.fillStyle = '#ff1493';
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 3;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const totalText = `¥${total.toLocaleString()}`;
                // 白い縁取りを描画
                ctx.strokeText(totalText, centerX, centerY);
                // メインのテキストを描画
                ctx.fillText(totalText, centerX, centerY);
                ctx.restore();
            }
        };

        if (chartInstance) {
            chartInstance.data = chartData;
            chartInstance.options = chartOptions;
            chartInstance.update();
            return chartInstance;
        } else {
            return new Chart(canvas, {
                type: 'doughnut',
                data: chartData,
                options: chartOptions,
                plugins: [centerTextPlugin]
            });
        }
    }

    renderAllCharts() {
        // Chart.jsの読み込みを待つ
        if (typeof Chart === 'undefined') {
            console.warn('Chart.jsがまだ読み込まれていません。500ms後に再試行します。');
            setTimeout(() => this.renderAllCharts(), 500);
            return;
        }
        
        // 共通凡例を表示
        this.renderCommonLegend();
        
        const now = new Date();
        
        // 今月のラベル
        const currentMonthLabel = `${now.getFullYear()}年${now.getMonth() + 1}月`;
        const currentByCategory = this.computeCategorySummary(this.expensesCurrent);
        const currentTotal = this.expensesCurrent.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const currentLabelEl = document.getElementById('kakeevo-chart-label-current');
        if (currentLabelEl) {
            currentLabelEl.textContent = `今月の使用状況 (${currentMonthLabel})`;
        }
        if (this.chartCanvasCurrent) {
            this.chartCurrent = this.renderChart(
                this.chartCanvasCurrent,
                this.chartCurrent,
                currentByCategory,
                currentMonthLabel,
                currentTotal
            );
            // 統計情報を表示
            this.renderChartStats(currentByCategory, currentTotal, 'kakeevo-chart-stats-current');
        }

        // 先月のラベル
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthLabel = `${lastMonthDate.getFullYear()}年${lastMonthDate.getMonth() + 1}月`;
        const lastLabelEl = document.getElementById('kakeevo-chart-label-last');
        if (lastLabelEl) {
            lastLabelEl.textContent = `先月の支出 (${lastMonthLabel})`;
        }
        const lastByCategory = this.computeCategorySummary(this.expensesLast);
        const lastTotal = this.expensesLast.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        if (this.chartCanvasLast) {
            this.chartLast = this.renderChart(
                this.chartCanvasLast,
                this.chartLast,
                lastByCategory,
                lastMonthLabel,
                lastTotal
            );
            // 統計情報を表示
            this.renderChartStats(lastByCategory, lastTotal, 'kakeevo-chart-stats-last');
        }

        // 2か月前のラベル
        const twoMonthsAgoDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        const twoMonthsAgoLabel = `${twoMonthsAgoDate.getFullYear()}年${twoMonthsAgoDate.getMonth() + 1}月`;
        const twoMonthsAgoLabelEl = document.getElementById('kakeevo-chart-label-2months');
        if (twoMonthsAgoLabelEl) {
            twoMonthsAgoLabelEl.textContent = `2か月前の支出 (${twoMonthsAgoLabel})`;
        }
        const twoMonthsAgoByCategory = this.computeCategorySummary(this.expenses2Months);
        const twoMonthsAgoTotal = this.expenses2Months.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        if (this.chartCanvas2Months) {
            this.chart2Months = this.renderChart(
                this.chartCanvas2Months,
                this.chart2Months,
                twoMonthsAgoByCategory,
                twoMonthsAgoLabel,
                twoMonthsAgoTotal
            );
            // 統計情報を表示
            this.renderChartStats(twoMonthsAgoByCategory, twoMonthsAgoTotal, 'kakeevo-chart-stats-2months');
        }
    }

    render() {
        if (!this.listContainer) return;

        const { total, topCategory, byCategory } = this.computeSummary();

        if (this.totalAmountEl) {
            this.totalAmountEl.textContent = `¥${total.toLocaleString()}`;
        }
        if (this.topCategoryEl) {
            this.topCategoryEl.textContent = topCategory;
        }

        // 3つの円グラフを描画（Chart.jsの読み込みを待つ）
        if (typeof Chart !== 'undefined') {
            this.renderAllCharts();
        } else {
            // Chart.jsがまだ読み込まれていない場合、少し待ってから再描画
            setTimeout(() => {
                this.renderAllCharts();
            }, 500);
        }

        if (this.expenses.length === 0) {
            this.listContainer.innerHTML = '<div class="empty-message">まだ今月のkakeevoはありません。<br>最初の1件を記録してみませんか？💕</div>';
            return;
        }

        // 日付順にソート（古い順）
        const sortedExpenses = [...this.expenses].sort((a, b) => {
            if (a.date !== b.date) {
                return a.date.localeCompare(b.date); // 古い順
            }
            const aTime = a.createdAt || '';
            const bTime = b.createdAt || '';
            return aTime.localeCompare(bTime); // 古い順
        });

        const html = sortedExpenses.map(exp => `
            <div class="kakeevo-expense-card">
                <div class="kakeevo-expense-card-header">
                    <div class="kakeevo-expense-date-small">📅 ${this.formatDate(exp.date, exp.time)}</div>
                    <button class="btn-delete-small" data-expense-id="${exp.id}" title="削除">🗑️</button>
                </div>
                <div class="kakeevo-expense-card-content">
                    <table class="kakeevo-expense-table">
                        <tr>
                            <td class="kakeevo-table-label">カテゴリ</td>
                            <td class="kakeevo-table-value kakeevo-expense-category-small">${this.escapeHtml(exp.category)}</td>
                        </tr>
                        <tr>
                            <td class="kakeevo-table-label">金額</td>
                            <td class="kakeevo-table-value kakeevo-expense-amount-small">¥${Number(exp.amount || 0).toLocaleString()}</td>
                        </tr>
                        ${exp.shop ? `
                        <tr>
                            <td class="kakeevo-table-label">お店</td>
                            <td class="kakeevo-table-value kakeevo-expense-shop-small">${this.escapeHtml(exp.shop)}</td>
                        </tr>
                        ` : ''}
                        ${exp.memo ? `
                        <tr>
                            <td class="kakeevo-table-label">メモ</td>
                            <td class="kakeevo-table-value kakeevo-expense-memo-small">${this.escapeHtml(exp.memo)}</td>
                        </tr>
                        ` : ''}
                    </table>
                </div>
            </div>
        `).join('');

        this.listContainer.innerHTML = html;

        // 削除ボタンのイベント
        this.listContainer.querySelectorAll('[data-expense-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-expense-id');
                if (!id) return;
                this.deleteExpense(id);
            });
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async deleteExpense(id) {
        if (!confirm('この支出を削除しますか？')) return;
        
        // dbが初期化されているか確認
        const db = window.db;
        if (!db) {
            console.error('Firestoreが初期化されていません');
            alert('データベースの初期化に失敗しています。ページを再読み込みしてください。');
            return;
        }

        try {
            await db.collection('users')
                .doc(this.uid)
                .collection('expenses')
                .doc(id)
                .delete();

            console.log('支出のFirestore Databaseからの削除が完了しました');

            // Firestoreから再読み込みして、確実に削除されたデータを反映
            await this.loadAllMonthsExpenses();
            this.render();
        } catch (e) {
            console.error('支出の削除に失敗しました:', e);
            console.error('エラー詳細:', {
                message: e.message,
                code: e.code,
                stack: e.stack
            });
            alert(`支出の削除に失敗しました: ${e.message || '不明なエラー'}\n\nエラーコード: ${e.code || 'N/A'}`);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const auth = window.auth;
    if (!auth) {
        console.error('Firebase Authが初期化されていません');
        alert('認証の初期化に失敗しています。ページを再読み込みしてください。');
        return;
    }

    auth.onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = 'index.html';
            return;
        }

        // 名前表示
        const userNameDisplay = document.getElementById('user-name-display');
        if (userNameDisplay) {
            let name = user.displayName;
            if (!name && user.email) {
                name = user.email.split('@')[0];
            }
            userNameDisplay.textContent = name ? `こんにちは、${name} さん` : '';
        }

        window.kakeevoManager = new KakeevoManager(user);
    });
});


