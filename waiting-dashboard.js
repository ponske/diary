// 待ち時間ダッシュボード用のJavaScript

// アトラクション名マッピング（attr_id -> 名前）
const ATTRACTION_NAMES = {
    // ランド
    '151': 'オムニバス',
    '152': 'カリブの海賊',
    '153': 'ジャングルクルーズ',
    '154': 'ウエスタンリバー鉄道',
    '155': 'スイスファミリー・ツリーハウス',
    '156': '魅惑のチキルーム',
    '157': 'ウエスタンランド・シューティングギャラリー',
    '158': 'カントリーベア・シアター',
    '159': '蒸気船マークトウェイン号',
    '160': 'ビッグサンダー・マウンテン',
    '161': 'トムソーヤ島いかだ',
    '162': 'スプラッシュ・マウンテン',
    '163': 'ビーバーブラザーズのカヌー探険',
    '164': 'ピーターパン空の旅',
    '165': '白雪姫と七人のこびと',
    '166': 'シンデレラのフェアリーテイル・ホール',
    '167': 'ミッキーのフィルハーマジック',
    '168': 'ピノキオの冒険旅行',
    '169': '空飛ぶダンボ',
    '170': 'キャッスルカルーセル',
    '171': 'ホーンテッドマンション',
    '172': 'イッツ・ア・スモールワールド',
    '173': 'アリスのティーパーティー',
    '174': 'プーさんのハニーハント',
    '175': 'ロジャーラビットのカートゥーンスピン',
    '176': 'ミニーの家',
    '178': 'チップとデールのツリーハウス',
    '179': 'ガジェットのゴーコースター',
    '180': 'ドナルドのボート',
    '181': 'グーフィーのペイント＆プレイハウス',
    '183': 'スター・ツアーズ：ザ・アドベンチャーズ・コンティニュー',
    '189': 'モンスターズ・インク"ライド＆ゴーシーク！"',
    '191': 'ペニーアーケード',
    '194': 'トゥーンパーク',
    '195': 'スティッチ・エンカウンター',
    '196': 'ベイマックスのハッピーライド',
    '197': '美女と野獣"魔法のものがたり"',
    
    // シー
    '202': 'アリエルのプレイグラウンド',
    '218': 'トイ・ストーリー・マニア！',
    '219': 'ソアリン：ファンタスティック・フライト',
    '220': 'ジャスミンのフライングカーペット',
    '221': 'センター・オブ・ジ・アース',
    '222': 'インディ・ジョーンズ・アドベンチャー：クリスタルスカルの魔宮',
    '223': '海底２万マイル',
    '224': 'マーメイドラグーンシアター',
    '226': 'マジックランプシアター',
    '227': 'ディズニーシー・トランジットスチーマーライン（アメリカンウォーターフロント）',
    '228': 'ディズニーシー・トランジットスチーマーライン（メディテレーニアンハーバー）',
    '229': 'ディズニーシー・トランジットスチーマーライン（ロストリバーデルタ）',
    '230': 'ヴェネツィアン・ゴンドラ',
    '231': 'ディズニーシー・エレクトリックレールウェイ（ポートディスカバリー）',
    '232': 'ディズニーシー・エレクトリックレールウェイ（アメリカンウォーターフロント）',
    '233': 'ビッグシティ・ヴィークル',
    '234': 'アクアトピア',
    '235': 'シンドバッド・ストーリーブック・ヴォヤッジ',
    '236': 'キャラバンカルーセル',
    '237': 'フランダーのフライングフィッシュコースター',
    '238': 'スカットルのスクーター',
    '239': 'ジャンピン・ジェリーフィッシュ',
    '240': 'ブローフィッシュ・バルーンレース',
    '241': 'ワールプール',
    '242': 'レイジングスピリッツ',
    '243': 'タワー・オブ・テラー',
    '244': 'フォートレス・エクスプロレーション',
    '245': 'フォートレス・エクスプロレーション"ザ・レオナルドチャレンジ"',
    '246': 'タートル・トーク',
    '247': 'ニモ＆フレンズ・シーライダー',
    '255': 'アナとエルサのフローズンジャーニー',
    '256': 'ラプンツェルのランタンフェスティバル',
    '257': 'ピーターパンのネバーランドアドベンチャー',
    '258': 'フェアリー・ティンカーベルのビジーバギー',
    // グリーティング（ランド）
    '890': 'ミニーのスタイルスタジオ',
    '908': 'メインストリート・ハウス前（キャラクターグリーティング）',
    '909': 'ミッキーの家とミート・ミッキー',
    '916': 'ウッドチャック・グリーティングトレイル（ドナルド）',
    '917': 'ウッドチャック・グリーティングトレイル（デイジー）',
    // グリーティング（シー）
    '901': 'ミッキー&フレンズ・グリーティングトレイル（ミッキー）',
    '902': 'ミッキー&フレンズ・グリーティングトレイル（ミニー）',
    '903': 'ミッキー&フレンズ・グリーティングトレイル（ドナルド）',
    '904': '"サルードス・アミーゴス！"グリーティングドック',
    '905': 'ヴィレッジ・グリーティングプレイス',
    '921': 'ディズニーシー・プラザ（キャラクターグリーティング）',
};

