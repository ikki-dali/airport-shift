'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import { BulkStaffImportModal } from './BulkStaffImportModal'
import { useRouter } from 'next/navigation'

interface Role {
  id: string
  name: string
}

interface Tag {
  id: string
  name: string
}

interface BulkImportButtonProps {
  roles: Role[]
  tags: Tag[]
}

export function BulkImportButton({ roles, tags }: BulkImportButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Upload className="h-4 w-4 mr-2" />
        一括追加
      </Button>

      <BulkStaffImportModal
        open={open}
        onOpenChange={setOpen}
        roles={roles}
        tags={tags}
        onSuccess={() => router.refresh()}
      />
    </>
  )
}
