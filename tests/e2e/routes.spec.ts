import { expect, test } from '@playwright/test'
import { skipOnboarding } from './helpers'

test.beforeEach(async ({ page }) => skipOnboarding(page))

for (const path of ['/', '/new', '/year/2025', '/year/2025/review', '/settings']) {
  test(`loads and refreshes ${path}`, async ({ page }) => {
    await page.goto(path)
    await expect(page.locator('body')).toBeVisible()
    await page.reload()
    await expect(page.locator('body')).toBeVisible()
    await expect(page.locator('text=Page not found')).toHaveCount(0)
  })
}

test('shows recoverable states for missing detail routes', async ({ page }) => {
  await page.goto('/first/missing')
  await expect(page.getByRole('heading', { name: '找不到这个 First' })).toBeVisible()
  await page.goto('/first/missing/edit')
  await expect(page.getByRole('heading', { name: '找不到这个 First' })).toBeVisible()
})