// アトラクション名の多言語対応マッピング
const ATTRACTION_NAMES_I18N = {
    'オムニバス': { en: 'Omnibus', zh: '双层巴士', ko: '옴니버스' },
    'カリブの海賊': { en: 'Pirates of the Caribbean', zh: '加勒比海盗', ko: '카리브의 해적' },
    'ジャングルクルーズ': { en: 'Jungle Cruise', zh: '丛林巡航', ko: '정글 크루즈' },
    'ジャングルクルーズ：ワイルドライフ・エクスペディション': { en: 'Jungle Cruise: Wildlife Expeditions', zh: '丛林巡航：野生动物探险', ko: '정글 크루즈: 와일드라이프 익스페디션' },
    'ウエスタンリバー鉄道': { en: 'Western River Railroad', zh: '西部沿河铁路', ko: '웨스턴 리버 철도' },
    'スイスファミリー・ツリーハウス': { en: 'Swiss Family Treehouse', zh: '瑞士家庭树屋', ko: '스위스 패밀리 트리하우스' },
    '魅惑のチキルーム': { en: 'Enchanted Tiki Room', zh: '提基神殿', ko: '요정 티키 룸' },
    'ウエスタンランド・シューティングギャラリー': { en: 'Westernland Shooting Gallery', zh: '西部乐园射击馆', ko: '웨스턴랜드 슈팅 갤러리' },
    'カントリーベア・シアター': { en: 'Country Bear Theater', zh: '乡村顽熊剧场', ko: '컨트리 베어 시어터' },
    '蒸気船マークトウェイン号': { en: 'Mark Twain Riverboat', zh: '马克·吐温号蒸汽船', ko: '증기선 마크 트웨인 호' },
    'ビッグサンダー・マウンテン': { en: 'Big Thunder Mountain', zh: '巨雷山', ko: '빅 썬더 마운틴' },
    'トムソーヤ島いかだ': { en: 'Tom Sawyer Island Rafts', zh: '汤姆·索亚岛木筏', ko: '톰 소여 섬 뗏목' },
    'スプラッシュ・マウンテン': { en: 'Splash Mountain', zh: '飞溅山', ko: '스플래시 마운틴' },
    'ビーバーブラザーズのカヌー探険': { en: 'Beaver Brothers Explorer Canoes', zh: '海狸兄弟独木舟历险', ko: '비버 브라더스 카누 탐험' },
    'ピーターパン空の旅': { en: "Peter Pan's Flight", zh: '小飞侠天空之旅', ko: '피터팬의 하늘 여행' },
    '白雪姫と七人のこびと': { en: 'Snow White\'s Adventures', zh: '白雪公主和七个小矮人', ko: '백설공주와 일곱 난쟁이' },
    'シンデレラのフェアリーテイル・ホール': { en: 'Cinderella\'s Fairy Tale Hall', zh: '仙履奇缘童话大厅', ko: '신데렐라의 페어리테일 홀' },
    'ミッキーのフィルハーマジック': { en: 'Mickey\'s PhilharMagic', zh: '米奇魔法音乐世界', ko: '미키의 필하모닉' },
    'ピノキオの冒険旅行': { en: 'Pinocchio\'s Daring Journey', zh: '皮诺曹的勇敢之旅', ko: '피노키오의 모험 여행' },
    '空飛ぶダンボ': { en: 'Dumbo the Flying Elephant', zh: '小飞象', ko: '날아다니는 덤보' },
    'キャッスルカルーセル': { en: 'Castle Carrousel', zh: '城堡旋转木马', ko: '캐슬 회전목마' },
    'ホーンテッドマンション': { en: 'Haunted Mansion', zh: '幽灵公馆', ko: '유령의 저택' },
    'イッツ・ア・スモールワールド': { en: 'It\'s a Small World', zh: '小小世界', ko: '작은 세상' },
    'アリスのティーパーティー': { en: 'Alice\'s Tea Party', zh: '爱丽丝的茶会', ko: '앨리스의 티파티' },
    'プーさんのハニーハント': { en: 'Pooh\'s Hunny Hunt', zh: '小熊维尼猎蜜记', ko: '곰돌이 푸의 허니 헌트' },
    'ロジャーラビットのカートゥーンスピン': { en: 'Roger Rabbit\'s Car Toon Spin', zh: '罗杰兔卡通旋转', ko: '로저 래빗의 카툰 스핀' },
    'ミニーの家': { en: 'Minnie\'s House', zh: '米妮的家', ko: '미니의 집' },
    'チップとデールのツリーハウス': { en: 'Chip \'n Dale\'s Treehouse', zh: '奇奇和蒂蒂的树屋', ko: '칩 앤 데일의 트리하우스' },
    'ガジェットのゴーコースター': { en: 'Gadget\'s Go Coaster', zh: '高飞玩具城过山车', ko: '가젯의 고 코스터' },
    'ドナルドのボート': { en: 'Donald\'s Boat', zh: '唐老鸭的船', ko: '도널드의 보트' },
    'グーフィーのペイント＆プレイハウス': { en: 'Goofy\'s Paint \'n\' Play House', zh: '高飞油漆屋', ko: '구피의 페인트 앤 플레이 하우스' },
    'スター・ツアーズ：ザ・アドベンチャーズ・コンティニュー': { en: 'Star Tours: The Adventures Continue', zh: '星际旅行：冒险继续', ko: '스타 투어즈: 더 어드벤처 컨티뉴' },
    'モンスターズ・インク"ライド＆ゴーシーク！"': { en: 'Monsters, Inc. Ride & Go Seek!', zh: '怪兽电力公司"迷藏巡游车"', ko: '몬스터 주식회사 라이드 앤 고 시크!' },
    'ペニーアーケード': { en: 'Penny Arcade', zh: '便士街机', ko: '페니 아케이드' },
    'トゥーンパーク': { en: 'Toontown Park', zh: '卡通城公园', ko: '툰타운 파크' },
    'スティッチ・エンカウンター': { en: 'Stitch Encounter', zh: '史迪奇见面会', ko: '스티치 인카운터' },
    'ベイマックスのハッピーライド': { en: 'Baymax\'s Happy Ride', zh: '大白快乐骑乘', ko: '베이맥스의 해피 라이드' },
    '美女と野獣"魔法のものがたり"': { en: 'Beauty and the Beast', zh: '美女与野兽"魔法物语"', ko: '미녀와 야수 "마법의 이야기"' },
    'アリエルのプレイグラウンド': { en: 'Ariel\'s Playground', zh: '小美人鱼的游乐场', ko: '인어공주 놀이터' },
    'トイ・ストーリー・マニア！': { en: 'Toy Story Mania!', zh: '玩具总动员疯狂游戏屋', ko: '토이 스토리 매니아!' },
    'ソアリン：ファンタスティック・フライト': { en: 'Soaring: Fantastic Flight', zh: '翱翔：梦幻奇航', ko: '소아링: 판타스틱 플라이트' },
    'ジャスミンのフライングカーペット': { en: 'Jasmine\'s Flying Carpets', zh: '茉莉的飞天魔毯', ko: '자스민의 플라잉 카펫' },
    'センター・オブ・ジ・アース': { en: 'Journey to the Center of the Earth', zh: '地心探险之旅', ko: '지구 중심으로의 여행' },
    'インディ・ジョーンズ・アドベンチャー：クリスタルスカルの魔宮': { en: 'Indiana Jones Adventure: Temple of the Crystal Skull', zh: '印第安纳琼斯冒险：水晶骷髅头魔宫', ko: '인디아나 존스 어드벤처: 크리스탈 스컬의 신전' },
    '海底２万マイル': { en: '20,000 Leagues Under the Sea', zh: '海底两万里', ko: '해저 2만 리' },
    'マーメイドラグーンシアター': { en: 'Mermaid Lagoon Theater', zh: '美人鱼礁湖剧场', ko: '인어 라군 시어터' },
    'マジックランプシアター': { en: 'Magic Lamp Theater', zh: '神灯剧场', ko: '마법 램프 시어터' },
    'ディズニーシー・トランジットスチーマーライン（アメリカンウォーターフロント）': { en: 'DisneySea Transit Steamer Line (American Waterfront)', zh: '迪士尼海洋渡轮航线（美国海滨）', ko: '디즈니시 트랜짓 스티머 라인 (아메리칸 워터프론트)' },
    'ディズニーシー・トランジットスチーマーライン（メディテレーニアンハーバー）': { en: 'DisneySea Transit Steamer Line (Mediterranean Harbor)', zh: '迪士尼海洋渡轮航线（地中海港湾）', ko: '디즈니시 트랜짓 스티머 라인 (메디테라니안 하버)' },
    'ディズニーシー・トランジットスチーマーライン（ロストリバーデルタ）': { en: 'DisneySea Transit Steamer Line (Lost River Delta)', zh: '迪士尼海洋渡轮航线（失落河三角洲）', ko: '디즈니시 트랜짓 스티머 라인 (로스트 리버 델타)' },
    'ヴェネツィアン・ゴンドラ': { en: 'Venetian Gondolas', zh: '威尼斯贡多拉', ko: '베네치안 곤돌라' },
    'ディズニーシー・エレクトリックレールウェイ（ポートディスカバリー）': { en: 'DisneySea Electric Railway (Port Discovery)', zh: '迪士尼海洋电气化铁路（发现港）', ko: '디즈니시 전기 철도 (포트 디스커버리)' },
    'ディズニーシー・エレクトリックレールウェイ（アメリカンウォーターフロント）': { en: 'DisneySea Electric Railway (American Waterfront)', zh: '迪士尼海洋电气化铁路（美国海滨）', ko: '디즈니시 전기 철도 (아메리칸 워터프론트)' },
    'ビッグシティ・ヴィークル': { en: 'Big City Vehicles', zh: '大都会交通工具', ko: '빅 시티 비클' },
    'アクアトピア': { en: 'Aquatopia', zh: '水上逗趣船', ko: '아쿠아토피아' },
    'シンドバッド・ストーリーブック・ヴォヤッジ': { en: 'Sindbad\'s Storybook Voyage', zh: '辛巴达传奇之旅', ko: '신드바드 스토리북 보이지' },
    'キャラバンカルーセル': { en: 'Caravan Carousel', zh: '旋转木马', ko: '캐러밴 회전목마' },
    'フランダーのフライングフィッシュコースター': { en: 'Flounder\'s Flying Fish Coaster', zh: '小胖的飞鱼云霄飞车', ko: '플라운더의 플라잉 피시 코스터' },
    'スカットルのスクーター': { en: 'Scuttle\'s Scooters', zh: '史卡托的寄居蟹', ko: '스커틀의 스쿠터' },
    'ジャンピン・ジェリーフィッシュ': { en: 'Jumpin\' Jellyfish', zh: '跳跃水母', ko: '점핑 젤리피시' },
    'ブローフィッシュ・バルーンレース': { en: 'Blowfish Balloon Race', zh: '河豚气球竞赛', ko: '블로우피시 풍선 경주' },
    'ワールプール': { en: 'Whirlpool', zh: '漩涡', ko: '와일풀' },
    'レイジングスピリッツ': { en: 'Raging Spirits', zh: '忿怒双神', ko: '레이징 스피릿츠' },
    'タワー・オブ・テラー': { en: 'Tower of Terror', zh: '惊魂古塔', ko: '타워 오브 테러' },
    'フォートレス・エクスプロレーション': { en: 'Fortress Explorations', zh: '要塞探索', ko: '포트리스 익스플로레이션' },
    'フォートレス・エクスプロレーション"ザ・レオナルドチャレンジ"': { en: 'Fortress Explorations "The Leonardo Challenge"', zh: '要塞探索"达芬奇挑战"', ko: '포트리스 익스플로레이션 "레오나르도 챌린지"' },
    'タートル・トーク': { en: 'Turtle Talk', zh: '海龟漫谈', ko: '터틀 토크' },
    'ニモ＆フレンズ・シーライダー': { en: 'Nemo & Friends SeaRider', zh: '尼莫和好友的海洋世界', ko: '니모 앤 프렌즈 씨라이더' },
    'アナとエルサのフローズンジャーニー': { en: 'Anna and Elsa\'s Frozen Journey', zh: '安娜与艾莎的冰雪奇缘', ko: '안나와 엘사의 겨울왕국 여행' },
    'ラプンツェルのランタンフェスティバル': { en: 'Rapunzel\'s Lantern Festival', zh: '长发公主的灯笼节', ko: '라푼젤의 랜턴 페스티벌' },
    'ピーターパンのネバーランドアドベンチャー': { en: 'Peter Pan\'s Never Land Adventure', zh: '小飞侠梦幻岛历险', ko: '피터팬의 네버랜드 어드벤처' },
    'フェアリー・ティンカーベルのビジーバギー': { en: 'Fairy Tinker Bell\'s Busy Buggies', zh: '小叮当的忙碌小飞车', ko: '요정 팅커벨의 비지 버기' },
    'ミニーのスタイルスタジオ': { en: 'Minnie\'s Style Studio', zh: '米妮的时尚工作室', ko: '미니의 스타일 스튜디오' },
    'メインストリート・ハウス前（キャラクターグリーティング）': { en: 'Main Street House (Character Greeting)', zh: '主街房屋前（角色迎宾）', ko: '메인 스트리트 하우스 앞 (캐릭터 그리팅)' },
    'ミッキーの家とミート・ミッキー': { en: 'Mickey\'s House and Meet Mickey', zh: '米奇的家和与米奇见面', ko: '미키의 집과 미트 미키' },
    'ウッドチャック・グリーティングトレイル（ドナルド）': { en: 'Woodchuck Greeting Trail (Donald)', zh: '花栗鼠迎宾小径（唐老鸭）', ko: '우드척 그리팅 트레일 (도널드)' },
    'ウッドチャック・グリーティングトレイル（デイジー）': { en: 'Woodchuck Greeting Trail (Daisy)', zh: '花栗鼠迎宾小径（黛西）', ko: '우드척 그리팅 트레일 (데이지)' },
    'ミッキー&フレンズ・グリーティングトレイル（ミッキー）': { en: 'Mickey & Friends Greeting Trail (Mickey)', zh: '米奇和朋友们迎宾小径（米奇）', ko: '미키 앤 프렌즈 그리팅 트레일 (미키)' },
    'ミッキー&フレンズ・グリーティングトレイル（ミニー）': { en: 'Mickey & Friends Greeting Trail (Minnie)', zh: '米奇和朋友们迎宾小径（米妮）', ko: '미키 앤 프렌즈 그리팅 트레일 (미니)' },
    'ミッキー&フレンズ・グリーティングトレイル（ドナルド）': { en: 'Mickey & Friends Greeting Trail (Donald)', zh: '米奇和朋友们迎宾小径（唐老鸭）', ko: '미키 앤 프렌즈 그리팅 트레일 (도널드)' },
    '"サルードス・アミーゴス！"グリーティングドック': { en: '"¡Saludos Amigos!" Greeting Dock', zh: '"致候吾友！"迎宾码头', ko: '"살루도스 아미고스!" 그리팅 독' },
    'ヴィレッジ・グリーティングプレイス': { en: 'Village Greeting Place', zh: '村庄迎宾广场', ko: '빌리지 그리팅 플레이스' },
    'ディズニーシー・プラザ（キャラクターグリーティング）': { en: 'DisneySea Plaza (Character Greeting)', zh: '迪士尼海洋广场（角色迎宾）', ko: '디즈니시 플라자 (캐릭터 그리팅)' }
};

