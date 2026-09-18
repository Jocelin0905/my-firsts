import { Link } from 'react-router-dom'

export function EmptyState({ current }: { current: boolean }) {
  return (
    <section className="empty-state">
      <span className="empty-state__number" aria-hidden="true">01</span>
      <h2>{current ? '今年的第一个“第一次”，会是什么？' : '这一年还没有留下 First。'}</h2>
      <Link className="button button--ink" to="/new">＋ 记录第一次</Link>
    </section>
  )
}
