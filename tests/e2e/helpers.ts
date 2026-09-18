import type { Page } from '@playwright/test'

export async function skipOnboarding(page: Page) {
  await page.addInitScript(() => localStorage.setItem('my-firsts:onboarding-complete', 'true'))
}

export function todayLocal() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}