// アトラクション名を翻訳する関数
function translateAttractionName(name, lang) {
    try {
        if (!name) return name;
        if (lang === 'ja') return name;
        if (ATTRACTION_NAMES_I18N[name] && ATTRACTION_NAMES_I18N[name][lang]) {
            return ATTRACTION_NAMES_I18N[name][lang];
        }
        return name; // 翻訳が見つからない場合は元の名前を返す
    } catch (error) {
        console.error('翻訳エラー:', error, name, lang);
        return name; // エラー時は元の名前を返す
    }
}

// パーク別のアトラクションID（簡易版、実際のデータから動的に取得する方が良い）
const PARK_ATTRACTIONS = {
    land: ['151', '152', '153', '154', '155', '156', '157', '158', '159', '160', '161', '162', '163', '164', '165', '166', '167', '168', '169', '170', '171', '172', '173', '174', '175', '176', '178', '179', '180', '181', '183', '189', '191', '194', '195', '196', '197', '890', '908', '909', '916', '917'], // ランドのグリーティングのみ
    sea: ['202', '218', '219', '220', '221', '222', '223', '224', '226', '227', '228', '229', '230', '231', '232', '233', '234', '235', '236', '237', '238', '239', '240', '241', '242', '243', '244', '245', '246', '247', '255', '256', '257', '258', '901', '902', '903', '904', '905', '921'] // シーのグリーティングを含む
};

