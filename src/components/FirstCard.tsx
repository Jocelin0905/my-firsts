import { Link } from 'react-router-dom'
import type { First } from '../domain/types'
import { FirstImage } from './FirstImage'

const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

export function formatFirstNumber(number: number) {
  return `#${String(number).padStart(3, '0')}`
}

export function formatEditorialDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return `${String(day).padStart(2, '0')} ${monthNames[month - 1]} ${year}`
}

export function FirstCard({ first }: { first: First }) {
  return (
    <Link className={`first-card first-card--${first.category.toLowerCase()}`} to={`/first/${first.id}`}>
      <div className="first-card__meta"><span>MY FIRSTS</span><span>{first.year}</span></div>
      <FirstImage className="first-card__image" imageId={first.thumbnailId} alt={first.title} />
      <div className="first-card__body">
        <p className="first-card__number">FIRST {formatFirstNumber(first.number)}</p>
        <h3>{first.title}</h3>
        <div className="first-card__footer"><span>{formatEditorialDate(first.date)}</span><span>{first.category.toUpperCase()}</span></div>
      </div>
    </Link>
  )
}
