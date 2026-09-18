import { useAppData } from '../hooks/useAppData'

export function RecoveryPage() {
  const { recovery } = useAppData()
  return (
    <main className="missing-page">
      <p className="eyebrow">DATA RECOVERY</p>
      <h1>保存的数据需要检查</h1>
      <p>应用没有覆盖原始内容。你可以先下载原始数据，再决定如何恢复。</p>
      {recovery?.raw ? <button className="button" type="button" onClick={() => {
        const url = URL.createObjectURL(new Blob([recovery.raw ?? ''], { type: 'application/json' }))
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = 'my-firsts-recovery-data.txt'
        anchor.click()
        URL.revokeObjectURL(url)
      }}>下载原始数据</button> : null}
    </main>
  )
}