let charts = {}; // チャートインスタンスを保持

// タブ切り替え
document.querySelectorAll('.park-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const park = tab.dataset.park;
        
        // タブのアクティブ状態を更新
        document.querySelectorAll('.park-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // コンテンツの表示を切り替え
        document.querySelectorAll('.park-content').forEach(c => c.classList.remove('active'));
        document.getElementById(`${park}-content`).classList.add('active');
        
        // データを読み込む（まだ読み込んでいない場合）
        if (!document.getElementById(`${park}-graphs`).dataset.loaded) {
            loadParkData(park);
        }
    });
});

// パークデータの読み込み
async function loadParkData(park) {
    const graphsContainer = document.getElementById(`${park}-graphs`);
    const i18n = window.i18n || {};
    const lang = window.currentLanguage || 'ja';
    const loadingText = (i18n[lang] && i18n[lang]['loading']) || 'データを読み込み中...';
    graphsContainer.innerHTML = `<div class="loading">${loadingText}</div>`;
    
    try {
        // Firebaseからデータを取得
        const data = await fetchWaitingTimes(park);
        
        if (data.length === 0) {
            graphsContainer.innerHTML = '<div class="error">データが見つかりませんでした。</div>';
            return;
        }
        
        // アトラクションごとにデータをグループ化
        const groupedData = groupDataByAttraction(data);
        
        // デバッグ: 890と909のデータを比較
        console.log('=== データグループ化後の確認 ===');
        if (groupedData['890']) {
            console.log('890のデータ:', groupedData['890'].length, '件');
            console.log('890の最初のデータ:', groupedData['890'][0]);
            console.log('890の最後のデータ:', groupedData['890'][groupedData['890'].length - 1]);
        } else {
            console.log('890のデータが見つかりません');
        }
        if (groupedData['909']) {
            console.log('909のデータ:', groupedData['909'].length, '件');
            console.log('909の最初のデータ:', groupedData['909'][0]);
            console.log('909の最後のデータ:', groupedData['909'][groupedData['909'].length - 1]);
        } else {
            console.log('909のデータが見つかりません');
        }
        
        // フィルタリング前のデータも確認
        const attr890Data = data.filter(d => String(d.attr_id) === '890');
        const attr909Data = data.filter(d => String(d.attr_id) === '909');
        console.log('フィルタリング前 - 890:', attr890Data.length, '件');
        console.log('フィルタリング前 - 909:', attr909Data.length, '件');
        
        // グラフを生成
        graphsContainer.innerHTML = '';
        graphsContainer.dataset.loaded = 'true';
        
        // パークのすべてのアトラクションを表示（データがないものも含む）
        const parkAttractionIds = PARK_ATTRACTIONS[park] || [];
        const allAttractionIds = [...new Set([...parkAttractionIds, ...Object.keys(groupedData)])].sort((a, b) => {
            // アトラクション名でソート
            const nameA = ATTRACTION_NAMES[a] || a;
            const nameB = ATTRACTION_NAMES[b] || b;
            return nameA.localeCompare(nameB, 'ja');
        });
        
        if (allAttractionIds.length === 0) {
            graphsContainer.innerHTML = '<div class="error">データが見つかりませんでした。</div>';
            return;
        }
        
        // すべてのアトラクションのカードを生成（データがない場合は空配列を渡す）
        allAttractionIds.forEach(attrId => {
            const graphCard = createGraphCard(attrId, groupedData[attrId] || []);
            graphsContainer.appendChild(graphCard);
        });
        
        const i18n = window.i18n || {};
        const lang = window.currentLanguage || 'ja';
        const dataLoadedText = (i18n[lang] && i18n[lang]['data-loaded']) || 'データ取得完了';
        const attractionsText = (i18n[lang] && i18n[lang]['attractions']) || 'アトラクション';
        updateStatusInfo(`${dataLoadedText}: ${Object.keys(groupedData).length}${attractionsText}`);
    } catch (error) {
        console.error('データ読み込みエラー:', error);
        graphsContainer.innerHTML = `<div class="error">エラーが発生しました: ${error.message}</div>`;
        const i18n = window.i18n || {};
        const lang = window.currentLanguage || 'ja';
        const errorText = (i18n[lang] && i18n[lang]['error']) || 'エラーが発生しました';
        updateStatusInfo(errorText);
    }
}

