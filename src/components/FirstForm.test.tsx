import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { FirstDraft } from '../domain/firsts'
import type { First } from '../domain/types'
import { FirstForm } from './FirstForm'

const existing: First = {
  id: 'first-1',
  number: 1,
  year: 2026,
  title: '第一次潜水',
  date: '2026-08-14',
  category: 'Travel',
  imageId: 'detail-1',
  thumbnailId: 'thumb-1',
  createdAt: '2026-08-14T00:00:00.000Z',
  updatedAt: '2026-08-14T00:00:00.000Z',
}

afterEach(() => vi.unstubAllGlobals())

describe('FirstForm image replacement', () => {
  it('keeps the existing image when a selected replacement is removed before saving', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn<(draft: FirstDraft, imageFile?: File, removeImage?: boolean) => Promise<void>>()
    onSubmit.mockResolvedValue(undefined)
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:preview'),
      revokeObjectURL: vi.fn(),
    })

    const { container } = render(<FirstForm initial={existing} submitLabel="保存修改" busy={false} onSubmit={onSubmit} />)
    expect(container.querySelector('form')).toHaveAttribute('novalidate')
    await user.upload(screen.getByLabelText(/照片/), new File(['image'], 'first.png', { type: 'image/png' }))
    await user.click(screen.getByRole('button', { name: '移除新照片' }))
    await user.click(screen.getByRole('button', { name: '保存修改' }))

    expect(onSubmit).toHaveBeenCalledOnce()
    expect(onSubmit.mock.calls[0][1]).toBeUndefined()
    expect(onSubmit.mock.calls[0][2]).toBe(false)
  })
})
