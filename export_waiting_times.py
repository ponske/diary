#!/usr/bin/env python
"""待ち時間データをJSONファイルとしてエクスポート（時系列データ含む）
毎日21時以降に実行し、指定日のデータをエクスポート、Firebase Hosting用のディレクトリに保存する
firebase deployコマンドでデプロイされることを想定

使用方法:
  python export_waiting_times.py              # 当日のデータをエクスポート
  python export_waiting_times.py --date 2024-01-15  # 指定日のデータをエクスポート
"""
import psycopg2
import json
import os
import sys
import argparse
from datetime import datetime, timedelta
from collections import defaultdict

# コマンドライン引数の解析
parser = argparse.ArgumentParser(description='待ち時間データをJSONファイルとしてエクスポート')
parser.add_argument(
    '--date',
    type=str,
    help='エクスポート対象の日付（YYYY-MM-DD形式）。指定しない場合は当日の日付を使用',
    default=None
)
args = parser.parse_args()

# 日付の取得とバリデーション
if args.date:
    try:
        target_date = datetime.strptime(args.date, '%Y-%m-%d').date()
    except ValueError:
        print(f"エラー: 日付の形式が正しくありません。YYYY-MM-DD形式で指定してください。例: 2024-01-15")
        sys.exit(1)
else:
    target_date = datetime.now().date()

# データベース接続
conn = psycopg2.connect(
    host="localhost",
    database="restored_wpn_db",
    user="postgres",
    password="postgres"
)

cur = conn.cursor()

# スクリプトのディレクトリ（diary-app）を取得
script_dir = os.path.dirname(os.path.abspath(__file__))

# 対象日の開始時刻と終了時刻を取得
target_start = datetime.combine(target_date, datetime.min.time())
target_end = datetime.combine(target_date, datetime.max.time()) + timedelta(days=1)

print("=== バッチ実行情報 ===")
print(f"実行日時: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print(f"エクスポート対象日: {target_date.strftime('%Y-%m-%d')}")
print(f"出力ディレクトリ: {script_dir}")
print("==================\n")

# デバッグ: 対象日のデータ件数を確認
cur.execute("""
    SELECT COUNT(*) 
    FROM trk_waitingtime 
    WHERE waitingperiod IS NOT NULL
      AND at_t >= %s
      AND at_t < %s;
""", (target_start, target_end))
count_today = cur.fetchone()[0]
print(f"対象日({target_date.strftime('%Y-%m-%d')})のデータ件数: {count_today}")

# 対象日の待ち時間データを取得（時系列データ）
# 各アトラクションIDごとに時系列データを取得
# データ量を抑えるため、10分ごとのサンプルを取得
query = """
SELECT 
    attr_id,
    waitingperiod,
    at_t
FROM (
    SELECT 
        attr_id,
        waitingperiod,
        at_t,
        ROW_NUMBER() OVER (
            PARTITION BY attr_id, 
            EXTRACT(EPOCH FROM DATE_TRUNC('hour', at_t))::bigint / 3600 + 
            FLOOR(EXTRACT(MINUTE FROM at_t) / 10)
            ORDER BY at_t DESC
        ) as rn
    FROM trk_waitingtime
    WHERE waitingperiod IS NOT NULL
      AND at_t >= %s
      AND at_t < %s
) w
WHERE w.rn = 1
ORDER BY attr_id, at_t DESC;
"""

cur.execute(query, (target_start, target_end))
rows = cur.fetchall()
print(f"クエリ結果: {len(rows)}件のレコードを取得")

# アトラクションIDごとに時系列データをグループ化
waiting_times_by_attr = defaultdict(list)
for row in rows:
    attr_id, waiting_period, at_t = row
    if attr_id:
        waiting_times_by_attr[attr_id].append({
            "waiting_minutes": int(waiting_period) if waiting_period is not None else 0,
            "timestamp": at_t.isoformat() if at_t else None
        })

# JSON形式に変換（最新の待ち時間も含める）
waiting_times = []
for attr_id, time_series in waiting_times_by_attr.items():
    # 時系列データを時系列順にソート（古い順）
    time_series_sorted = sorted(time_series, key=lambda x: x['timestamp'] if x['timestamp'] else '')
    
    # 最新の待ち時間
    latest = time_series_sorted[-1] if time_series_sorted else {"waiting_minutes": 0, "timestamp": None}
    
    waiting_times.append({
        "attr_id": attr_id,
        "waiting_minutes": latest["waiting_minutes"],
        "updated_at": latest["timestamp"],
        "time_series": time_series_sorted  # 時系列データ
    })

# attr_idでソート
waiting_times.sort(key=lambda x: x['attr_id'])

# 1. route-optimizer.html用のJSONファイルを保存（diary-app/waiting_times.json）
output_file_route_optimizer = os.path.join(script_dir, 'waiting_times.json')
with open(output_file_route_optimizer, 'w', encoding='utf-8') as f:
    json.dump(waiting_times, f, ensure_ascii=False, indent=2)

total_records = sum(len(item['time_series']) for item in waiting_times)
print(f"\n✓ route-optimizer.html用ファイルを保存: {output_file_route_optimizer}")
print(f"  {len(waiting_times)}件のアトラクション、合計{total_records}件の待ち時間データ")

# 2. waiting-dashboard.js用のJSONファイルを保存（diary-app/data/waiting_times_YYYYMMDD.json）
# フラットな配列形式に変換（attr_id, waitingperiod, at_t）
data_dir = os.path.join(script_dir, 'data')
os.makedirs(data_dir, exist_ok=True)

# 時系列データをフラットな配列に展開
flat_data = []
for item in waiting_times:
    attr_id = item['attr_id']
    if item.get('time_series'):
        for ts in item['time_series']:
            flat_data.append({
                'attr_id': str(attr_id),
                'waitingperiod': ts.get('waiting_minutes', 0),
                'at_t': ts.get('timestamp', '')
            })
    else:
        # time_seriesがない場合は最新のデータのみ
        flat_data.append({
            'attr_id': str(attr_id),
            'waitingperiod': item.get('waiting_minutes', 0),
            'at_t': item.get('updated_at', '')
        })

# 日付形式: YYYYMMDD
date_str = target_date.strftime('%Y%m%d')
output_file_dashboard = os.path.join(data_dir, f'waiting_times_{date_str}.json')
with open(output_file_dashboard, 'w', encoding='utf-8') as f:
    json.dump(flat_data, f, ensure_ascii=False, indent=2)

print(f"\n✓ waiting-dashboard.js用ファイルを保存: {output_file_dashboard}")
print(f"  {len(flat_data)}件の待ち時間レコード")

print("\n==================")
print("バッチ処理が完了しました。")
print(f"\n次のステップ:")
print(f"1. firebase deploy コマンドを実行してFirebase Hostingにデプロイ")
print(f"2. route-optimizer.html と waiting-dashboard.html が最新のデータを使用します")
print("==================\n")

cur.close()
conn.close()
