import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { FirstImage } from '../components/FirstImage'
import { formatEditorialDate, formatFirstNumber } from '../components/FirstCard'
import { useAppData } from '../hooks/useAppData'
import { useToast } from '../hooks/useToast'

export function FirstDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, deleteFirst } = useAppData()
  const { showToast } = useToast()
  const [confirming, setConfirming] = useState(false)
  const first = data?.firsts.find((candidate) => candidate.id === id)

  if (!first) return <main className="missing-page"><h1>找不到这个 First</h1><Link to="/">返回今年</Link></main>
  const home = first.year === new Date().getFullYear() ? '/' : `/year/${first.year}`

  return (
    <main className="detail-page">
      <div className="editor-page__top"><Link to={home}>← {first.year}</Link><span>ARCHIVE RECORD</span></div>
      <article className="detail-ticket">
        <div className="detail-ticket__visual"><FirstImage imageId={first.imageId} alt={first.title} /></div>
        <div className="detail-ticket__content">
          <p className="eyebrow">MY FIRSTS · {first.year}</p>
          <p className="detail-ticket__number">FIRST {formatFirstNumber(first.number)}</p>
          <h1>{first.title}</h1>
          <p className="detail-ticket__date">{formatEditorialDate(first.date)} · {first.category.toUpperCase()}</p>
          {first.note ? <blockquote>{first.note}</blockquote> : null}
        </div>
      </article>
      <div className="detail-actions">
        <Link className="button" to={`/first/${first.id}/edit`}>编辑</Link>
        <button className="text-button text-button--danger" type="button" onClick={() => setConfirming(true)}>删除</button>
      </div>
      <ConfirmDialog
        open={confirming}
        title="删除这个第一次？"
        description="删除后无法恢复。"
        onCancel={() => setConfirming(false)}
        onConfirm={() => void deleteFirst(first.id).then(() => {
          showToast('已删除这个 First。')
          navigate(home)
        }).catch(() => showToast('删除失败，请重试。', 'error'))}
      />
    </main>
  )
}