// ローカルファイルから待ち時間データを取得
async function fetchWaitingTimesFromLocalFile(park, date = null) {
    // 日付を指定しない場合は今日の日付を使用
    if (!date) {
        const today = new Date();
        date = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD形式
    }
    
    // 最大7日前まで遡ってファイルを探す
    const maxDaysBack = 7;
    let lastError = null;
    
    for (let daysBack = 0; daysBack <= maxDaysBack; daysBack++) {
        // 日付を計算（daysBack日前）
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - daysBack);
        const dateStr = targetDate.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD形式
        
        // ファイルパス（dataディレクトリから読み込む）
        const fileName = `waiting_times_${dateStr}.json`;
        const filePath = `data/${fileName}`;
        
        try {
            const response = await fetch(filePath);
            
            // Content-Typeを確認してJSONかどうかをチェック
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                // JSONではない場合（HTMLエラーページなど）
                const text = await response.text();
                if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                    // HTMLエラーページの場合は次の日付を試す
                    continue;
                } else {
                    throw new Error(`JSONファイルではありません（Content-Type: ${contentType}）: ${filePath}`);
                }
            }
            
            if (response.ok) {
                const data = await response.json();
                if (daysBack > 0) {
                    console.log(`ローカルファイルからデータを取得（${daysBack}日前のデータ）: ${filePath}`);
                } else {
                    console.log(`ローカルファイルからデータを取得: ${filePath}`);
                }
                return processCloudStorageData(data, park);
            } else {
                // HTTPエラーの場合は次の日付を試す
                continue;
            }
        } catch (error) {
            // ネットワークエラーやJSONパースエラーの場合は次の日付を試す
            lastError = error;
            continue;
        }
    }
    
    // すべての日付で失敗した場合
    console.error('ローカルファイル取得エラー: 過去7日間のファイルが見つかりませんでした');
    console.log(`最後のエラー:`, lastError);
    // エラー時はFirestoreから取得を試みる
    return await fetchWaitingTimesFromFirestore(park);
}

