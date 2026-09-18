import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FirstForm } from '../components/FirstForm'
import { useAppData } from '../hooks/useAppData'
import { useToast } from '../hooks/useToast'

export function EditFirstPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, editFirst } = useAppData()
  const { showToast } = useToast()
  const [busy, setBusy] = useState(false)
  const first = data?.firsts.find((candidate) => candidate.id === id)

  if (!first) return <main className="missing-page"><h1>找不到这个 First</h1><Link to="/">返回今年</Link></main>

  return (
    <main className="editor-page">
      <div className="editor-page__top"><Link to={`/first/${first.id}`}>← 取消</Link><span>EDIT · FIRST #{String(first.number).padStart(3, '0')}</span></div>
      <header className="editor-heading"><p className="eyebrow">UPDATE THE RECORD</p><h1>编辑 First</h1><p>跨年份移动时，会在目标年份获得新的编号。</p></header>
      <FirstForm
        initial={first}
        submitLabel="保存修改"
        busy={busy}
        onSubmit={async (draft, imageFile, removeImage) => {
          setBusy(true)
          try {
            const result = await editFirst(first.id, draft, imageFile, removeImage)
            showToast('已更新这个第一次。')
            navigate(`/first/${result.first.id}`)
          } catch (error) {
            showToast(error instanceof Error ? error.message : '保存失败，请重试。', 'error')
          } finally {
            setBusy(false)
          }
        }}
      />
    </main>
  )
}
