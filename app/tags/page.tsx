import { getTags } from '@/lib/actions/tags'
import { TagTable } from '@/components/tags/TagTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function TagsPage() {
  const tags = await getTags()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">タグ管理</h1>
          <p className="text-gray-600 mt-1">技能・資格タグの登録・編集・削除</p>
        </div>
        <Link href="/tags/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            新規タグ追加
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>登録タグ一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <TagTable tags={tags} />
        </CardContent>
      </Card>
    </div>
  )
}
