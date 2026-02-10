# TICKET-052: マスタデータのデフォルト値を実データに更新

## 担当
Backend

## 概要
実際のExcelシフト表（【現状】アサイン.xlsb）から抽出したデータを元に、システムのマスタデフォルト値を更新する。

## 更新対象

### 1. 配属箇所（locations）
**現在**: T3中央/T3北/T2中央/バス案内/横特

**新規**:
| code | location_name | business_type |
|------|---------------|---------------|
| T3C | T3中央 | 保安検査場案内業務 |
| T3N | T3北側 | 保安検査場案内業務 |
| T2C | T2中央検査場 | 保安検査場案内業務 |
| T3CB | T3クリーンバス | バス案内業務 |
| T3IB | T3際際バス | バス案内業務 |
| T2CB | T2クリーンバス | バス案内業務 |
| T2IB | T2際際バス | バス案内業務 |

### 2. 業務タグ（tags）
**現在**: 保安検査/バス案内/横特/OSS/番台

**新規**:
- 番台（メイン業務）
- OSS
- ソラシド（航空会社対応）
- MU（航空会社対応）
- MC（航空会社対応）
- KE（航空会社対応）
- TG（航空会社対応）
- 際際バス
- クリーンバス

### 3. 勤務記号（duty_codes）
Excelから抽出した33種類の勤務コード。一部5桁形式あり。

**6桁形式のもの（パーサー対応済み）:**
```
04A5GA, 04J5JA, 05D5AA, 05G5AA, 06A6AA, 06G9AY, 06J1JT, 06J9AW,
07A2GY, 07G2AY, 09G2GY, 10A5AA, 12A8AY, 13J5DA, 14A5AA, 14D7JY,
14D8G, 14G4GA, 14J8D, 15A5AA, 15A7J, 16G6GG, 18G4GA, 19A1AO,
19A4AA, 22A0AY, 22A8AW, 22A9GY, 23A1AO
```

**5桁形式（要対応）:**
```
06A9A, 12A9A, 13A9A, 14A9A
```
→ これらは休憩なし（60分デフォルト）として扱う

## 更新ファイル
1. `lib/duty-code-parser.ts` - DEFAULT_DUTY_CODES更新、5桁対応
2. `lib/seed/seed-data.ts` - locations, tags更新
3. `lib/seed/demo-data.ts` - locations定義更新

## 完了条件
- [ ] duty-code-parser.tsのDEFAULT_DUTY_CODESを実データに更新
- [ ] parseDutyCode関数が5桁コードにも対応
- [ ] seed-data.tsのlocationsを7箇所に更新
- [ ] seed-data.tsのtagsを9種類に更新
- [ ] demo-data.tsのlocations定義を更新
- [ ] `pnpm build` が通る
