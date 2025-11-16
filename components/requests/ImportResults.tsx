'use client'

import Link from 'next/link'

interface ImportResultsProps {
  insertedCount: number
  overwrittenCount: number
  yearMonth: string
  onReset: () => void
}

export function ImportResults({
  insertedCount,
  overwrittenCount,
  yearMonth,
  onReset,
}: ImportResultsProps) {
  const formatYearMonth = (ym: string) => {
    const [year, month] = ym.split('-')
    return `${year}年${parseInt(month, 10)}月`
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-green-900 mb-2">
          取り込み完了
        </h2>
        <p className="text-gray-600">
          Excelファイルのデータをデータベースに正常に取り込みました
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-600 font-medium mb-1">対象年月</div>
          <div className="text-xl font-bold text-blue-900">
            {formatYearMonth(yearMonth)}
          </div>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-sm text-green-600 font-medium mb-1">
            取り込み件数
          </div>
          <div className="text-xl font-bold text-green-900">
            {insertedCount.toLocaleString()} 件
          </div>
        </div>
      </div>

      {overwrittenCount > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-xl">ℹ️</span>
            <p className="text-sm text-yellow-800">
              既存データ {overwrittenCount.toLocaleString()} 件を上書きしました
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <Link
          href="/requests"
          className="block w-full px-6 py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition font-medium"
        >
          希望データ一覧を表示
        </Link>
        <button
          onClick={onReset}
          className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
        >
          別のファイルを取り込む
        </button>
        <Link
          href="/"
          className="block w-full px-6 py-3 bg-white text-gray-700 text-center border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          ホームに戻る
        </Link>
      </div>
    </div>
  )
}
