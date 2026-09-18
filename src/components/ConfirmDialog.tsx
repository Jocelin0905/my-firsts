import { useEffect, useRef } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  onCancel: () => void
  onConfirm: () => void
  confirmLabel?: string
  danger?: boolean
}

export function ConfirmDialog({ open, title, description, onCancel, onConfirm, confirmLabel = '确认删除', danger = true }: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (open) cancelRef.current?.focus()
  }, [open])
  if (!open) return null

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-description">
        <p className="eyebrow">PLEASE CONFIRM</p>
        <h2 id="dialog-title">{title}</h2>
        <p id="dialog-description">{description}</p>
        <div className="dialog__actions">
          <button ref={cancelRef} className="button" type="button" onClick={onCancel}>取消</button>
          <button className={danger ? 'button button--danger' : 'button button--ink'} type="button" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </section>
    </div>
  )
}
