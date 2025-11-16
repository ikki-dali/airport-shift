export default function Loading() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">シフト作成</h1>
        <p className="text-gray-600 mt-1">
          スタッフをドラッグ&ドロップしてシフトを作成
        </p>
      </div>

      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="text-gray-600">データを読み込んでいます...</p>
        </div>
      </div>
    </div>
  )
}
