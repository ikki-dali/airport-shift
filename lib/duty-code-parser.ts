/**
 * 勤務記号パーサー
 *
 * 勤務記号フォーマット: [開始時][開始分][勤務時間][勤務分][休憩]
 * 例: 06G5DA
 * - 06: 6時台
 * - G: 30分（A=0, B=5, C=10... 5分刻み）
 * - 5: 5時間（0は10時間として扱う）
 * - D: 15分（A=0, B=5, C=10... 5分刻み）
 * - A: 休憩なし（無=1時間、A=なし、Y=1.5時間、W=2時間）
 */

// アルファベットを分に変換（A=0, B=5, C=10... 5分刻み）
function letterToMinutes(letter: string): number {
  const code = letter.charCodeAt(0) - 'A'.charCodeAt(0);
  return code * 5;
}

// 休憩記号を分に変換
function breakCodeToMinutes(code: string): number {
  switch (code) {
    case 'A':
      return 0; // なし
    case 'Y':
      return 90; // 1.5時間
    case 'W':
      return 120; // 2時間
    default:
      return 60; // 無指定は1時間
  }
}

export interface ParsedDutyCode {
  code: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationHours: number;
  durationMinutes: number;
  breakMinutes: number;
  isOvernight: boolean;
}

export function parseDutyCode(code: string): ParsedDutyCode {
  // 勤務記号の構造: 06G5DA (6桁) or 06A9A (5桁)
  // [0-1]: 開始時 (06)
  // [2]: 開始分 (G)
  // [3]: 勤務時間 (5) ※0は10時間
  // [4]: 勤務分 (D)
  // [5]: 休憩 (A) ※5桁の場合は省略され、60分デフォルト

  if (code.length !== 6 && code.length !== 5) {
    throw new Error(`Invalid duty code format: ${code}`);
  }

  const startHour = parseInt(code.substring(0, 2), 10);
  const startMinute = letterToMinutes(code[2]);

  let durationHours = parseInt(code[3], 10);
  if (durationHours === 0) {
    durationHours = 10; // 0は10時間として扱う
  }

  const durationMinutes = letterToMinutes(code[4]);
  // 5桁コードは休憩なし扱い（60分デフォルト）
  const breakMinutes = code.length === 6 && code[5] ? breakCodeToMinutes(code[5]) : 60;

  // 開始時刻
  const startTime = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;

  // 終了時刻の計算
  const totalMinutes = startHour * 60 + startMinute + durationHours * 60 + durationMinutes;
  const endHour = Math.floor(totalMinutes / 60) % 24;
  const endMinute = totalMinutes % 60;
  const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

  // 日またぎの判定
  const isOvernight = totalMinutes >= 24 * 60;

  return {
    code,
    startTime,
    endTime,
    durationHours,
    durationMinutes,
    breakMinutes,
    isOvernight,
  };
}

// 勤務記号一覧（33種類）のデフォルトデータ - 実Excelデータから抽出
export const DEFAULT_DUTY_CODES = [
  // 早番（04-09時台開始）
  { code: '04A5GA', category: '早番' },
  { code: '04J5JA', category: '早番' },
  { code: '05D5AA', category: '早番' },
  { code: '05G5AA', category: '早番' },
  { code: '06A6AA', category: '早番' },
  { code: '06A9A', category: '早番' },   // 5桁: 休憩なし（60分デフォルト）
  { code: '06G9AY', category: '早番' },
  { code: '06J1JT', category: '早番' },
  { code: '06J9AW', category: '早番' },
  { code: '07A2GY', category: '早番' },
  { code: '07G2AY', category: '早番' },
  { code: '09G2GY', category: '早番' },

  // 日勤（10-15時台開始）
  { code: '10A5AA', category: '日勤' },
  { code: '12A8AY', category: '日勤' },
  { code: '12A9A', category: '日勤' },   // 5桁: 休憩なし（60分デフォルト）
  { code: '13A9A', category: '日勤' },   // 5桁: 休憩なし（60分デフォルト）
  { code: '13J5DA', category: '日勤' },
  { code: '14A5AA', category: '日勤' },
  { code: '14A9A', category: '日勤' },   // 5桁: 休憩なし（60分デフォルト）
  { code: '14D7JY', category: '日勤' },
  { code: '14D8G', category: '日勤' },
  { code: '14G4GA', category: '日勤' },
  { code: '14J8D', category: '日勤' },
  { code: '15A5AA', category: '日勤' },
  { code: '15A7J', category: '日勤' },

  // 遅番（16-23時台開始）
  { code: '16G6GG', category: '遅番' },
  { code: '18G4GA', category: '遅番' },
  { code: '19A1AO', category: '遅番' },
  { code: '19A4AA', category: '遅番' },
  { code: '22A0AY', category: '遅番' },
  { code: '22A8AW', category: '遅番' },
  { code: '22A9GY', category: '遅番' },
  { code: '23A1AO', category: '遅番' },
];
