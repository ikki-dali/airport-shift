'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Save, 
  Loader2, 
  Phone, 
  Clock, 
  Users,
} from 'lucide-react'
import { updateSettings, type SystemSetting } from '@/lib/actions/settings'
import { toast } from 'sonner'

interface SettingsFormProps {
  initialSettings: SystemSetting[]
}

interface SettingField {
  key: string
  label: string
  description: string
  type: 'number' | 'text' | 'tel'
  suffix?: string
  min?: number
  max?: number
  placeholder?: string
}

const SHIFT_SETTINGS: SettingField[] = [
  {
    key: 'default_required_staff',
    label: 'デフォルト必要人数',
    description: '配属箇所要件が設定されていない場合の1日あたり必要人数',
    type: 'number',
    suffix: '人',
    min: 1,
    max: 500,
  },
  {
    key: 'shift_confirm_deadline_days',
    label: 'シフト確定期限',
    description: 'シフト確定の期限（何日前まで）',
    type: 'number',
    suffix: '日前',
    min: 1,
    max: 30,
  },
]

const EMERGENCY_SETTINGS: SettingField[] = [
  {
    key: 'emergency_phone_number',
    label: '緊急連絡先電話番号',
    description: '欠勤連絡時に表示される電話番号',
    type: 'tel',
    placeholder: '090-1234-5678',
  },
]

const DISPLAY_SETTINGS: SettingField[] = [
  {
    key: 'timeline_start_hour',
    label: 'タイムライン開始時間',
    description: 'ダッシュボードのタイムライン表示開始時間',
    type: 'number',
    suffix: '時',
    min: 0,
    max: 23,
  },
  {
    key: 'timeline_end_hour',
    label: 'タイムライン終了時間',
    description: 'ダッシュボードのタイムライン表示終了時間',
    type: 'number',
    suffix: '時',
    min: 1,
    max: 24,
  },
  {
    key: 'display_days_count',
    label: '表示日数',
    description: 'シフト作成画面で表示する日数',
    type: 'number',
    suffix: '日',
    min: 7,
    max: 31,
  },
]

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [loading, setLoading] = useState(false)
  const [values, setValues] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    initialSettings.forEach((s) => {
      map[s.key] = s.value
    })
    return map
  })

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await updateSettings(values)
      toast.success('設定を保存しました')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '設定の保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const renderField = (field: SettingField) => {
    const value = values[field.key] ?? ''

    return (
      <div key={field.key} className="space-y-2">
        <label htmlFor={field.key} className="block text-sm font-medium text-gray-700">
          {field.label}
        </label>
        <div className="flex items-center gap-2">
          <input
            id={field.key}
            type={field.type}
            value={value}
            onChange={(e) => handleChange(field.key, e.target.value)}
            min={field.min}
            max={field.max}
            placeholder={field.placeholder}
            className="w-full max-w-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          {field.suffix && (
            <span className="text-sm text-gray-500">{field.suffix}</span>
          )}
        </div>
        <p className="text-xs text-gray-500">{field.description}</p>
      </div>
    )
  }

  const renderSection = (
    title: string,
    icon: React.ReactNode,
    fields: SettingField[],
    iconBg: string
  ) => (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-lg ${iconBg}`}>
          {icon}
        </div>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="space-y-6">
        {fields.map(renderField)}
      </div>
    </Card>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {renderSection(
        'シフト設定',
        <Users className="h-5 w-5 text-primary" />,
        SHIFT_SETTINGS,
        'bg-primary/10'
      )}

      {renderSection(
        '緊急連絡',
        <Phone className="h-5 w-5 text-red-600" />,
        EMERGENCY_SETTINGS,
        'bg-red-100'
      )}

      {renderSection(
        '表示設定',
        <Clock className="h-5 w-5 text-green-600" />,
        DISPLAY_SETTINGS,
        'bg-green-100'
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              設定を保存
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
