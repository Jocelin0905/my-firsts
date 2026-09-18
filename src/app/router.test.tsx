import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AppRoutes } from './router'
import { AppDataProvider } from '../hooks/useAppData'
import { ToastProvider } from '../hooks/useToast'

const cases = [
  ['/', String(new Date().getFullYear())],
  ['/new', '记录第一次'],
  ['/first/example-id', '找不到这个 First'],
  ['/first/example-id/edit', '找不到这个 First'],
  ['/year/2025', '2025'],
  ['/year/2025/review', '2025'],
  ['/settings', 'Settings'],
] as const

describe('application routes', () => {
  beforeEach(() => localStorage.clear())

  function renderRoute(path: string) {
    return render(
      <MemoryRouter initialEntries={[path]}>
        <AppDataProvider>
          <ToastProvider><AppRoutes /></ToastProvider>
        </AppDataProvider>
      </MemoryRouter>,
    )
  }

  it.each(cases)('renders %s', (path, heading) => {
    renderRoute(path)

    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
  })

  it('renders a recoverable not-found page', () => {
    renderRoute('/missing')

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to this year' })).toHaveAttribute('href', '/')
  })
})
