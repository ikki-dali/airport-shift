# TICKET-007: Excel希望表取り込み機能

## ステータス
📋 未着手

## 優先度
⭐⭐⭐⭐⭐ 最高

## 複雑度
Complex

## 概要
現行のExcel希望表をアップロード・パースしてshift_requestsテーブルに保存

## 成果物
- [x] `/app/requests/upload/page.tsx` - Excel取り込みページ
- [x] `/app/requests/page.tsx` - 希望データ一覧ページ
- [x] `/lib/parsers/excel-parser.ts` - Excelパーサー
- [x] `/lib/actions/shift-requests.ts` - Server Actions
- [x] `/components/requests/` - 関連コンポーネント
  - `ExcelUploader.tsx` - ファイルアップロード
  - `ParsePreview.tsx` - パース結果プレビュー
  - `ImportResults.tsx` - 取り込み結果表示

## 依存関係
- TICKET-002: データベーススキーマ構築
- TICKET-005: スタッフ管理（スタッフマスタが必要）

## 機能要件

### Excelアップロード
- ファイル選択（.xlsx, .xls対応）
- ドラッグ&ドロップ対応
- ファイルサイズチェック（最大10MB）
- ファイル形式チェック

### Excelパース処理
- xlsxライブラリを使用
- 希望表フォーマットの解析
  - ヘッダー行の検出
  - スタッフ名の抽出
  - 日付列の検出
  - 希望内容（◯/休/早朝/早番/遅番/夜勤）の解析

### パース結果プレビュー
- 検出されたスタッフ一覧
- 期間（年月）
- 取り込み対象件数
- エラー・警告の表示
  - 存在しないスタッフ
  - 不正な希望タイプ
  - 日付フォーマット不正

### データ保存
- shift_requestsテーブルへの一括挿入
- トランザクション処理
- 既存データの上書き確認
  - 同じ年月の希望データが存在する場合は警告

### 取り込み結果表示
- 成功件数
- スキップ件数
- エラー詳細

## Excelフォーマット仕様（仮定）

### 想定されるフォーマット
```
| 社員番号 | 氏名     | 12/1 | 12/2 | 12/3 | ... | 12/31 |
|----------|----------|------|------|------|-----|-------|
| 0001     | 山田太郎 | ◯    | 休   | 早朝 | ... | ◯     |
| 0002     | 佐藤花子 | 早番 | ◯    | 休   | ... | 遅番  |
```

または

```
| 氏名     | 12/1 | 12/2 | 12/3 | ... | 12/31 |
|----------|------|------|------|-----|-------|
| 山田太郎 | ◯    | 休   | 早朝 | ... | ◯     |
| 佐藤花子 | 早番 | ◯    | 休   | ... | 遅番  |
```

## パーサー実装例

