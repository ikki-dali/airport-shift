import { getSettings } from '@/lib/actions/settings'
import { SettingsForm } from '@/components/admin/SettingsForm'
import { Settings } from 'lucide-react'

export default async function SettingsPage() {
  const settings = await getSettings()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="h-8 w-8" />
          システム設定
        </h1>
        <p className="text-gray-600 mt-1">
          システム全体の設定を管理します
        </p>
      </div>

      <SettingsForm initialSettings={settings} />
    </div>
  )
}
