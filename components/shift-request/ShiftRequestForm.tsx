'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Calendar, Check, Loader2 } from 'lucide-react'
import { upsertShiftRequestsForToken } from '@/lib/actions/shift-requests'

interface ShiftRequestFormProps {
  staffId: string
  staffName: string
  dates: Date[]
  existingRequests: Array<{
    staff_id: string
    date: string
    request_type: string
  }>
}

type RequestType = '◯' | '休' | '早朝' | '早番' | '遅番' | '夜勤' | ''

const REQUEST_OPTIONS: { value: RequestType; label: string; description: string; color: string; textColor: string }[] = [
  { value: '', label: '-', description: '希望なし', color: 'bg-gray-100', textColor: 'text-gray-800' },
  { value: '◯', label: '◯', description: '勤務希望', color: 'bg-green-100', textColor: 'text-green-800' },
  { value: '休', label: '休', description: '休み希望', color: 'bg-red-100', textColor: 'text-red-800' },
  { value: '早朝', label: '早朝', description: '早朝シフト', color: 'bg-blue-100', textColor: 'text-blue-800' },
  { value: '早番', label: '早番', description: '早番シフト', color: 'bg-cyan-100', textColor: 'text-cyan-800' },
  { value: '遅番', label: '遅番', description: '遅番シフト', color: 'bg-purple-100', textColor: 'text-purple-800' },
  { value: '夜勤', label: '夜勤', description: '夜勤シフト', color: 'bg-indigo-100', textColor: 'text-indigo-800' },
]

export function ShiftRequestForm({
  staffId,
  staffName,
  dates,
  existingRequests,
}: ShiftRequestFormProps) {
  // 既存の希望データから初期値を設定
  const initialRequests: Record<string, RequestType> = {}
  existingRequests.forEach((req) => {
    initialRequests[req.date] = req.request_type as RequestType
  })

  const [requests, setRequests] = useState<Record<string, RequestType>>(initialRequests)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleRequestChange = (date: Date, type: RequestType) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    setRequests((prev) => ({
      ...prev,
      [dateStr]: type,
    }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setSuccess(false)

    try {
      // 空でないリクエストのみを送信
      const validRequests = Object.entries(requests)
        .filter(([_, type]) => type !== '')
        .map(([date, type]) => ({
          staff_id: staffId,
          date,
          request_type: type as Exclude<RequestType, ''>,
        }))

      if (validRequests.length === 0) {
        alert('希望を選択してください')
        return
      }

      await upsertShiftRequestsForToken(validRequests)
      setSuccess(true)
      
      // 3秒後に成功メッセージを消す
      setTimeout(() => setSuccess(false), 3000)
    } catch (error: any) {
      console.error('Submit error:', error)
      alert(`提出に失敗しました: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* 凡例 */}
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">凡例</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {REQUEST_OPTIONS.filter(opt => opt.value !== '').map((option) => (
            <div key={option.value} className="flex items-center gap-2">
              <div className={`px-3 py-1 rounded text-sm font-medium ${option.color} ${option.textColor}`}>
                {option.label}
              </div>
              <span className="text-xs text-gray-600">{option.description}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 日付ごとの選択 */}
      <div className="grid gap-3">
        {dates.map((date) => {
          const dateStr = format(date, 'yyyy-MM-dd')
          const currentValue = requests[dateStr] || ''
          const option = REQUEST_OPTIONS.find(opt => opt.value === currentValue)

          return (
            <Card key={dateStr} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {format(date, 'M月d日', { locale: ja })}
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(date, 'EEEE', { locale: ja })}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap justify-end">
                  {REQUEST_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleRequestChange(date, opt.value)}
                      className={`
                        px-4 py-2 rounded-md text-sm font-medium transition-all
                        ${currentValue === opt.value 
                          ? `${opt.color} ${opt.textColor} ring-2 ring-offset-2 ring-gray-400` 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }
                      `}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* 提出ボタン */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 h-12 text-base"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                提出中...
              </>
            ) : success ? (
              <>
                <Check className="mr-2 h-5 w-5" />
                提出完了！
              </>
            ) : (
              <>
                <Calendar className="mr-2 h-5 w-5" />
                希望を提出する
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 成功メッセージ */}
      {success && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <Check className="h-5 w-5" />
          <span>希望を提出しました！</span>
        </div>
      )}
    </div>
  )
}
