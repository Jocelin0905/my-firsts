import { describe, expect, it } from 'vitest'
import {
  chooseFallbackMimeType,
  fitWithin,
  validateImageFile,
} from './imageProcessor'

describe('image processing rules', () => {
  it('fits landscape and portrait images without enlarging them', () => {
    expect(fitWithin(4000, 2000, 1800)).toEqual({ width: 1800, height: 900 })
    expect(fitWithin(1000, 3000, 480)).toEqual({ width: 160, height: 480 })
    expect(fitWithin(320, 240, 1800)).toEqual({ width: 320, height: 240 })
  })

  it('preserves transparency when WebP export is unavailable', () => {
    expect(chooseFallbackMimeType(true)).toBe('image/png')
    expect(chooseFallbackMimeType(false)).toBe('image/jpeg')
  })

  it('accepts only supported image types within the input limit', () => {
    expect(validateImageFile(new File(['photo'], 'photo.jpg', { type: 'image/jpeg' }))).toEqual({ ok: true })
    expect(validateImageFile(new File(['gif'], 'animated.gif', { type: 'image/gif' }))).toMatchObject({ ok: false, reason: 'unsupported-type' })
    expect(validateImageFile(new File([new Uint8Array(26 * 1024 * 1024)], 'huge.png', { type: 'image/png' }))).toMatchObject({ ok: false, reason: 'too-large' })
  })
})
