import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { FIRST_CATEGORIES, type First, type FirstCategory } from '../domain/types'
import type { FirstDraft } from '../domain/firsts'
import { validateImageFile } from '../features/images/imageProcessor'
import { FirstImage } from './FirstImage'

function localToday() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

interface FirstFormProps {
  initial?: First
  submitLabel: string
  busy: boolean
  onSubmit: (draft: FirstDraft, imageFile?: File, removeImage?: boolean) => Promise<void>
}

export function FirstForm({ initial, submitLabel, busy, onSubmit }: FirstFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [date, setDate] = useState(initial?.date ?? localToday())
  const [category, setCategory] = useState<FirstCategory>(initial?.category ?? 'Other')
  const [note, setNote] = useState(initial?.note ?? '')
  const [imageFile, setImageFile] = useState<File>()
  const [removeExistingImage, setRemoveExistingImage] = useState(false)
  const [error, setError] = useState('')
  const previewUrl = useMemo(() => imageFile ? URL.createObjectURL(imageFile) : null, [imageFile])
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const cleanTitle = title.trim()
    if (!cleanTitle) return setError('请写下这个第一次。')
    if (cleanTitle.length > 60) return setError('标题不能超过 60 个字符。')
    if (!date) return setError('请选择发生日期。')
    if (date > localToday()) return setError('未来的事情还不能收藏为 First。')
    if (note.length > 120) return setError('一句话不能超过 120 个字符。')
    setError('')
    await onSubmit({ title: cleanTitle, date, category, ...(note ? { note } : {}) }, imageFile, removeExistingImage)
  }

  return (
    <form className="first-form" onSubmit={submit}>
      <div className="field field--wide">
        <label htmlFor="first-title">标题 <span>必填</span></label>
        <input id="first-title" value={title} maxLength={60} placeholder="第一次……" onChange={(event) => setTitle(event.target.value)} />
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="first-date">日期 <span>必填</span></label>
          <input id="first-date" type="date" required value={date} max={localToday()} onChange={(event) => setDate(event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="first-category">分类</label>
          <select id="first-category" value={category} onChange={(event) => setCategory(event.target.value as FirstCategory)}>
            {FIRST_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
      </div>
      <div className="field field--wide">
        <label htmlFor="first-note">一句话 <span>{note.length}/120</span></label>
        <textarea id="first-note" value={note} maxLength={120} rows={4} placeholder="留下一点当时的感受。" onChange={(event) => setNote(event.target.value)} />
      </div>
      <div className="field field--wide">
        <label htmlFor="first-image">照片 <span>可选 · 1 张</span></label>
        <input
          id="first-image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (!file) return
            const result = validateImageFile(file)
            if (!result.ok) {
              setError(result.reason === 'too-large' ? '照片太大，请选择 25MB 以内的图片。' : '请选择 JPEG、PNG 或 WebP 图片。')
              event.target.value = ''
              return
            }
            setError('')
            setImageFile(file)
            setRemoveExistingImage(false)
          }}
        />
        {previewUrl ? (
          <div className="image-preview">
            <img src={previewUrl} alt="New First preview" />
            <button type="button" onClick={() => {
              setImageFile(undefined)
              setRemoveExistingImage(false)
            }}>移除新照片</button>
          </div>
        ) : initial?.thumbnailId && !removeExistingImage ? (
          <div className="image-preview">
            <FirstImage imageId={initial.thumbnailId} alt={initial.title} />
            <button type="button" onClick={() => setRemoveExistingImage(true)}>移除现有照片</button>
          </div>
        ) : null}
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div className="form-actions">
        <button className="button button--ink" type="submit" disabled={busy}>{busy ? '保存中…' : submitLabel}</button>
      </div>
    </form>
  )
}
