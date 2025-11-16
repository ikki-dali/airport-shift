import { getLocation } from '@/lib/actions/locations'
import { LocationForm } from '@/components/locations/LocationForm'
import { notFound } from 'next/navigation'

export default async function EditLocationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  try {
    const location = await getLocation(id)

    return (
      <div className="container mx-auto p-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">配属箇所編集</h1>
        <LocationForm location={location} />
      </div>
    )
  } catch (error) {
    notFound()
  }
}
