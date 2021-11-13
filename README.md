## URL
http://34.125.221.117:8080/ </br>

## ローカルでの実行方法
```bash
npm install　&& npm start
```

## 補足
自動でリダレクトされるデフォルトURLのパラメータ部分は好きに変えられます </br>
- lat, long: 各経度緯度
- types: Find APIの検索カテゴリ
- radius: 正方形領域の中心から展開される施設検索円の半径
- keyword: 検索キーワード

## メモ
Google Nearby Search API 1000リクエストにつき$32から </br>
領域最小分割単位の一辺が2kmになっているので、あまり大きな領域をリクエストするとStravaのレート制限に即座に引っかかります

