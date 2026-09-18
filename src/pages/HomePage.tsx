import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { EmptyState } from '../components/EmptyState'
import { FilterChips } from '../components/FilterChips'
import { FirstCard } from '../components/FirstCard'
import { YearSwitcher } from '../components/YearSwitcher'
import { getAvailableYears, selectFirsts, type FirstFilter } from '../domain/firsts'
import { useAppData } from '../hooks/useAppData'

export function HomePage() {
  const { year: routeYear } = useParams()
  const naturalYear = new Date().getFullYear()
  const year = routeYear ? Number(routeYear) : naturalYear
  const [filterState, setFilterState] = useState<{ year: number; value: FirstFilter }>(() => ({
    year: routeYear ? Number(routeYear) : naturalYear,
    value: 'All',
  }))
  const { data, recovery } = useAppData()

  if (recovery) return <Navigate to="/recovery" replace />
  if (!data || !Number.isInteger(year) || year < 1) return <Navigate to="/" replace />

  const filter = filterState.year === year ? filterState.value : 'All'
  const all = selectFirsts(data, year, 'All')
  const firsts = selectFirsts(data, year, filter)
  const years = getAvailableYears(data, naturalYear)
  const current = year === naturalYear

  return (
    <div className="app-shell">
      <AppHeader />
      <main>
        <section className="year-hero">
          <div>
            <p className="eyebrow">PERSONAL ARCHIVE · {current ? 'CURRENT EDITION' : 'ARCHIVE EDITION'}</p>
            <h1>{year}</h1>
          </div>
          <p className="year-summary">{current ? '今年已经收藏了' : `${year} 年共收藏了`}<strong>{all.length} 个第一次</strong></p>
        </section>
        <YearSwitcher years={years} currentYear={year} naturalYear={naturalYear} />
        <div className="wall-heading">
          <div><p className="eyebrow">THE COLLECTION</p><h2>Firsts Wall</h2></div>
          <div className="wall-actions">
            <Link to={`/year/${year}/review`}>Year in Firsts</Link>
            <Link className="button button--ink" to="/new">＋ 记录第一次</Link>
          </div>
        </div>
        {all.length === 0 ? <EmptyState current={current} /> : (
          <>
            <FilterChips value={filter} onChange={(value) => setFilterState({ year, value })} />
            {firsts.length === 0 ? <p className="filtered-empty">这个分类还没有 First。</p> : (
              <section className="firsts-grid" aria-label="Firsts Wall">
                {firsts.map((first) => <FirstCard first={first} key={first.id} />)}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}
