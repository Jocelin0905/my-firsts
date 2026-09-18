import { Link, Navigate, useParams } from 'react-router-dom'
import { formatEditorialDate, formatFirstNumber } from '../components/FirstCard'
import { FIRST_CATEGORIES } from '../domain/types'
import { getYearStats } from '../domain/firsts'
import { useAppData } from '../hooks/useAppData'

const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

export function YearReviewPage() {
  const { year: routeYear } = useParams()
  const year = Number(routeYear)
  const { data } = useAppData()
  if (!data || !Number.isInteger(year) || year < 1) return <Navigate to="/" replace />
  const stats = getYearStats(data, year)
  const home = year === new Date().getFullYear() ? '/' : `/year/${year}`
  const maxMonth = Math.max(1, ...stats.months)

  return (
    <main className="review-page">
      <div className="editor-page__top"><Link to={home}>← {year}</Link><span>ANNUAL EDITION</span></div>
      <header className="review-hero"><p className="eyebrow">YEAR IN FIRSTS</p><h1>{year}</h1><p><strong>{stats.total}</strong> Firsts</p></header>
      {stats.total === 0 ? <section className="empty-state"><h2>这一年还没有留下 First。</h2><Link className="button button--ink" to="/new">＋ 记录第一次</Link></section> : (
        <>
          <section className="review-section"><p className="eyebrow">BY CATEGORY</p><h2>这一年，向哪里走了更远</h2><div className="category-ledger">
            {FIRST_CATEGORIES.filter((category) => stats.categories[category]).map((category) => <div key={category}><span>{category}</span><strong>{stats.categories[category]}</strong></div>)}
          </div></section>
          <section className="review-section"><p className="eyebrow">BY MONTH</p><h2>十二个月的刻度</h2><div className="month-chart">
            {stats.months.map((count, index) => <div className="month-row" key={months[index]}><span>{months[index]}</span><i style={{ '--month-size': `${(count / maxMonth) * 100}%` } as React.CSSProperties} /><strong>{count}</strong></div>)}
          </div></section>
          <section className="review-section"><p className="eyebrow">THE YEAR, IN ORDER</p><h2>从年初走到年末</h2><ol className="timeline">
            {stats.timeline.map((first) => <li key={first.id}><span>{formatEditorialDate(first.date)}</span><Link to={`/first/${first.id}`}>{first.title}</Link><small>FIRST {formatFirstNumber(first.number)}</small></li>)}
          </ol></section>
        </>
      )}
    </main>
  )
}
