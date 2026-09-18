import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FirstForm } from '../components/FirstForm'
import { useAppData } from '../hooks/useAppData'
import { useToast } from '../hooks/useToast'

export function NewFirstPage() {
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const { createFirst } = useAppData()
  const { showToast } = useToast()

  return (
    <main className="editor-page">
      <div className="editor-page__top"><Link to="/">← 返回</Link><span>NEW ENTRY</span></div>
      <header className="editor-heading"><p className="eyebrow">ADD TO THE ARCHIVE</p><h1>记录第一次</h1><p>只留下一件真正值得记住的事。</p></header>
      <FirstForm
        submitLabel="保存第一次"
        busy={busy}
        onSubmit={async (draft, imageFile) => {
          setBusy(true)
          try {
            const result = await createFirst(draft, imageFile)
            showToast(result.milestone ? `今年已经收藏了 ${result.milestone} 个第一次。` : '已收藏这个第一次。', result.milestone ? 'milestone' : 'default')
            navigate(result.first.year === new Date().getFullYear() ? '/' : `/year/${result.first.year}`)
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
