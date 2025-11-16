import { TagForm } from '@/components/tags/TagForm'

export default function NewTagPage() {
  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">新規タグ追加</h1>
      <TagForm />
    </div>
  )
}