```typescript
import * as XLSX from 'xlsx'

interface ParsedRequest {
  staffId: string
  staffName: string
  date: string
  requestType: '◯' | '休' | '早朝' | '早番' | '遅番' | '夜勤'
}

interface ParseResult {
  yearMonth: string
  requests: ParsedRequest[]
  errors: string[]
  warnings: string[]
}

export async function parseExcelFile(
  file: File,
  staffList: { id: string; name: string; employee_number: string }[]
): Promise<ParseResult> {
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })

  const requests: ParsedRequest[] = []
  const errors: string[] = []
  const warnings: string[] = []

  // ヘッダー行の解析
  const headerRow = data[0] as string[]
  const dateColumns: { index: number; date: string }[] = []

  // 日付列の検出（12/1, 12/2 などの形式）
  headerRow.forEach((cell, index) => {
    if (typeof cell === 'string' && /\d{1,2}\/\d{1,2}/.test(cell)) {
      dateColumns.push({ index, date: cell })
    }
  })

  if (dateColumns.length === 0) {
    errors.push('日付列が見つかりません')
    return { yearMonth: '', requests, errors, warnings }
  }

  // 年月の推定（最初の日付から）
  const firstDate = dateColumns[0].date
  const [month] = firstDate.split('/')
  const currentYear = new Date().getFullYear()
  const yearMonth = `${currentYear}-${month.padStart(2, '0')}`

  // データ行の解析
  for (let i = 1; i < data.length; i++) {
    const row = data[i] as any[]

    // スタッフ名または社員番号の取得
    const staffName = row[1] || row[0] // 氏名は2列目または1列目
    const employeeNumber = row[0] // 社員番号は1列目（存在する場合）

    // スタッフの検索
    const staff = staffList.find(
      (s) => s.name === staffName || s.employee_number === employeeNumber
    )

    if (!staff) {
      warnings.push(`スタッフが見つかりません: ${staffName}`)
      continue
    }

    // 各日付の希望を解析
    dateColumns.forEach(({ index, date }) => {
      const requestValue = row[index]

      if (requestValue && typeof requestValue === 'string') {
        const [month, day] = date.split('/')
        const fullDate = `${currentYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`

        // 希望タイプの検証
        const validTypes = ['◯', '休', '早朝', '早番', '遅番', '夜勤']
        if (validTypes.includes(requestValue)) {
          requests.push({
            staffId: staff.id,
            staffName: staff.name,
            date: fullDate,
            requestType: requestValue as any,
          })
        } else {
          warnings.push(
            `不正な希望タイプ: ${requestValue} (${staff.name}, ${fullDate})`
          )
        }
      }
    })
  }

  return { yearMonth, requests, errors, warnings }
}
```

## UI設計

### アップロード画面
```
+--------------------------------------------------+
| Excel希望表取り込み                                |
+--------------------------------------------------+
| [ファイルを選択] または ドラッグ&ドロップ            |
|                                                  |
| +----------------------------------------------+ |
| |                                              | |
| |     📄 ここにファイルをドロップ               | |
| |                                              | |
| +----------------------------------------------+ |
|                                                  |
| [次へ]                                           |
+--------------------------------------------------+
```

### プレビュー画面
```
+--------------------------------------------------+
| パース結果プレビュー                               |
+--------------------------------------------------+
| 対象年月: 2025年12月                              |
| 検出スタッフ数: 150名                             |
| 取り込み対象件数: 4,500件                          |
|                                                  |
| ⚠️ 警告: 3件                                     |
| - スタッフが見つかりません: 田中一郎               |
| - 不正な希望タイプ: × (山田太郎, 2025-12-05)      |
|                                                  |
| [キャンセル] [取り込み実行]                        |
+--------------------------------------------------+
```

### 結果画面
```
+--------------------------------------------------+
| 取り込み完了                                      |
+--------------------------------------------------+
| ✅ 成功: 4,497件                                 |
| ⚠️ スキップ: 3件                                 |
|                                                  |
| [希望データ一覧へ] [新しいファイルを取り込む]       |
+--------------------------------------------------+
```

## バリデーション
- ファイル形式: .xlsx, .xls
- ファイルサイズ: 最大10MB
- スタッフ存在チェック
- 希望タイプチェック（◯/休/早朝/早番/遅番/夜勤）
- 日付フォーマットチェック

## エラーハンドリング
- ファイル読み込みエラー
- パースエラー
- データベース挿入エラー
- トランザクションロールバック

## テスト項目
- [ ] Excelファイルのアップロードができる
- [ ] xlsxファイルが正しくパースされる
- [ ] xlsファイルが正しくパースされる
- [ ] スタッフ名からスタッフIDへのマッピングが正しい
- [ ] 社員番号からスタッフIDへのマッピングが正しい
- [ ] 日付列が正しく検出される
- [ ] 希望タイプが正しく解析される
- [ ] 不正なデータはスキップされる
- [ ] エラー・警告が正しく表示される
- [ ] データベースへの保存が成功する
- [ ] 既存データの上書き確認が表示される

## ブロッカー
⚠️ **現行のExcelフォーマットのサンプルファイルが必要**

実際のフォーマットを確認してからパーサーを実装する必要があります。

## 完了条件
- [ ] Excelファイルの取り込みが正常に動作する
- [ ] パース結果のプレビューが表示される
- [ ] エラーハンドリングが適切
- [ ] 取り込み結果が正しく表示される

## 見積もり工数
10-12時間（フォーマット確認後）

## 開始予定日
2025-11-19

## 完了予定日
2025-11-20
