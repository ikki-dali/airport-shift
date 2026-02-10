'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface ExportButtonProps {
  yearMonth: string
}

export function ExportButton({ yearMonth }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: 'excel' | 'csv') => {
    setIsExporting(true)

    try {
      const response = await fetch(`/api/shifts/export?yearMonth=${yearMonth}&format=${format}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `shift_${yearMonth}.${format === 'excel' ? 'xlsx' : 'csv'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      toast.error(`エクスポートに失敗しました: ${error.message}`)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="success"
        size="sm"
        onClick={() => handleExport('excel')}
        disabled={isExporting}
      >
        <Download className="h-4 w-4" />
        {isExporting ? 'エクスポート中...' : 'Excel出力'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('csv')}
        disabled={isExporting}
      >
        <Download className="h-4 w-4" />
        {isExporting ? 'エクスポート中...' : 'CSV出力'}
      </Button>
    </div>
  )
}
