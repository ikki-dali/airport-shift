import { Suspense } from 'react'
import { LoginForm } from './LoginForm'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Suspense fallback={
        <div className="w-full max-w-md animate-pulse">
          <div className="h-96 rounded-xl border bg-white shadow-sm" />
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
