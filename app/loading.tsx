export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* ヘッダースケルトン */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="h-4 w-64 bg-gray-100 rounded" />
      </div>

      {/* カードスケルトン */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg border p-6 space-y-3">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-8 w-16 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* テーブルスケルトン */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <div className="h-4 w-32 bg-gray-200 rounded" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 border-b last:border-b-0 flex gap-4">
            <div className="h-4 w-1/4 bg-gray-100 rounded" />
            <div className="h-4 w-1/3 bg-gray-100 rounded" />
            <div className="h-4 w-1/5 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
