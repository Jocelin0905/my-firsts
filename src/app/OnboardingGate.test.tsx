import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OnboardingGate } from './OnboardingGate'

describe('OnboardingGate', () => {
  it('shows onboarding once and persists completion', () => {
    localStorage.clear()
    const { rerender } = render(<OnboardingGate><p>Collection</p></OnboardingGate>)

    expect(screen.getByRole('heading', { name: 'My Firsts' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '开始记录' }))
    expect(screen.getByText('Collection')).toBeInTheDocument()

    rerender(<OnboardingGate><p>Collection</p></OnboardingGate>)
    expect(screen.queryByRole('button', { name: '开始记录' })).not.toBeInTheDocument()
  })
})
