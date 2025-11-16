import { LocationForm } from '@/components/locations/LocationForm'

export default function NewLocationPage() {
  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">新規配属箇所追加</h1>
      <LocationForm />
    </div>
  )
}
