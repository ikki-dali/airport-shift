import { describe, it, expect } from 'vitest'
import { parseDutyCode, ParsedDutyCode } from './duty-code-parser'

describe('duty-code-parser', () => {
  describe('parseDutyCode', () => {
    describe('6桁コード', () => {
      it('06A6AA（早番）が正しくパースされる', () => {
        const result = parseDutyCode('06A6AA')
        expect(result.code).toBe('06A6AA')
        expect(result.startTime).toBe('06:00')
        expect(result.durationHours).toBe(6)
        expect(result.durationMinutes).toBe(0)
        expect(result.breakMinutes).toBe(0) // A = なし
        expect(result.isOvernight).toBe(false)
      })

      it('開始時刻が正しく計算される', () => {
        const result = parseDutyCode('06A6AA')
        expect(result.startTime).toBe('06:00')
        const endHour = parseInt(result.endTime.split(':')[0], 10)
        const endMinute = parseInt(result.endTime.split(':')[1], 10)
        expect(endHour).toBe(12)
        expect(endMinute).toBe(0)
      })

      it('アルファベットが分に正しく変換される', () => {
        // G = 6 * 5 = 30分
        const result = parseDutyCode('06G5DA')
        expect(result.startTime).toBe('06:30')
        expect(result.durationHours).toBe(5)
        expect(result.durationMinutes).toBe(15) // D = 3 * 5 = 15分
      })

      it('休憩記号が正しく解析される（Y = 1.5時間）', () => {
        const result = parseDutyCode('06G9AY')
        expect(result.breakMinutes).toBe(90)
      })

      it('休憩記号が正しく解析される（W = 2時間）', () => {
        const result = parseDutyCode('06J9AW')
        expect(result.breakMinutes).toBe(120)
      })

      it('休憩記号が正しく解析される（無指定 = 1時間）', () => {
        const result = parseDutyCode('06G5D')
        expect(result.breakMinutes).toBe(60)
      })

      it('勤務時間0は10時間として扱われる', () => {
        const result = parseDutyCode('22A0AY')
        expect(result.durationHours).toBe(10)
        expect(result.durationMinutes).toBe(0)
      })

      it('日またぎが正しく判定される', () => {
        const result = parseDutyCode('22A0AY') // 22時開始、10時間 = 8時翌日
        expect(result.isOvernight).toBe(true)
        expect(result.endTime).toBe('08:00')
      })

      it('複雑な計算例1: 19A1AO', () => {
        const result = parseDutyCode('19A1AO')
        expect(result.startTime).toBe('19:00')
        expect(result.durationHours).toBe(1)
        expect(result.durationMinutes).toBe(0) // A = 0分
        expect(result.breakMinutes).toBe(60) // O = 無指定（60分）
        expect(result.endTime).toBe('20:00')
        expect(result.isOvernight).toBe(false)
      })

      it('複雑な計算例2: 14D8G', () => {
        const result = parseDutyCode('14D8G')
        expect(result.startTime).toBe('14:15') // D = 1 * 5 = 15分
        expect(result.durationHours).toBe(8)
        expect(result.durationMinutes).toBe(30) // G = 6 * 5 = 30分
        expect(result.breakMinutes).toBe(60) // 無指定（6桁だが[5]なし）
        expect(result.endTime).toBe('22:45')
        expect(result.isOvernight).toBe(false)
      })
    })

    describe('5桁コード（休憩デフォルト60分）', () => {
      it('06A9Aが正しくパースされる', () => {
        const result = parseDutyCode('06A9A')
        expect(result.code).toBe('06A9A')
        expect(result.startTime).toBe('06:00')
        expect(result.durationHours).toBe(9)
        expect(result.durationMinutes).toBe(0)
        expect(result.breakMinutes).toBe(60) // 5桁はデフォルト60分
        expect(result.isOvernight).toBe(false)
      })

      it('12A9Aが正しくパースされる', () => {
        const result = parseDutyCode('12A9A')
        expect(result.code).toBe('12A9A')
        expect(result.startTime).toBe('12:00')
        expect(result.durationHours).toBe(9)
        expect(result.durationMinutes).toBe(0)
        expect(result.breakMinutes).toBe(60)
        expect(result.isOvernight).toBe(false)
      })

      it('13A9Aが正しくパースされる', () => {
        const result = parseDutyCode('13A9A')
        expect(result.code).toBe('13A9A')
        expect(result.startTime).toBe('13:00')
        expect(result.durationHours).toBe(9)
        expect(result.durationMinutes).toBe(0)
        expect(result.breakMinutes).toBe(60)
        expect(result.isOvernight).toBe(false)
      })

      it('14A9Aが正しくパースされる', () => {
        const result = parseDutyCode('14A9A')
        expect(result.code).toBe('14A9A')
        expect(result.startTime).toBe('14:00')
        expect(result.durationHours).toBe(9)
        expect(result.durationMinutes).toBe(0)
        expect(result.breakMinutes).toBe(60)
        expect(result.isOvernight).toBe(false)
      })

      it('5桁コードでも開始時刻の分が正しく計算される', () => {
        const result = parseDutyCode('06G9A')
        expect(result.startTime).toBe('06:30') // G = 6 * 5 = 30分
        expect(result.breakMinutes).toBe(60)
      })

      it('5桁コードでも勤務時間が0なら10時間', () => {
        const result = parseDutyCode('06A0A')
        expect(result.durationHours).toBe(10)
        expect(result.breakMinutes).toBe(60)
      })
    })

    describe('エラーケース', () => {
      it('4桁コードはエラーになる', () => {
        expect(() => parseDutyCode('06A6')).toThrow(
          'Invalid duty code format: 06A6'
        )
      })

      it('7桁コードはエラーになる', () => {
        expect(() => parseDutyCode('06A6AAA')).toThrow(
          'Invalid duty code format: 06A6AAA'
        )
      })

      it('3桁コードはエラーになる', () => {
        expect(() => parseDutyCode('06A')).toThrow(
          'Invalid duty code format: 06A'
        )
      })

      it('空文字列はエラーになる', () => {
        expect(() => parseDutyCode('')).toThrow(
          'Invalid duty code format: '
        )
      })

      it('8桁以上はエラーになる', () => {
        expect(() => parseDutyCode('06A6AAAA')).toThrow(
          'Invalid duty code format: 06A6AAAA'
        )
      })
    })

    describe('戻り値の構造', () => {
      it('ParsedDutyCodeインターフェースの全フィールドが返される', () => {
        const result = parseDutyCode('06A6AA')
        expect(result).toHaveProperty('code')
        expect(result).toHaveProperty('startTime')
        expect(result).toHaveProperty('endTime')
        expect(result).toHaveProperty('durationHours')
        expect(result).toHaveProperty('durationMinutes')
        expect(result).toHaveProperty('breakMinutes')
        expect(result).toHaveProperty('isOvernight')
      })

      it('startTimeとendTimeはHH:mm形式', () => {
        const result = parseDutyCode('06A6AA')
        expect(result.startTime).toMatch(/^\d{2}:\d{2}$/)
        expect(result.endTime).toMatch(/^\d{2}:\d{2}$/)
      })

      it('数値フィールドは正の整数', () => {
        const result = parseDutyCode('06A6AA')
        expect(Number.isInteger(result.durationHours)).toBe(true)
        expect(Number.isInteger(result.durationMinutes)).toBe(true)
        expect(Number.isInteger(result.breakMinutes)).toBe(true)
        expect(result.durationHours >= 0).toBe(true)
        expect(result.durationMinutes >= 0).toBe(true)
        expect(result.breakMinutes >= 0).toBe(true)
      })

      it('isOvernightはboolean', () => {
        const result = parseDutyCode('06A6AA')
        expect(typeof result.isOvernight).toBe('boolean')
      })
    })

    describe('境界値テスト', () => {
      it('最小開始時刻（00時台）が処理される', () => {
        const result = parseDutyCode('00A5AA')
        expect(result.startTime).toBe('00:00')
        expect(result.durationHours).toBe(5)
      })

      it('最大開始時刻（23時台）が処理される', () => {
        const result = parseDutyCode('23A1AO')
        expect(result.startTime).toBe('23:00')
        expect(result.durationHours).toBe(1)
      })

      it('最大の勤務時間（0=10時間）が処理される', () => {
        const result = parseDutyCode('06A0AA')
        expect(result.durationHours).toBe(10)
      })

      it('最大のアルファベット（Z=125分）が処理される', () => {
        // Z = (90 - 65) * 5 = 25 * 5 = 125分（実装確認用）
        const result = parseDutyCode('06A5Z')
        expect(result.durationMinutes).toBe(125)
      })
    })

    describe('実データセットのサンプル', () => {
      it('04A5GA（早番）が正しくパースされる', () => {
        const result = parseDutyCode('04A5GA')
        expect(result.startTime).toBe('04:00')
        expect(result.durationHours).toBe(5)
        expect(result.durationMinutes).toBe(30) // G = 6 * 5 = 30分（勤務分）
        expect(result.breakMinutes).toBe(0) // A = なし（休憩コード）
        expect(result.isOvernight).toBe(false)
      })

      it('12A8AY（日勤）が正しくパースされる', () => {
        const result = parseDutyCode('12A8AY')
        expect(result.startTime).toBe('12:00')
        expect(result.durationHours).toBe(8)
        expect(result.durationMinutes).toBe(0)
        expect(result.breakMinutes).toBe(90)
        expect(result.isOvernight).toBe(false)
      })

      it('16G6GG（遅番）が正しくパースされる', () => {
        const result = parseDutyCode('16G6GG')
        expect(result.startTime).toBe('16:30') // G = 30分
        expect(result.durationHours).toBe(6)
        expect(result.durationMinutes).toBe(30) // G = 30分
        expect(result.breakMinutes).toBe(60) // G = 無指定以外として60分デフォルト（実装仕様）
        expect(result.isOvernight).toBe(false)
      })
    })
  })
})
