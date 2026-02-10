'use client'

interface ViewModeSwitcherProps {
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
}

export function ViewModeSwitcher({ viewMode, onViewModeChange }: ViewModeSwitcherProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-1">
      <button
        onClick={() => onViewModeChange('grid')}
        className={`flex items-center gap-2 rounded px-3 py-2 text-sm font-medium transition-colors ${
          viewMode === 'grid'
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted'
        }`}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
          />
        </svg>
        グリッド
      </button>
      <button
        onClick={() => onViewModeChange('list')}
        className={`flex items-center gap-2 rounded px-3 py-2 text-sm font-medium transition-colors ${
          viewMode === 'list'
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted'
        }`}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
        リスト
      </button>
    </div>
  )
}
