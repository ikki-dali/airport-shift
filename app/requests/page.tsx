import { getShiftRequestsGroupedByYearMonth } from '@/lib/actions/shift-requests'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ShiftRequestsPage() {
  const groupedRequests = await getShiftRequestsGroupedByYearMonth()

  const formatYearMonth = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-')
    return `${year}年${parseInt(month, 10)}月`
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">希望データ一覧</h1>
          <p className="text-gray-600">
            取り込まれたシフト希望データを月別に確認できます
          </p>
        </div>
        <Link
          href="/requests/upload"
          className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium"
        >
          + Excel取り込み
        </Link>
      </div>

      {groupedRequests.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            希望データがありません
          </h2>
          <p className="text-gray-600 mb-6">
            まずはExcelファイルから希望データを取り込んでください
          </p>
          <Link
            href="/requests/upload"
            className="inline-block px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium"
          >
            Excel取り込みを開始
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  年月
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  希望件数
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {groupedRequests.map((item) => (
                <tr key={item.year_month} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-lg font-semibold text-gray-900">
                      {formatYearMonth(item.year_month)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {item.count.toLocaleString()} 件
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/requests/${item.year_month}`}
                      className="text-gray-900 hover:text-gray-600 font-semibold"
                    >
                      詳細を見る →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-6 py-4 bg-gray-50 border-t">
            <p className="text-sm text-gray-600">
              全 {groupedRequests.length} ヶ月分のデータ
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">ℹ️ 次のステップ</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• 希望データを確認したら、シフト作成画面で実際のシフトを組み立てます</li>
          <li>• シフト作成時には配属箇所の要件設定が参照されます</li>
          <li>
            • 制約チェック機能により、人数不足や責任者不足などが自動検出されます
          </li>
        </ul>
      </div>
    </div>
  )
}
