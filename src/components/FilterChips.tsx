import { FIRST_CATEGORIES } from '../domain/types'
import type { FirstFilter } from '../domain/firsts'

export function FilterChips({ value, onChange }: { value: FirstFilter; onChange: (value: FirstFilter) => void }) {
  return (
    <div className="filters" aria-label="Filter by category">
      {(['All', ...FIRST_CATEGORIES] as FirstFilter[]).map((category) => (
        <button
          className={value === category ? 'filter is-active' : 'filter'}
          type="button"
          key={category}
          aria-pressed={value === category}
          onClick={() => onChange(category)}
        >
          {category}
        </button>
      ))}
    </div>
  )
}
