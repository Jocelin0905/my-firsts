import { useRef, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { createBackup, parseBackup } from '../features/backup/backup'
import { restoreBackup } from '../features/backup/restore'
import { useAppData } from '../hooks/useAppData'
import { useToast } from '../hooks/useToast'
import { clearImages, listImages } from '../storage/imageRepository'
import { APP_DATA_KEY } from '../storage/storageKeys'

function downloadJson(value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `my-firsts-backup-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function SettingsPage() {
  const { data, reload } = useAppData()
  const { showToast } = useToast()
  const fileInput = useRef<HTMLInputElement>(null)
  const [pendingImport, setPendingImport] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [busy, setBusy] = useState(false)

  const chooseBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const raw = await file.text()
      const parsed = parseBackup(raw)
      if (!parsed.ok) throw new Error(parsed.issues.join('；'))
      setPendingImport(raw)
    } catch (error) {
      showToast(error instanceof Error ? `无法导入：${error.message}` : '无法读取备份。', 'error')
    }
  }

  const exportBackup = async () => {
    if (!data) return
    setBusy(true)
    try {
      downloadJson(await createBackup(data, await listImages()))
      showToast('完整备份已导出。')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '备份失败。', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="settings-page">
      <div className="editor-page__top"><Link to="/">← 返回</Link><span>MY FIRSTS · V1</span></div>
      <header className="editor-heading"><p className="eyebrow">PREFERENCES & STORAGE</p><h1>Settings</h1></header>
      <section className="settings-section">
        <p className="eyebrow">DATA</p><h2>你的收藏，由你保管</h2>
        <div className="settings-actions">
          <button className="button" type="button" disabled={busy || !data} onClick={() => void exportBackup()}>Export Backup</button>
          <button className="button" type="button" disabled={busy} onClick={() => fileInput.current?.click()}>Import Backup</button>
          <input ref={fileInput} className="visually-hidden" type="file" accept="application/json,.json" onChange={(event) => void chooseBackup(event)} />
          <button className="text-button text-button--danger" type="button" disabled={busy} onClick={() => setConfirmClear(true)}>Clear All Data</button>
        </div>
      </section>
      <section className="settings-section"><p className="eyebrow">STORAGE</p><h2>所有记录保存在当前浏览器</h2><p>清除浏览器数据或使用无痕模式，可能导致记录丢失。换设备或换浏览器不会自动同步。V1 不提供账号和云同步。</p></section>
      <section className="settings-section"><p className="eyebrow">ABOUT</p><h2>My Firsts</h2><p>一个收藏某一年里，那些具有“第一次”意义的事情的私人生活档案。</p><small>Version 1.0.0 · Local-first edition</small></section>

      <ConfirmDialog
        open={pendingImport !== null}
        title="导入这份备份？"
        description="导入备份将覆盖当前浏览器中的 My Firsts 数据。完整校验已经通过。"
        confirmLabel="继续导入"
        danger={false}
        onCancel={() => setPendingImport(null)}
        onConfirm={() => void (async () => {
          if (!pendingImport) return
          const raw = pendingImport
          setPendingImport(null)
          setBusy(true)
          try {
            await restoreBackup(raw)
            reload()
            showToast('备份已完整恢复。')
          } catch (error) {
            showToast(error instanceof Error ? error.message : '导入失败，原数据未改变。', 'error')
          } finally { setBusy(false) }
        })()}
      />
      <ConfirmDialog
        open={confirmClear}
        title="清空全部数据？"
        description="此操作将删除所有 First 记录和照片，且无法恢复。"
        confirmLabel="确认清空"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => void (async () => {
          setConfirmClear(false)
          setBusy(true)
          try {
            localStorage.removeItem(APP_DATA_KEY)
            await clearImages()
            reload()
            showToast('所有 First 数据已清空。')
          } catch {
            showToast('清空未完全完成，请重试。', 'error')
          } finally { setBusy(false) }
        })()}
      />
    </main>
  )
}