// Cloud Storageから待ち時間データを取得
async function fetchWaitingTimesFromCloudStorage(park, date = null) {
    // 日付を指定しない場合は今日の日付を使用
    if (!date) {
        const today = new Date();
        date = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD形式
    }
    
    // Cloud Storageのバケット名とパス（環境変数またはデフォルト値）
    const bucketName = window.CLOUD_STORAGE_BUCKET || 'wonderpasnavi-waiting-times';
    const basePath = `waiting_times/waiting_times_${date}`;
    
    try {
        // 今日の日付で始まる最新のファイルを探す
        // ファイル名パターン: waiting_times_YYYYMMDD_HHMMSS.json
        // 最新のファイルを取得するため、時間を逆順に試す
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        // 現在時刻から過去に向かって15分間隔でファイルを探す
        for (let hour = currentHour; hour >= 0; hour--) {
            const startMinute = (hour === currentHour) ? currentMinute : 59;
            for (let minute = startMinute; minute >= 0; minute -= 15) {
                const timestamp = `${date}_${String(hour).padStart(2, '0')}${String(minute).padStart(2, '0')}00`;
                const filePath = `${basePath}_${timestamp}.json`;
                const url = `https://storage.googleapis.com/${bucketName}/${filePath}`;
                
                try {
                    const response = await fetch(url);
                    if (response.ok) {
                        const data = await response.json();
                        console.log(`Cloud Storageからデータを取得: ${filePath}`);
                        return processCloudStorageData(data, park);
                    }
                } catch (e) {
                    // ファイルが見つからない場合は次のファイルを試す
                    continue;
                }
            }
        }
        
        // ファイルが見つからない場合、Firestoreから取得を試みる
        console.warn('Cloud Storageからファイルが見つかりません。Firestoreから取得を試みます。');
        return await fetchWaitingTimesFromFirestore(park);
    } catch (error) {
        console.error('Cloud Storage取得エラー:', error);
        // エラー時はFirestoreから取得を試みる
        return await fetchWaitingTimesFromFirestore(park);
    }
}

// Cloud Storageのデータを処理
function processCloudStorageData(data, park) {
    if (!Array.isArray(data)) {
        throw new Error('データ形式が不正です');
    }
    
    // データを変換
    const processedData = data.map(item => {
        let timestamp;
        if (typeof item.at_t === 'string') {
            timestamp = new Date(item.at_t);
        } else if (item.at_t instanceof Date) {
            timestamp = item.at_t;
        } else {
            timestamp = new Date();
        }
        
        return {
            attr_id: String(item.attr_id),
            waitingperiod: item.waitingperiod || 0,
            timestamp: timestamp
        };
    });
    
    // タイムスタンプ順にソート
    processedData.sort((a, b) => a.timestamp - b.timestamp);
    
    // パークでフィルタリング
    if (park === 'land') {
        const filtered = processedData.filter(d => {
            const id = parseInt(d.attr_id);
            // ランドのアトラクション（150-199）とランドのグリーティング（890, 908-909, 916-917）
            // シーのグリーティング（901-905, 921）は除外
            return (id >= 150 && id < 200) || 
                   (id === 890) || 
                   (id >= 908 && id <= 909) || 
                   (id >= 916 && id <= 917);
        });
        // デバッグ: 890のデータを確認
        const attr890 = filtered.filter(d => String(d.attr_id) === '890');
        if (attr890.length > 0) {
            console.log(`[processCloudStorageData-land] 890のデータ: ${attr890.length}件`);
        } else {
            console.log(`[processCloudStorageData-land] 890のデータが見つかりません（フィルタリング前: ${processedData.filter(d => String(d.attr_id) === '890').length}件）`);
        }
        return filtered;
    } else if (park === 'sea') {
        const filtered = processedData.filter(d => {
            const id = parseInt(d.attr_id);
            // シーのアトラクション（200-299）とシーのグリーティング（901-905, 921）
            return (id >= 200 && id < 300) || (id >= 901 && id <= 905) || id === 921;
        });
        // デバッグ: シーのグリーティング施設のデータを確認
        const seaGreetings = filtered.filter(d => {
            const id = parseInt(d.attr_id);
            return (id >= 901 && id <= 905) || id === 921;
        });
        console.log(`[processCloudStorageData-sea] シーのグリーティング施設のデータ: ${seaGreetings.length}件`);
        return filtered;
    }
    
    return processedData;
}

// Firestoreから待ち時間データを取得（フォールバック用）
async function fetchWaitingTimesFromFirestore(park) {
    if (!window.db) {
        throw new Error('Firebaseが初期化されていません');
    }
    
    // 過去24時間のデータを取得
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    try {
        // インデックスエラーを避けるため、orderByを使わずに取得してからソート
        const snapshot = await window.db.collection('waiting_times')
            .where('timestamp', '>=', yesterday)
            .get();
        
        const data = [];
        snapshot.forEach(doc => {
            const docData = doc.data();
            const timestamp = docData.timestamp?.toDate ? docData.timestamp.toDate() : 
                            (docData.timestamp instanceof Date ? docData.timestamp : new Date());
            
            data.push({
                attr_id: String(docData.attr_id),
                waitingperiod: docData.waitingperiod || 0,
                timestamp: timestamp
            });
        });
        
        // メモリ上でタイムスタンプ順にソート
        data.sort((a, b) => a.timestamp - b.timestamp);
        
        // パークでフィルタリング（簡易版：attr_idの範囲で判定）
        // ランド: 150-199, ランドのグリーティング（890, 908-909, 916-917）
        // シー: 200-299, シーのグリーティング（901-905, 921）
        if (park === 'land') {
            return data.filter(d => {
                const id = parseInt(d.attr_id);
                // ランドのアトラクション（150-199）とランドのグリーティング（890, 908-909, 916-917）
                // シーのグリーティング（901-905, 921）は除外
                return (id >= 150 && id < 200) || 
                       (id === 890) || 
                       (id >= 908 && id <= 909) || 
                       (id >= 916 && id <= 917);
            });
        } else if (park === 'sea') {
            return data.filter(d => {
                const id = parseInt(d.attr_id);
                // シーのアトラクション（200-299）とシーのグリーティング（901-905, 921）
                return (id >= 200 && id < 300) || (id >= 901 && id <= 905) || id === 921;
            });
        }
        
        return data;
    } catch (error) {
        console.error('Firebase取得エラー:', error);
        // インデックスエラーの場合、より詳細なメッセージを表示
        if (error.code === 'failed-precondition') {
            throw new Error('Firestoreのインデックスが必要です。エラーメッセージのリンクからインデックスを作成してください。');
        }
        throw error;
    }
}

