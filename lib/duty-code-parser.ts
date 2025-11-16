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
  // 勤務記号の構造: 06G5DA
  // [0-1]: 開始時 (06)
  // [2]: 開始分 (G)
  // [3]: 勤務時間 (5) ※0は10時間
  // [4]: 勤務分 (D)
  // [5]: 休憩 (A)

  if (code.length !== 6) {
    throw new Error(`Invalid duty code format: ${code}`);
  }

  const startHour = parseInt(code.substring(0, 2), 10);
  const startMinute = letterToMinutes(code[2]);

  let durationHours = parseInt(code[3], 10);
  if (durationHours === 0) {
    durationHours = 10; // 0は10時間として扱う
  }

  const durationMinutes = letterToMinutes(code[4]);
  const breakMinutes = code[5] ? breakCodeToMinutes(code[5]) : 60;

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

// 勤務記号一覧（28種類）のデフォルトデータ
export const DEFAULT_DUTY_CODES = [
  // T3中央（第3ターミナル中央保安検査場） - 12種類
  { code: '06A6AA', category: 'T3中央' },
  { code: '06G5DA', category: 'T3中央' },
  { code: '08J5DA', category: 'T3中央' },
  { code: '14A5AA', category: 'T3中央' },
  { code: '14A6AA', category: 'T3中央' },
  { code: '14G5DA', category: 'T3中央' },
  { code: '18A5AA', category: 'T3中央' },
  { code: '18A5GA', category: 'T3中央' },
  { code: '18G5DA', category: 'T3中央' },
  { code: '22A5AA', category: 'T3中央' },
  { code: '22A9AA', category: 'T3中央' },
  { code: '22A9AY', category: 'T3中央' },

  // T3北（第3ターミナル北側検査場） - 3種類
  { code: '06J0AW', category: 'T3北' },
  { code: '15A7JA', category: 'T3北' },
  { code: '17J5AA', category: 'T3北' },

  // T2中央（第2ターミナル国際線検査場） - 5種類
  { code: '06A6AA', category: 'T2中央' },
  { code: '19A5AA', category: 'T2中央' },
  { code: '19A5GA', category: 'T2中央' },
  { code: '06G5DA', category: 'T2中央' },
  { code: '14A5AA', category: 'T2中央' },

  // バス案内業務 - 10種類
  { code: '04J5AA', category: 'バス案内' },
  { code: '05D8GA', category: 'バス案内' },
  { code: '06A6AA', category: 'バス案内' },
  { code: '18J6AA', category: 'バス案内' },
  { code: '19A5AA', category: 'バス案内' },
  { code: '19A8AA', category: 'バス案内' },
  { code: '19G7JA', category: 'バス案内' },
  { code: '22A5AA', category: 'バス案内' },
  { code: '22A6AA', category: 'バス案内' },
  { code: '22A8AA', category: 'バス案内' },

  // 横特業務（東方航空バゲージ） - 1種類
  { code: '05G4AA', category: '横特' },
];
