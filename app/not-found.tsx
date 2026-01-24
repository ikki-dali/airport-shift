import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { FileQuestion } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <FileQuestion className="h-6 w-6 text-gray-600" />
          </div>
          <CardTitle className="text-xl">ページが見つかりません</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600">
            お探しのページは存在しないか、移動した可能性があります。
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <Link href="/">ホームへ戻る</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