// Firebaseから待ち時間データを取得（ローカルファイル優先）
async function fetchWaitingTimes(park) {
    // 1. ローカルファイルから取得を試みる（推奨：Cloud Storage不要）
    try {
        return await fetchWaitingTimesFromLocalFile(park);
    } catch (error) {
        console.warn('ローカルファイル取得エラー、Cloud Storageから取得を試みます:', error);
    }
    
    // 2. Cloud Storageから取得を試みる（フォールバック）
    try {
        return await fetchWaitingTimesFromCloudStorage(park);
    } catch (error) {
        console.warn('Cloud Storage取得エラー、Firestoreから取得を試みます:', error);
    }
    
    // 3. Firestoreから取得を試みる（最終フォールバック）
    return await fetchWaitingTimesFromFirestore(park);
}

// アトラクションごとにデータをグループ化
function groupDataByAttraction(data) {
    const grouped = {};
    
    data.forEach(item => {
        const attrId = String(item.attr_id);
        if (!grouped[attrId]) {
            grouped[attrId] = [];
        }
        grouped[attrId].push({
            time: item.timestamp,
            waitingperiod: item.waitingperiod
        });
    });
    
    // 時間順にソート
    Object.keys(grouped).forEach(attrId => {
        grouped[attrId].sort((a, b) => a.time - b.time);
    });
    
    return grouped;
}

// グラフカードを作成
function createGraphCard(attrId, data) {
    const card = document.createElement('div');
    card.className = 'graph-card';
    
    const lang = window.currentLanguage || 'ja';
    const nameJa = ATTRACTION_NAMES[attrId] || `アトラクション ${attrId}`;
    const name = translateAttractionName(nameJa, lang);
    
    card.innerHTML = `
        <h3 title="${name}">${name}</h3>
        <div class="graph-container">
            <canvas id="chart-${attrId}"></canvas>
        </div>
    `;
    
    // チャートを作成
    setTimeout(() => {
        createChart(attrId, data);
    }, 100);
    
    return card;
}

