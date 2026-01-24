import { getTag } from '@/lib/actions/tags'
import { TagForm } from '@/components/tags/TagForm'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function EditTagPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let tag;
  try {
    tag = await getTag(id)
  } catch {
    notFound()
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">タグ編集</h1>
      <TagForm tag={tag} />
    </div>
  )
}
