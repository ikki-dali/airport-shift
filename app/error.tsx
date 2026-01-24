'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl">エラーが発生しました</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600">
            予期せぬエラーが発生しました。もう一度お試しいただくか、ホームに戻ってください。
          </p>
        </CardContent>
        <CardFooter className="flex justify-center gap-3">
          <Button onClick={reset} variant="default">
            再試行
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">ホームへ戻る</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