// Chart.jsでグラフを作成
function createChart(attrId, data) {
    const canvas = document.getElementById(`chart-${attrId}`);
    if (!canvas) return;
    
    // 既存のチャートがあれば破棄
    if (charts[attrId]) {
        charts[attrId].destroy();
    }
    
    const ctx = canvas.getContext('2d');
    
    if (data.length === 0) {
        // データがない場合はメッセージを表示
        console.log(`[${attrId}] データがありません（空配列）`);
        const i18n = window.i18n || {};
        const lang = window.currentLanguage || 'ja';
        const noDataText = (i18n[lang] && i18n[lang]['no-data']) || 'データがありません';
        canvas.parentElement.innerHTML = `<p style="text-align: center; color: #999; padding: 20px;">${noDataText}</p>`;
        return;
    }
    
    // デバッグ: データの最初の要素を確認
    console.log(`[${attrId}] データ件数: ${data.length}件, 最初のデータ:`, data[0]);
    
    // データが存在する日の9時から21時までを表示
    // 最初のデータの日付を取得
    const firstDataTime = data[0].time instanceof Date ? data[0].time : new Date(data[0].time);
    const dataDate = new Date(firstDataTime.getFullYear(), firstDataTime.getMonth(), firstDataTime.getDate());
    const dayStart = new Date(dataDate);
    dayStart.setHours(9, 0, 0, 0);
    const dayEnd = new Date(dataDate);
    dayEnd.setHours(21, 0, 0, 0);
    
    console.log(`[${attrId}] フィルタリング範囲: ${dayStart.toISOString()} ～ ${dayEnd.toISOString()}`);
    
    // その日の9時から21時までのデータをフィルタリング
    const filteredData = data.filter(d => {
        const time = d.time instanceof Date ? d.time : new Date(d.time);
        const inRange = time >= dayStart && time <= dayEnd;
        if (!inRange && attrId === '890') {
            console.log(`[${attrId}] フィルタリング除外: ${time.toISOString()}`);
        }
        return inRange;
    });
    
    console.log(`[${attrId}] フィルタリング後: ${filteredData.length}件`);
    
    if (filteredData.length === 0) {
        // データがない場合はメッセージを表示
        console.log(`[${attrId}] フィルタリング後、データがありません`);
        canvas.parentElement.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">データがありません</p>';
        return;
    }
    
    // データを準備（横軸のラベルを間引く）
    const step = Math.max(1, Math.floor(filteredData.length / 8)); // 最大8個のラベル
    const labels = [];
    const waitingTimes = [];
    
    filteredData.forEach((d, index) => {
        const date = d.time instanceof Date ? d.time : new Date(d.time);
        // ステップごと、または最初と最後のデータのみラベルを表示
        if (index % step === 0 || index === 0 || index === filteredData.length - 1) {
            labels.push(`${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`);
        } else {
            labels.push(''); // 空文字でラベルを非表示
        }
        waitingTimes.push(d.waitingperiod);
    });
    
    // 最大待ち時間を計算
    const maxWaitingTime = Math.max(...waitingTimes, 0);
    
    // 待ち時間の最大値に応じてカテゴリを決定（3種類）
    let category;
    let borderColor;
    let backgroundColor;
    let yAxisMax;
    
    if (maxWaitingTime <= 30) {
        // カテゴリ1（低）：30分以下 → 緑系
        category = 'low';
        borderColor = '#4CAF50';
        backgroundColor = 'rgba(76, 175, 80, 0.1)';
        yAxisMax = 30;
    } else if (maxWaitingTime <= 90) {
        // カテゴリ2（中）：30-90分 → オレンジ/黄色系
        category = 'medium';
        borderColor = '#FF9800';
        backgroundColor = 'rgba(255, 152, 0, 0.1)';
        yAxisMax = 90;
    } else {
        // カテゴリ3（高）：90分以上 → 赤系
        category = 'high';
        borderColor = '#F44336';
        backgroundColor = 'rgba(244, 67, 54, 0.1)';
        yAxisMax = Math.ceil(maxWaitingTime / 30) * 30; // 30分単位で切り上げ（最大180分まで）
        if (yAxisMax > 180) yAxisMax = 180; // 最大180分に制限
    }
    
    // ラベルが表示されている位置にのみ垂直の点線を表示するカスタムプラグイン
    // labels変数にアクセスできるように、プラグインを関数内で定義
    const verticalLinePlugin = {
        id: `verticalLinePlugin_${attrId}`,
        afterDraw: (chart) => {
            const ctx = chart.ctx;
            const xAxis = chart.scales.x;
            const yAxis = chart.scales.y;
            
            ctx.save();
            ctx.strokeStyle = 'rgba(196, 109, 150, 0.2)';
            ctx.setLineDash([3, 3]); // 点線スタイル
            ctx.lineWidth = 1;
            
            // 各ラベルをチェックして、空でない場合のみ線を描画
            labels.forEach((label, index) => {
                if (label && label !== '') {
                    const x = xAxis.getPixelForValue(index);
                    ctx.beginPath();
                    ctx.moveTo(x, yAxis.top);
                    ctx.lineTo(x, yAxis.bottom);
                    ctx.stroke();
                }
            });
            
            ctx.restore();
        }
    };
    
    charts[attrId] = new Chart(ctx, {
        type: 'line',
        plugins: [verticalLinePlugin],
        data: {
            labels: labels,
            datasets: [{
                label: '待ち時間（分）',
                data: waitingTimes,
                borderColor: borderColor,
                backgroundColor: backgroundColor,
                borderWidth: 1.5,
                fill: true,
                tension: 0.4,
                pointRadius: 0, // ポイントを非表示
                pointHoverRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // 凡例を非表示（小さなグラフのため）
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    titleFont: {
                        size: 9 // ツールチップのタイトルフォントサイズを小さく
                    },
                    bodyFont: {
                        size: 9 // ツールチップの本文フォントサイズを小さく
                    },
                    padding: 5, // ツールチップのパディングを小さく
                    cornerRadius: 3, // ツールチップの角丸を小さく
                    displayColors: false, // カラーインジケーターを非表示
                    titleSpacing: 3, // タイトルと本文の間隔を小さく
                    bodySpacing: 2, // 本文の行間を小さく
                    xAlign: 'center', // 水平方向の配置
                    yAlign: 'bottom', // 垂直方向の配置（上に表示）
                    position: 'nearest', // 最も近い位置に表示
                    callbacks: {
                        title: function(context) {
                            const itemTime = filteredData[context[0].dataIndex].time;
                            const date = itemTime instanceof Date ? itemTime : new Date(itemTime);
                            return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
                        },
                        label: function(context) {
                            const i18n = window.i18n || {};
                            const lang = window.currentLanguage || 'ja';
                            const minutesText = (i18n[lang] && i18n[lang]['minutes']) || '分';
                            return `${context.parsed.y}${minutesText}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: yAxisMax, // カテゴリに応じた最大値を設定
                    title: {
                        display: false // タイトルを非表示
                    },
                    ticks: {
                        maxTicksLimit: 5, // Y軸の目盛りを5個まで
                        stepSize: category === 'low' ? 10 : (category === 'medium' ? 30 : 30) // カテゴリに応じたステップサイズ
                    }
                },
                x: {
                    title: {
                        display: false // タイトルを非表示
                    },
                    ticks: {
                        maxRotation: 0,
                        minRotation: 0,
                        maxTicksLimit: 8, // X軸の目盛りを8個まで
                        font: {
                            size: 6 // デフォルト12pxの2分の1 = 6px
                        },
                        callback: function(value, index) {
                            // 空文字の場合は表示しない
                            return this.getLabelForValue(value) || '';
                        }
                    },
                    grid: {
                        display: false // グリッド線はカスタムプラグインで描画
                    }
                }
            }
        }
    });
}

// ステータス情報を更新
function updateStatusInfo(message) {
    const statusInfo = document.getElementById('status-info');
    if (statusInfo) {
        const i18n = window.i18n || {};
        const lang = window.currentLanguage || 'ja';
        const lastUpdatedText = (i18n[lang] && i18n[lang]['last-updated']) || '最終更新';
        const now = new Date();
        const localeMap = { 'ja': 'ja-JP', 'zh': 'zh-CN', 'en': 'en-US', 'ko': 'ko-KR' };
        const locale = localeMap[lang] || 'ja-JP';
        statusInfo.textContent = `${message} - ${lastUpdatedText}: ${now.toLocaleString(locale)}`;
    }
}

// 匿名認証でFirebaseに接続（閲覧のみのため）
async function initializeFirebaseAuth() {
    if (window.auth) {
        try {
            // 匿名認証でサインイン（既にサインイン済みの場合はスキップ）
            const currentUser = window.auth.currentUser;
            if (!currentUser) {
                await window.auth.signInAnonymously();
                console.log('匿名認証でサインインしました');
            }
        } catch (error) {
            console.error('匿名認証エラー:', error);
            // 匿名認証が失敗しても続行（セキュリティルールで許可されていれば動作する）
        }
    }
}

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
    // 匿名認証を試みてからデータを読み込む
    await initializeFirebaseAuth();
    // 言語変更時にグラフを再描画するため、loadParkDataをグローバルに公開
    window.loadParkData = loadParkData;
    loadParkData('land');
});

