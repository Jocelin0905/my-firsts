import { NavLink } from 'react-router-dom'

export function YearSwitcher({ years, currentYear, naturalYear }: { years: number[]; currentYear: number; naturalYear: number }) {
  return (
    <nav className="year-switcher" aria-label="Years">
      {years.map((year) => (
        <NavLink
          key={year}
          className={year === currentYear ? 'year-link is-active' : 'year-link'}
          to={year === naturalYear ? '/' : `/year/${year}`}
        >
          {year}
        </NavLink>
      ))}
    </nav>
  )
}
