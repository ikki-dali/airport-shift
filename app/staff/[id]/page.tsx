import { getStaffById } from '@/lib/actions/staff'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  try {
    const staff = await getStaffById(id)

    return (
      <div className="container mx-auto p-8 max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">スタッフ詳細</h1>
          <div className="flex gap-4">
            <Link
              href={`/staff/${staff.id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              編集
            </Link>
            <Link
              href="/staff"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              一覧に戻る
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          {/* 基本情報 */}
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold mb-4">基本情報</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">社員番号</dt>
                <dd className="mt-1 text-lg font-mono font-semibold text-blue-600">
                  {staff.employee_number}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">氏名</dt>
                <dd className="mt-1 text-lg font-semibold">{staff.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">メールアドレス</dt>
                <dd className="mt-1 text-sm">
                  {staff.email ? (
                    <a
                      href={`mailto:${staff.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {staff.email}
                    </a>
                  ) : (
                    <span className="text-gray-400">未登録</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">電話番号</dt>
                <dd className="mt-1 text-sm">
                  {staff.phone ? (
                    <a
                      href={`tel:${staff.phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {staff.phone}
                    </a>
                  ) : (
                    <span className="text-gray-400">未登録</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">役職</dt>
                <dd className="mt-1">
                  {staff.roles ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {staff.roles.name}
                      {staff.roles.is_responsible && (
                        <span className="ml-1 text-xs">(責任者)</span>
                      )}
                    </span>
                  ) : (
                    <span className="text-gray-400">未設定</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">在籍状況</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      staff.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {staff.is_active ? '在籍中' : '退職'}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          {/* タグ */}
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold mb-4">保有タグ</h2>
            {staff.tags && staff.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {staff.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">タグが設定されていません</p>
            )}
          </div>

          {/* メタ情報 */}
          <div className="p-6 bg-gray-50">
            <h2 className="text-xl font-semibold mb-4">その他の情報</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">登録日</dt>
                <dd className="mt-1 text-sm">
                  {new Date(staff.created_at).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">最終更新日</dt>
                <dd className="mt-1 text-sm">
                  {new Date(staff.updated_at).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* 将来実装: シフト履歴、希望提出履歴 */}
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">今後の実装予定</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>シフト割り当て履歴</li>
            <li>希望提出履歴</li>
            <li>勤務統計（月間勤務時間、出勤日数など）</li>
          </ul>
        </div>
      </div>
    )
  } catch (error) {
    notFound()
  }
}
